const db = require('../../models');  
const { BookingParcel, User } = db;
const { Op } = require('sequelize');

const getDateRange = (period) => {
    const end = new Date();
    const start = new Date();
    
    switch(period) {
        case 'daily':
            start.setHours(0, 0, 0, 0);
            break;
        case 'monthly':
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            break;
        case 'yearly':
            start.setMonth(0, 1);
            start.setHours(0, 0, 0, 0);
            break;
        default:
            throw new Error('Invalid period specified');
    }
    
    return { start, end };
};

const getDashboardStats = async (period) => {
    try {
        const { start, end } = getDateRange(period);
        console.log('Date range:', { start, end }); 

        const deliveredParcels = await BookingParcel.findAll({ 
            where: { 
                status: 'delivered',
                paymentStatus: 'completed',
                updatedAt: { [Op.between]: [start, end] } 
            },
            raw: true
        });
        console.log('Delivered parcels:', deliveredParcels);

        const totalBookings = await BookingParcel.count({ 
            where: { 
                status: 'delivered',
                updatedAt: { [Op.between]: [start, end] } 
            }
        });

        const revenue = await BookingParcel.sum('deliveryCharge', { 
            where: { 
                status: 'delivered',
                paymentStatus: 'completed',
                updatedAt: { [Op.between]: [start, end] } 
            }
        });

        return { 
            totalBookings, 
            totalRevenue: revenue || 0,
            period: period
        };
    } catch (error) {
        console.error('Error in getDashboardStats:', error);
        throw error;
    }
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