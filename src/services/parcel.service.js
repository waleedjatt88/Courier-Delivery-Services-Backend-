"use strict";

const db = require("../../models");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const { BookingParcel, User, Media } = db;
const sendEmail = require("./notification.service.js");
const invoiceService = require("./invoice.service.js");

/**
 *
 * @param {object} parcelData
 * @param {number} customerId
 * @returns {object}
 */
const prepareCheckout = async (parcelData, customerId) => {
  const {
    pickupAddress,
    deliveryAddress,
    packageWeight,
    packageSize,
    packageContent,
    pickupSlot,
    specialInstructions,
    deliveryType,
    zoneId,
  } = parcelData;

  if (!zoneId || !deliveryType) {
    throw new Error("Zone and Delivery Type are required.");
  }
  if (deliveryType === "scheduled" && !pickupSlot) {
    throw new Error("Pickup Slot is required for scheduled delivery.");
  }

  const pricingRule = await db.Pricing.findOne({ where: { zoneId: zoneId } });
  if (!pricingRule) {
    throw new Error(
      "Pricing for the selected zone is not available. Please contact support."
    );
  }

  let totalCharge = pricingRule.baseFare;

  const weightThreshold = 5;
  if (packageWeight > weightThreshold) {
    const extraWeight = packageWeight - weightThreshold;
    totalCharge += extraWeight * pricingRule.perKgCharge;
  }

  if (deliveryType === "instant") {
    const expressFee = totalCharge * (pricingRule.expressChargePercent / 100);
    totalCharge += expressFee;
  }

  const uniquePart = uuidv4().split("-").pop().toUpperCase();
  const trackingNumber = `PK-${uniquePart}`;

  const parcel = await BookingParcel.create({
    pickupAddress,
    deliveryAddress,
    packageWeight,
    packageSize,
    packageContent,
    pickupSlot,
    specialInstructions,
    deliveryType,
    customerId: customerId,
    trackingNumber: trackingNumber,
    deliveryCharge: Math.round(totalCharge),
    status: "unconfirmed",
    paymentStatus: "pending",
    zoneId: zoneId,
  });
  return {
    parcelId: parcel.id,
    totalCharges: parcel.deliveryCharge,
  };
};
const confirmCodBooking = async (parcelId, customerId) => {
  let parcel = await BookingParcel.findOne({
    where: { id: parcelId, customerId: customerId },
  });
  if (!parcel || parcel.status !== "unconfirmed") {
    throw new Error("Invalid parcel or parcel has already been processed.");
  }

  parcel.paymentMethod = "COD";
  parcel.status = "order_placed";
  await parcel.save();

  try {
    const pickupResponse = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json`,
      {
        params: {
          address: parcel.pickupAddress,
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
      }
    );
    const deliveryResponse = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json`,
      {
        params: {
          address: parcel.deliveryAddress,
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
      }
    );

    if (
      pickupResponse.data.results.length > 0 &&
      deliveryResponse.data.results.length > 0
    ) {
      parcel.pickupLat = pickupResponse.data.results[0].geometry.location.lat;
      parcel.pickupLng = pickupResponse.data.results[0].geometry.location.lng;
      parcel.deliveryLat =
        deliveryResponse.data.results[0].geometry.location.lat;
      parcel.deliveryLng =
        deliveryResponse.data.results[0].geometry.location.lng;
      await parcel.save();
    }
  } catch (geoError) {
    console.error("!!! Geocoding Error on COD confirm:", geoError.message);
  }

  try {
    const customer = await User.findByPk(customerId);
    if (customer) {
      const invoiceUrl = invoiceService.generateInvoice(parcel, customer);
      await Media.create({
        url: invoiceUrl,
        mediaType: "PARCEL_INVOICE",
        relatedId: parcel.id,
        relatedType: "parcel",
      });

      await sendEmail({
        email: customer.email,
        subject: `Parcel Booked! Tracking ID: ${parcel.trackingNumber}`,
        template: "parcelBooked",
        data: {
          customerName: customer.fullName,
          trackingNumber: parcel.trackingNumber,
          status: parcel.status,
          pickupAddress: parcel.pickupAddress,
          deliveryAddress: parcel.deliveryAddress,
          deliveryCharge: parcel.deliveryCharge,
          paymentMethod: parcel.paymentMethod,
        },
      });
    }
  } catch (error) {
    console.error("!!! Invoice/Email Error on COD confirm:", error);
  }

  await parcel.reload();
  return parcel;
};

/**
 *
 * @param {number} customerId
 * @returns {Array}
 */
const getMyParcels = async (customerId) => {
  const parcels = await db.BookingParcel.findAll({
    where: {
      customerId: customerId,
    },
    order: [["createdAt", "DESC"]],
  });
  return parcels;
};

/**
 *
 * @returns {Array}
 */
const getAllParcels = async () => {
  const parcels = await db.BookingParcel.findAll({
    order: [["createdAt", "DESC"]],
    include: {
      model: db.User,
      as: "Customer",
      attributes: ["id", "fullName", "email"],
    },
  });
  return parcels;
};

