
const ticketService = require('../services/ticket.service.js');


const createTicket = async (req, res) => {
    try {
        const ticketData = req.body;
        const customerId = req.user.id; 

        const newTicket = await ticketService.createTicket(ticketData, customerId);

        res.status(201).json({
            message: "Support ticket created successfully. We will get back to you soon.",
            ticket: newTicket
        });

    } catch (error) {
        res.status(400).json({ message: "Failed to create ticket: " + error.message });
    }
};

const getTicketById = async (ticketId) => {
    const ticket = await db.Ticket.findByPk(ticketId, {
        // Poori details include karo
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
    getTicketById,
    updateTicketStatus
};