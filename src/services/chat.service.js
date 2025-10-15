const db = require('../../models');
const { Chat, User, Sequelize } = db;  
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

const getChatSessions = async () => {
    
    const sessions = await Chat.findAll({
        attributes: [
            'customerId',
            [Sequelize.fn('COUNT', Sequelize.literal('CASE WHEN "isReadByAdmin" = false THEN 1 END')), 'unreadCount'],
            [Sequelize.fn('MAX', Sequelize.col('Chat.createdAt')), 'lastMessageAt'] 
        ],
        group: ['customerId', 'Customer.id', 'Customer.fullName'],
        order: [['lastMessageAt', 'DESC']],
        include: {
            model: User,
            as: 'Customer',
            attributes: ['id', 'fullName']
        },
        raw: true
    });
    return sessions.map(s => ({
        customerId: s.customerId,
        customerName: s['Customer.fullName'],
        unreadCount: parseInt(s.unreadCount, 10),
        lastMessageAt: s.lastMessageAt
    }));
};

const markMessagesAsReadByAdmin = async (customerId) => {
    const [affectedCount] = await Chat.update(
        { isReadByAdmin: true },
        {
            where: {
                customerId: customerId,
                isReadByAdmin: false
            }
        }
    );
    return { messagesMarkedAsRead: affectedCount };
};

module.exports = {
    getChatHistory,
    clearChatForCustomer,
    getChatSessions,
    markMessagesAsReadByAdmin
};