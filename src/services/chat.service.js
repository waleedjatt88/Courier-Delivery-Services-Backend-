const db = require('../../models');
const { Chat, User } = db;
const { Op } = require('sequelize');


const getChatHistory = async (customerId, requesterId, requesterRole) => {
    if (requesterRole !== 'admin' && customerId.toString() !== requesterId.toString()) {
        throw new Error('Forbidden: You are not authorized to view this chat.');
    }

    const whereClause = {
        customerId: customerId
    };

    if (requesterRole === 'customer') {
        whereClause.clearedByCustomer = false;
    }

    const messages = await Chat.findAll({
        where: whereClause,
        order: [['createdAt', 'ASC']], 
        include: [
            { model: User, as: 'Customer', attributes: ['id', 'fullName'] },
            { model: User, as: 'Admin', attributes: ['id', 'fullName'] }
        ]
    });

    return messages;
};

const clearChatForCustomer = async (customerId) => {
    const [numberOfAffectedRows] = await db.Chat.update(
        { clearedByCustomer: true }, 
        { where: { customerId: customerId } } 
    );

    if (numberOfAffectedRows > 0) {
        return { message: `Chat history cleared for customer ${customerId}.` };
    } else {
        return { message: "No chat history found to clear." };
    }
};

module.exports = {
    getChatHistory,
    clearChatForCustomer 
};