/**
 *
 * @param {number} parcelId
 * @returns {object}
 */
const getParcelById = async (parcelId) => {
  const parcel = await db.BookingParcel.findByPk(parcelId, {
    include: [
      {
        model: db.User,
        as: "Customer",
        attributes: ["id", "fullName", "email", "phoneNumber"],
      },
      {
        model: db.User,
        as: "Agent",
        attributes: ["id", "fullName", "email", "phoneNumber"],
      },
    ],
  });
  return parcel;
};

/**
 *
 * @param {number} parcelId
 * @param {number} agentId
 * @returns {object}
 */
const assignAgentToParcel = async (parcelId, agentId) => {
  const parcel = await db.BookingParcel.findByPk(parcelId);
  if (!parcel) {
    throw new Error("Parcel not found with this ID.");
  }
  if (parcel.agentAcceptanceStatus === "accepted") {
    throw new Error(
      `This parcel already has an assigned agent (ID: ${parcel.agentId}). Current parcel status: '${parcel.status}'.`
    );
  }

  if (parcel.status !== "order_placed") {
    throw new Error(
      `This parcel cannot be assigned because its current status is '${parcel.status}'.`
    );
  }

  const agent = await db.User.findByPk(agentId);
  if (!agent) {
    throw new Error("Agent not found with this ID.");
  }

  if (agent.role !== "agent") {
    throw new Error(`User with ID ${agentId} is not a delivery agent.`);
  }
  if (
    parcel.agentAcceptanceStatus === "rejected" &&
    parcel.agentId === agentId &&
    parcel.agentRejectionReason &&
    !parcel.agentRejectionReason.startsWith("Auto-rejected")
  ) {
    throw new Error(
      `This agent previously rejected the job. Reason: "${parcel.agentRejectionReason}". Please assign another agent.`
    );
  }

  parcel.agentId = agentId;
  parcel.status = "order_placed";
  parcel.assignedAt = new Date();
  parcel.agentAcceptanceStatus = "pending";
  parcel.agentRejectionReason = null;

  await parcel.save();

  return parcel;
};

/**
 *
 * @param {number} agentId
 * @returns {Array}
 */
const getParcelsByAgentId = async (agentId) => {
  const parcels = await db.BookingParcel.findAll({
    where: {
      agentId: agentId,
    },
    order: [["createdAt", "ASC"]],
    include: {
      model: db.User,
      as: "Customer",
      attributes: ["fullName", "phoneNumber"],
    },
  });
  return parcels;
};

const getParcelFiles = async (parcelId, customerId) => {
  const parcel = await db.BookingParcel.findOne({
    where: { id: parcelId, customerId: customerId },
  });
  if (!parcel) {
    throw new Error("Parcel not found or you are not authorized.");
  }

  const files = await db.Media.findAll({
    where: {
      relatedId: parcelId,
      relatedType: "parcel",
    },
  });

  return files;
};

const updateParcelStatusByAgent = async (parcelId, agentId, newStatus) => {
  const parcel = await db.BookingParcel.findOne({
    where: { id: parcelId, agentId },
  });
  if (!parcel) throw new Error("Parcel not found or not assigned to you.");
  if (parcel.agentAcceptanceStatus !== "accepted")
    throw new Error("You must accept the job first.");

  const agentAllowedStatuses = [
    "picked_up",
    "in_transit",
    "out_for_delivery",
    "delivered",
  ];
  if (!agentAllowedStatuses.includes(newStatus)) {
    throw new Error("Invalid status update by agent.");
  }
  if (parcel.status === "delivered") {
    throw new Error("Parcel already delivered. Status cannot be changed.");
  }
  const currentIndex = agentAllowedStatuses.indexOf(parcel.status);
  const newIndex = agentAllowedStatuses.indexOf(newStatus);

  if (newIndex === -1 || newIndex !== currentIndex + 1) {
    throw new Error(
      `Invalid status transition. Must follow sequence: ${agentAllowedStatuses.join(
        " -> "
      )}`
    );
  }
  if (newStatus === "delivered" && !parcel.agentCommission) {
    if (parcel.paymentMethod !== "COD") {
      let commissionRate = 10.0; 

      const globalZone = await db.Zone.findOne({
        where: { name: "GLOBAL_SETTINGS" },
      });

      if (globalZone) {
        const globalPricingRule = await db.Pricing.findOne({
          where: { zoneId: globalZone.id },
        });

        if (globalPricingRule && globalPricingRule.agentCommissionPercent) {
          commissionRate = globalPricingRule.agentCommissionPercent;
        }
      }

      const calculatedCommission = parcel.deliveryCharge * (commissionRate / 100);
      const calculatedRemaining = parcel.deliveryCharge - calculatedCommission;

      parcel.agentCommission = Math.round(calculatedCommission);
      parcel.remainingAmount = Math.round(calculatedRemaining);
    }
  }

  parcel.status = newStatus;
  await parcel.save();
  return {
    id: parcel.id,
    status: parcel.status,
  };
};
const getGlobalCommissionRate = async () => {
  let commissionRate = 10.0; 

  const globalZone = await db.Zone.findOne({
    where: { name: "GLOBAL_SETTINGS" },
  });

  if (globalZone) {
    const globalPricingRule = await db.Pricing.findOne({
      where: { zoneId: globalZone.id },
    });
    if (globalPricingRule && globalPricingRule.agentCommissionPercent) {
      commissionRate = globalPricingRule.agentCommissionPercent;
    }
  }
  return commissionRate;
};

