"use strict";

const db = require("../../models");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const { BookingParcel, User, Zone, Media } = db;
const sendEmail = require("./notification.service.js");
const invoiceService = require("./invoice.service.js");
const { Op, Sequelize } = require("sequelize");
const { validatePickupSlot } = require('../utils/validators.js');



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
    pickupZoneId,
    deliveryZoneId,
  } = parcelData;

   if (deliveryType === 'scheduled') {
    validatePickupSlot(pickupSlot);
}


  if (!pickupZoneId || !deliveryZoneId || !deliveryType) {
    throw new Error(
      "Pickup zone, Delivery zone, and Delivery Type are required."
    );
  }
  if (deliveryType === "scheduled" && !pickupSlot) {
    throw new Error("Pickup Slot is required for scheduled delivery.");
  }
  
  if (packageWeight > 50) {
      throw new Error("Maximum weight limit is 50kg. Please contact support for heavier parcels.");
  }
  const pickupPricing = await db.Pricing.findOne({
    where: { zoneId: pickupZoneId },
  });
  const deliveryPricing = await db.Pricing.findOne({
    where: { zoneId: deliveryZoneId },
  });
  if (!pickupPricing || !deliveryPricing) {
    throw new Error("Invalid zone provided. Pricing not available.");
  }
  let totalCharge = 0;
  if (pickupZoneId === deliveryZoneId) {
    totalCharge = pickupPricing.baseFare;
  } else {
    totalCharge = pickupPricing.baseFare + deliveryPricing.baseFare;
  }
  if (packageWeight > 5) {
      const weightSlab = await db.WeightSlab.findOne({
          where: {
              minWeight: { [Op.lt]: packageWeight }, 
              maxWeight: { [Op.gte]: packageWeight } 
          }
      });
      if (weightSlab) {
          totalCharge += weightSlab.charge;
      } else if (packageWeight <= 50) { 
          console.warn(`No weight slab found for weight: ${packageWeight}kg. Extra weight charge not applied.`);
      }
  }
  if (deliveryType === "instant") {
    const expressPercent =
      (pickupPricing.expressChargePercent +
        deliveryPricing.expressChargePercent) /
      2;
    if (expressPercent > 0) {
        totalCharge *= 1 + expressPercent / 100;
    }
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
    pickupZoneId: pickupZoneId,
    deliveryZoneId: deliveryZoneId,
    customerId: customerId,
    trackingNumber: trackingNumber,
    deliveryCharge: Math.round(totalCharge),
    status: "unconfirmed",
    paymentStatus: "pending",
  });
  return {
    parcelId: parcel.id,
    totalCharges: parcel.deliveryCharge,
  };
};

