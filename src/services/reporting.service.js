const db = require('../../models');
const { BookingParcel, User } = db;
const { Op } = require('sequelize');

const getDateRange = (period) => {
    const end = new Date();
    const start = new Date();
    if (period === 'daily') {
        start.setHours(0, 0, 0, 0);
    } else if (period === 'monthly') {
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
    } else if (period === 'yearly') {
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
    }
    return { start, end };
};

const getDashboardStats = async (period) => {
    const { start, end } = getDateRange(period);
    const periodWhere = { createdAt: { [Op.between]: [start, end] } };

    const totalBookings = await BookingParcel.count({ where: periodWhere });
    
    const revenue = await BookingParcel.sum('deliveryCharge', { 
        where: { 
            paymentStatus: 'completed',
            ...periodWhere 
        }
    });    
    
    return { totalBookings, totalRevenue: revenue || 0 };
};

const getAgentPerformance = async (agentId) => {
    const deliveredCount = await BookingParcel.count({ where: { agentId, status: 'delivered' } });
    const totalAssigned = await BookingParcel.count({ where: { agentId } });
    const successRate = totalAssigned > 0 ? (deliveredCount / totalAssigned) * 100 : 0;
    
    return { deliveredParcels: deliveredCount, successRate: successRate.toFixed(2) + '%' };
};

const getAgentEarnings = async (agentId, period) => {
    const { start, end } = getDateRange(period); 
    
    const where = {
        agentId: agentId,
        status: 'delivered',
        updatedAt: { [Op.between]: [start, end] } 
    };

    const totalEarnings = await db.BookingParcel.sum('agentCommission', { where });
    const deliveredCount = await db.BookingParcel.count({ where });

    return {
        period: period,
        totalEarnings: totalEarnings || 0,
        parcelsDelivered: deliveredCount
    };
};

module.exports = { getDashboardStats, getAgentPerformance, getAgentEarnings };