/**
 *
 * @param {number} parcelId
 * @returns {object}
 */
const cancelParcelByAdmin = async (parcelId) => {
  const parcel = await db.BookingParcel.findByPk(parcelId);
  if (!parcel) {
    throw new Error("Parcel not found.");
  }

  if (parcel.status === "delivered") {
    throw new Error("Cannot cancel a parcel that has already been delivered.");
  }

  parcel.status = "cancelled";
  parcel.agentId = null;
  await parcel.save();

  return parcel;
};

/**
 *
 * @param {number} parcelId
 * @param {Date} pickupSlot
 * @returns {object}
 */
const rescheduleParcelByAdmin = async (parcelId, pickupSlot) => {
  const parcel = await db.BookingParcel.findByPk(parcelId);
  if (!parcel) {
    throw new Error("Parcel not found.");
  }

  if (parcel.status !== "cancelled") {
    throw new Error(
      `Only cancelled parcels can be rescheduled. Current status: '${parcel.status}'.`
    );
  }

  if (!pickupSlot || pickupSlot.trim() === "") {
    throw new Error("New pickup slot is required when rescheduling.");
  }

  const originalPickupSlot = pickupSlot;

  try {
    await parcel.update({
      status: "order_placed",
      agentId: null,
      pickupSlot: originalPickupSlot,
      updatedAt: new Date(),
    });

    await parcel.reload();
    return parcel;
  } catch (error) {
    console.error("Error in rescheduleParcelByAdmin:", error);
    throw new Error("Failed to reschedule parcel. Please try again.");
  }
};

const acceptJobByAgent = async (parcelId, agentId) => {
  const parcel = await db.BookingParcel.findOne({
    where: { id: parcelId, agentId: agentId },
  });
  if (!parcel) throw new Error("Parcel not found or not assigned to you.");

  if (parcel.agentAcceptanceStatus === "accepted") {
    throw new Error("You have already accepted this job.");
  }

  if (new Date() > new Date(parcel.assignedAt.getTime() + 10 * 60 * 1000)) {
    parcel.agentAcceptanceStatus = "rejected";
    parcel.agentRejectionReason = "Auto-rejected: Timed out";
    parcel.agentId = null;
    parcel.status = "order_placed";
    await parcel.save();
    throw new Error("Acceptance time has expired. Job has been unassigned.");
  }

  parcel.agentAcceptanceStatus = "accepted";
  parcel.status = "scheduled";
  await parcel.save();
  return parcel;
};

const rejectJobByAgent = async (parcelId, agentId, reason) => {
  if (!reason || reason.trim() === "") {
    throw new Error("Rejection reason is required.");
  }

  const parcel = await db.BookingParcel.findOne({
    where: { id: parcelId, agentId: agentId },
  });
  if (!parcel) throw new Error("Parcel not found or not assigned to you.");

  if (parcel.agentAcceptanceStatus === "accepted") {
    throw new Error("You cannot reject a job after accepting it.");
  }

  parcel.agentAcceptanceStatus = "rejected";
  parcel.agentRejectionReason = reason;
  parcel.status = "order_placed";
  await parcel.save();

  return parcel;
};

const confirmCodPaymentByAdmin = async (parcelId) => {
  const parcel = await db.BookingParcel.findByPk(parcelId);
  if (!parcel) throw new Error("Parcel not found.");
  if (parcel.paymentMethod !== "COD")
    throw new Error("This is not a COD order.");
  if (parcel.status !== "delivered")
    throw new Error("Payment can only be confirmed for delivered parcels.");
  if (parcel.paymentStatus === "completed")
    throw new Error("Payment for this parcel is already completed.");

  const commissionRate = await getGlobalCommissionRate();
  const calculatedCommission = parcel.deliveryCharge * (commissionRate / 100);
  const calculatedRemaining = parcel.deliveryCharge - calculatedCommission;

  parcel.agentCommission = Math.round(calculatedCommission);
  parcel.remainingAmount = Math.round(calculatedRemaining);
  parcel.paymentStatus = "completed";

  await parcel.save();
  return parcel;
};

module.exports = {
  prepareCheckout,
  confirmCodBooking,
  getMyParcels,
  getAllParcels,
  getParcelById,
  assignAgentToParcel,
  getParcelsByAgentId,
  updateParcelStatusByAgent,
  getParcelFiles,
  cancelParcelByAdmin,
  rescheduleParcelByAdmin,
  acceptJobByAgent,
  rejectJobByAgent,
  confirmCodPaymentByAdmin,
};