const confirmCodBooking = async (parcelId, customerId) => {
  let parcel = await BookingParcel.findOne({
    where: { id: parcelId, customerId: customerId },
    include: [
      {
        model: db.Zone,
        as: "PickupZone",
        attributes: ["name"],
      },
      {
        model: db.Zone,
        as: "DeliveryZone",
        attributes: ["name"],
      },
    ],
  });
  if (!parcel || parcel.status !== "unconfirmed") {
    throw new Error("Invalid parcel or parcel has already been processed.");
  }
   if (parcel.paymentStatus === 'completed') {
      throw new Error(`This parcel has already been paid for via ${parcel.paymentMethod}. COD confirmation is not needed.`);
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
      const invoiceUrl = invoiceService.generateBookingInvoice(
        parcel,
        customer
      );
      await Media.create({
        url: invoiceUrl,
        mediaType: "BOOKING_INVOICE",
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


const getMyParcels = async (customerId, pageParam = 1, limitParam = 10) => {
  const page = Math.max(parseInt(pageParam) || 1, 1);
  const limit = Math.max(parseInt(limitParam) || 10, 1);
  const offset = (page - 1) * limit;

  const whereClause = {
    customerId: customerId,
    status: {
      [Op.notIn]: ["unconfirmed", "cancelled"],
    },
  };
  const { count, rows: parcels } = await db.BookingParcel.findAndCountAll({
    where: whereClause,
    order: [['id', 'DESC']],
    limit: limit,
    offset: offset
  });
  const modifiedParcels = parcels.map(parcel => {
        const parcelData = parcel.toJSON(); 

    if (parcelData.status === 'scheduled') {
      parcelData.status = 'order_placed';
    }
        return parcelData;
  });
  
  return {
    parcels: modifiedParcels, 
    pagination: {
      totalItems: count,
      currentPage: page,
      itemsPerPage: limit,
      totalPages: Math.ceil(count / limit),
    }
  };
};

const getAllParcels = async (filterType = null, pageParam = 1, limitParam = 10, searchTerm = null) => {
    const page = Math.max(parseInt(pageParam) || 1, 1);
    const limit = Math.max(parseInt(limitParam) || 10, 1);
    const offset = (page - 1) * limit;
    const whereConditions = []; 

    let statusFilter;
    switch (filterType) {
        case 'active':
            statusFilter = { status: { [Op.in]: ['picked_up', 'in_transit', 'out_for_delivery', 'delivered'] } };
            break;
        case 'scheduled':
            statusFilter = { status: 'scheduled' };
            break;
        case 'order_placed':
            statusFilter = { status: 'order_placed' };
            break;
        case 'cancelled':
            statusFilter = {
                status: 'cancelled',
                paymentStatus: { [Op.in]: ['pending', 'completed'] }
            };
            break;
        default:
            statusFilter = { status: { [Op.notIn]: ['unconfirmed', 'cancelled'] } };
            break;
    }
    whereConditions.push(statusFilter);
      if (searchTerm && searchTerm.trim() !== '') {
        const keywords = searchTerm.trim().split(/\s+/);
        const keywordSearchConditions = keywords.map(keyword => {
            const conditions = [];
            conditions.push({ paymentStatus: { [Op.iLike]: `%${keyword}%` } });
            conditions.push(Sequelize.where(Sequelize.col('Customer.fullName'), { [Op.iLike]: `%${keyword}%` }));
            
            if (!isNaN(keyword)) {
                conditions.push({ id: parseInt(keyword, 10) });
            }
            
            return { [Op.or]: conditions };
        });
            whereConditions.push(...keywordSearchConditions);
    }

     const { count, rows: parcels } = await db.BookingParcel.findAndCountAll({
        where: { [Op.and]: whereConditions }, 
        order: [['id', 'DESC']],
        include: [
            {
                model: db.User,
                as: 'Customer',
                attributes: ['id', 'fullName', 'email'],
            },
            {
                model: db.User,
                as: 'Agent',
                attributes: ['id', 'fullName'],
                required: false
            }
        ],
        subQuery: false, 
        limit: limit,
        offset: offset
    });
    return {
        parcels,
        pagination: {
            totalItems: count, 
            currentPage: page,
            itemsPerPage: limit,
            totalPages: Math.ceil(count / limit),
        }
    };
};

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

const getAgentParcelsByType = async (agentId, filterType, pageParam = 1, limitParam = 10) => {
    const page = Math.max(parseInt(pageParam) || 1, 1);
    const limit = Math.max(parseInt(limitParam) || 10, 1);
    const offset = (page - 1) * limit;
    const whereClause = { agentId: agentId };
    switch (filterType) {
        case 'pending':
            whereClause.status = 'order_placed';
            whereClause.agentAcceptanceStatus = 'pending';
            break;
        case 'active':
            whereClause.status = { [Op.in]: ['scheduled', 'picked_up', 'in_transit', 'out_for_delivery'] };
            break;
        case 'completed':
            whereClause.status = 'delivered';
            break;
        default:
            whereClause.status = { [Op.notIn]: ['cancelled', 'unconfirmed'] };
            break;
    }
        const { count, rows: parcels } = await db.BookingParcel.findAndCountAll({
        where: whereClause,
        order: [['id', 'DESC']], 
        include: {
            model: db.User,
            as: 'Customer',
            attributes: ['fullName', 'phoneNumber', 'address']
        },
        limit: limit,
        offset: offset
    });
    return {
        parcels,
        pagination: {
            totalItems: count,
            currentPage: page,
            itemsPerPage: limit,
            totalPages: Math.ceil(count / limit),
        }
    };
};


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
    include: [
      { model: db.Zone, as: "PickupZone", attributes: ["name"] },
      { model: db.Zone, as: "DeliveryZone", attributes: ["name"] },
      { model: db.User, as: "Customer" },
    ],
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
  if (newIndex === -1 || (currentIndex !== -1 && newIndex < currentIndex)) {
    throw new Error(
      `Invalid status transition from '${parcel.status}' to '${newStatus}'.`
    );
  }
  parcel.status = newStatus;

  if (newStatus === "delivered") {
    if (!parcel.agentCommission && parcel.paymentMethod !== "COD") {
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
      const calculatedCommission =
        parcel.deliveryCharge * (commissionRate / 100);
      parcel.agentCommission = Math.round(calculatedCommission);
      parcel.remainingAmount = parcel.deliveryCharge - parcel.agentCommission;
    }
    try {
      if (parcel.Customer) {
        const deliveryInvoiceUrl = invoiceService.generateDeliveryInvoice(
          parcel,
          parcel.Customer
        );
        await db.Media.create({
          url: deliveryInvoiceUrl,
          mediaType: "DELIVERY_INVOICE",
          relatedId: parcel.id,
          relatedType: "parcel",
        });
        console.log(
          `✅ Delivery invoice created for delivered parcel ${parcel.id}`
        );
      }
    } catch (err) {
      console.error(
        `!!! Failed to create delivery invoice for parcel ${parcel.id}:`,
        err
      );
    }
  }
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
  try {
    validatePickupSlot(pickupSlot);
  } catch (err) {
    console.error("[PickupSlot Validation Failed]:", err.message);
    throw new Error(err.message || "Invalid pickup slot format or timing.");
  }

  try {
    await parcel.update({
      status: "order_placed",
      agentId: null,
      pickupSlot: pickupSlot,
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
  if (!parcel) {
    throw new Error("Parcel not found or not assigned to you.");
  }
  if (parcel.agentAcceptanceStatus === "accepted") {
    throw new Error("You cannot reject a job after accepting it.");
  }
  if (parcel.agentAcceptanceStatus === "rejected") {
    return {
      message: "This job has already been rejected.",
      parcel,
    };}
  parcel.agentAcceptanceStatus = "rejected";
  parcel.agentRejectionReason = reason;
  parcel.status = "order_placed";
  await parcel.save();
  return {
    message: "Job rejected successfully.",
    parcel,
  };
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

const cancelParcelByUser = async (parcelId, customerId) => {
  const parcel = await db.BookingParcel.findOne({
    where: {
      id: parcelId,
      customerId: customerId,
    },
  });
  if (!parcel) {
    throw new Error("Parcel not found or you are not authorized to cancel it.");
  }
  if (parcel.status !== "unconfirmed") {
    throw new Error(
      "This parcel cannot be cancelled as it has already been confirmed or processed."
    );
  }
  parcel.status = "cancelled";
  parcel.paymentStatus = "cancelled";
  await parcel.save();
  return parcel;
};

const getAllInvoicePaths = async (parcelId, user) => {
  if (user.role !== "admin") {
    throw new Error("You are not authorized to perform this action.");
  }
  const parcel = await db.BookingParcel.findByPk(parcelId);
  if (!parcel) throw new Error("Parcel not found.");
  const allInvoices = await db.Media.findAll({
    where: {
      relatedId: parcelId,
      relatedType: "parcel",
      mediaType: {
        [db.Sequelize.Op.in]: ["BOOKING_INVOICE", "DELIVERY_INVOICE"],
      },
    },
    attributes: ["url", "mediaType"],
  });
  return allInvoices;
};

const getInvoicePathForUser = async (parcelId, user, invoiceType) => {
  if (!invoiceType) {
    throw new Error("Invoice type must be specified.");
  }
  const parcel = await db.BookingParcel.findByPk(parcelId);
  if (!parcel) throw new Error("Parcel not found.");
  if (user.role !== "admin" && parcel.customerId !== user.id) {
    throw new Error("You are not authorized to view this invoice.");
  }
  const invoiceMedia = await db.Media.findOne({
    where: {
      relatedId: parcelId,
      relatedType: "parcel",
      mediaType: invoiceType,
    },
  });
  if (!invoiceMedia) throw new Error("The specified invoice does not exist.");
  return invoiceMedia.url;
};

const getCustomerDashboardStats = async (customerId) => {
  const relevantStatuses = [
    "order_placed",
    "scheduled",
    "picked_up",
    "in_transit",
    "out_for_delivery",
    "delivered",
  ];
  const statusCounts = await db.BookingParcel.findAll({
    where: {
      customerId: customerId,
      status: {
        [Op.in]: relevantStatuses,
      },},
    group: ["status"],
    attributes: [
      "status",
      [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
    ],
    raw: true,
  });
  const stats = {
    totalBookings: 0,
    order_placed: 0,
    picked_up: 0,
    in_transit: 0,
    out_for_delivery: 0,
    delivered: 0,
  };
  for (const item of statusCounts) {
    const status = item.status;
    const count = parseInt(item.count, 10);
    if (status === "scheduled") {
      stats.order_placed += count;
    } else if (stats.hasOwnProperty(status)) {
      stats[status] = count;
    }
  }
  stats.totalBookings =
    stats.order_placed +
    stats.picked_up +
    stats.in_transit +
    stats.out_for_delivery +
    stats.delivered;
  return stats;
};

const getTotalCommission = async (agentId) => {
    const result = await BookingParcel.findOne({
        where: {
            agentId: agentId
        },
        attributes: [
            [Sequelize.fn('SUM', Sequelize.col('agentCommission')), 'totalCommission']
        ],
        raw: true 
    });
    const totalCommission = parseFloat(result.totalCommission) || 0;
    return {
        totalCommission: totalCommission
    };
};


module.exports = {
  prepareCheckout,
  confirmCodBooking,
  getMyParcels,
  getAllParcels,
  getParcelById,
  assignAgentToParcel,
  updateParcelStatusByAgent,
  getParcelFiles,
  cancelParcelByAdmin,
  rescheduleParcelByAdmin,
  acceptJobByAgent,
  rejectJobByAgent,
  confirmCodPaymentByAdmin,
  cancelParcelByUser,
  getInvoicePathForUser,
  getAllInvoicePaths,
  getCustomerDashboardStats,
  getAgentParcelsByType,
  getTotalCommission,
};
