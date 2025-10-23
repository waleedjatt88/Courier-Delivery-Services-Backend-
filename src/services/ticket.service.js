
const db = require('../../models');
const { Ticket, BookingParcel } = db; 


const createTicket = async (ticketData, customerId) => {
    const { subject, description, trackingNumber } = ticketData;
    if (!subject || !description) {
        throw new Error("Subject and description are required.");
    }
    let parcelId = null; 
    if (trackingNumber && trackingNumber.trim() !== '') {
        const parcel = await BookingParcel.findOne({
            where: {
                trackingNumber: trackingNumber,
                customerId: customerId 
            }
        });
        if (!parcel) {
            throw new Error(`Invalid Tracking ID or this parcel does not belong to you.`);
        }
        parcelId = parcel.id;
    }
    const newTicket = await Ticket.create({
        subject: subject,
        description: description,
        parcelId: parcelId, 
        customerId: customerId,
        status: 'open'
    });

    return newTicket;
};

const getAllTickets = async (pageParam = 1, limitParam = 10) => {
    const page = Math.max(parseInt(pageParam) || 1, 1);
    const limit = Math.max(parseInt(limitParam) || 10, 1);
    const offset = (page - 1) * limit;
    const { count, rows: tickets } = await db.Ticket.findAndCountAll({
        order: [['status', 'ASC'], ['createdAt', 'DESC']], 
        include: [
            {
                model: db.User, 
                attributes: ['id', 'fullName', 'email']
            },
            {
                model: db.BookingParcel, 
                attributes: ['id', 'trackingNumber']
            }
        ],
        limit: limit,
        offset: offset
    });
    return {
        tickets,
        pagination: {
            totalItems: count,
            currentPage: page,
            itemsPerPage: limit,
            totalPages: Math.ceil(count / limit),
        }
    };
};

const getTicketById = async (ticketId) => {
    const ticket = await db.Ticket.findByPk(ticketId, {
        
        include: [
            { model: db.User, attributes: ['id', 'fullName', 'email'] },
            { model: db.BookingParcel, attributes: ['id', 'trackingNumber'] }
        ]
    });
    if (!ticket) throw new Error("Ticket not found.");
    return ticket;
};

const updateTicketStatus = async (ticketId, newStatus) => {
    const ticket = await db.Ticket.findByPk(ticketId);
    if (!ticket) throw new Error("Ticket not found.");
    if (ticket.status === 'closed') {
        throw new Error("This ticket is already closed.");
    }
    const allowedStatuses = ['in_progress', 'closed'];
    if (!allowedStatuses.includes(newStatus)) {
        throw new Error("Invalid status provided.");
    }
    ticket.status = newStatus;
    await ticket.save();
    return ticket;
};

module.exports = {
    createTicket,
    getAllTickets ,
    getTicketById,
    updateTicketStatus
};