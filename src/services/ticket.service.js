
const db = require('../../models');
const { Ticket } = db; 


const createTicket = async (ticketData, customerId) => {

    const { subject, description, parcelId } = ticketData;
    if (!subject || !description) {
        throw new Error("Subject and description are required.");
    }

    
    const newTicket = await Ticket.create({
        subject: subject,
        description: description,
        parcelId: parcelId || null,
        customerId: customerId, 
        status: 'open' 
    });

    return newTicket;
};

/**
 * 
 * 
 * @returns {Array} 
 */
const getAllTickets = async () => {
    const tickets = await db.Ticket.findAll({
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
        ]
    });
    return tickets;
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