
const db = require('../../models');
const { BookingParcel, User } = db;
const { Op, Sequelize, fn, col, literal } = require("sequelize");


const getLastTwelveMonthsLabels = () => {
    const labels = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    for (let i = 0; i < 12; i++) {
        d.setMonth(d.getMonth() - 1);
        labels.push(monthNames[d.getMonth()]);
    }
    return labels.reverse();
};

const getLastSixYearsLabels = () => {
    const labels = [];
    const currentYear = new Date().getFullYear();
    for (let i = 5; i >= 0; i--) {
        labels.push((currentYear - i).toString());
    }
    return labels;
};

const getBookingStats = async (period) => {
    let dateFilter, groupBy, labels, dataFormatter;
    switch (period) {
        case 'daily':
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
            dateFilter = { [Op.gte]: sevenDaysAgo };
            groupBy = fn('EXTRACT', literal('ISODOW FROM "createdAt"'));
            labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
            dataFormatter = (result) => {
                if (!result || !result.period) return null;
                const dayIndex = parseInt(result.period, 10) - 1; 
                return labels[dayIndex];
            };
            break;
        case 'monthly':
            dateFilter = { [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 12)) };
            groupBy = fn('date_trunc', 'month', col('createdAt'));
            labels = getLastTwelveMonthsLabels();
            dataFormatter = (result) => new Date(result.period).toLocaleDateString('en-US', { month: 'short' });
            break;
        case 'yearly':
            dateFilter = { [Op.gte]: new Date(new Date().setFullYear(new Date().getFullYear() - 6)) };
            groupBy = fn('date_trunc', 'year', col('createdAt'));
            labels = getLastSixYearsLabels();
            dataFormatter = (result) => new Date(result.period).getFullYear().toString();
            break;
        default:
            throw new Error("Invalid period specified. Use 'daily', 'monthly', or 'yearly'.");
    }
    const results = await BookingParcel.findAll({
        where: {
            createdAt: dateFilter,
            status: {
                [Op.notIn]: ['unconfirmed', 'cancelled']
            }
        },
        attributes: [
            [groupBy, 'period'],
            [fn('COUNT', col('id')), 'totalBookings']
        ],
        group: ['period'],
        raw: true
    });
    const dataMap = new Map(results.map(r => [dataFormatter(r), parseInt(r.totalBookings, 10)]));
    const finalData = labels.map(label => dataMap.get(label) || 0);
    return {
        labels: labels,
        data: finalData
    };
};

const generateParcelsReport = async () => {
    const parcels = await BookingParcel.findAll({
        where: {
            status: 'delivered'
        },
        attributes: [
            'id', 
            'trackingNumber',
            'deliveryCharge',
            'paymentStatus',
            'paymentMethod',
             'updatedAt' 

        ],
        include: {
            model: User,
            as: 'Customer',
            attributes: ['fullName']
        },
        order: [['id', 'DESC']]
    });
    const report = parcels.map(parcel => ({
        parcelId: parcel.id, 
        trackingNumber: parcel.trackingNumber,
        customerName: parcel.Customer ? parcel.Customer.fullName : 'N/A',
        deliveryCharge: parcel.deliveryCharge,
        paymentStatus: parcel.paymentStatus,
        paymentMethod: parcel.paymentMethod,
        bookingStatus: 'delivered',
        lastUpdate: parcel.updatedAt 

    }));
    return report;
};

const getRevenueStats = async () => {
        const whereClause = {
        status: {
            [Op.notIn]: ['unconfirmed', 'cancelled']
        }
    };
    const revenueResult = await BookingParcel.findOne({
        attributes: [
            [ Sequelize.fn('SUM', Sequelize.col('deliveryCharge')), 'totalRevenue' ],
            [
                Sequelize.fn('SUM', Sequelize.literal("CASE WHEN \"paymentStatus\" = 'completed' THEN \"deliveryCharge\" ELSE 0 END")), 
                'collectedRevenue'
            ],
            [
                Sequelize.fn('SUM', Sequelize.literal("CASE WHEN \"paymentStatus\" = 'pending' THEN \"deliveryCharge\" ELSE 0 END")), 
                'pendingRevenue'
            ],
            [ Sequelize.fn('SUM', Sequelize.col('agentCommission')), 'totalAgentCommission' ],            
            [ Sequelize.fn('SUM', Sequelize.col('remainingAmount')), 'totalRemainingAmount' ]
        ],
        where: whereClause, 
        raw: true
    });

    const stats = {
        totalRevenue: parseFloat(revenueResult.totalRevenue) || 0,
        collectedRevenue: parseFloat(revenueResult.collectedRevenue) || 0,
        pendingRevenue: parseFloat(revenueResult.pendingRevenue) || 0,
        totalAgentCommission: parseFloat(revenueResult.totalAgentCommission) || 0,
        totalRemainingAmount: parseFloat(revenueResult.totalRemainingAmount) || 0,
    };
    return stats;
};
 
const generateAllUsersFraudReport = async () => {
        const allStats = await BookingParcel.findAll({
        attributes: [
            'customerId',
            [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalAttempts'],
            [Sequelize.fn('SUM', Sequelize.literal("CASE WHEN status = 'cancelled' AND \"paymentStatus\" = 'cancelled' THEN 1 ELSE 0 END")), 'num_cancellations'],
            [Sequelize.fn('SUM', Sequelize.literal("CASE WHEN status = 'unconfirmed' THEN 1 ELSE 0 END")), 'num_of_unconfirmed_parcels']
        ],
        group: ['customerId'], 
        raw: true
    });
    const allCustomers = await User.findAll({
        where: { role: 'customer' },
        attributes: ['id',], 
        raw: true
    });
    const statsMap = new Map(allStats.map(stat => [stat.customerId, stat]));
    const fullReport = allCustomers.map(customer => {
        const stats = statsMap.get(customer.id) || {
            totalAttempts: 0,
            num_cancellations: 0,
            num_of_unconfirmed_parcels: 0
        };
        const totalAttempts = parseInt(stats.totalAttempts, 10);
        const numCancellations = parseInt(stats.num_cancellations, 10);
        const numOfUnconfirmedParcels = parseInt(stats.num_of_unconfirmed_parcels, 10);
        const totalFailedAttempts = numCancellations + numOfUnconfirmedParcels;
        let paymentFailRatio = 0.0;
        if (totalAttempts > 0) {
            const ratio = totalFailedAttempts / totalAttempts;
            paymentFailRatio = parseFloat(ratio.toFixed(2));
        }
        return {
            customerId: customer.id,
            num_cancellations: numCancellations,
            num_of_unconfirmed_parcels: numOfUnconfirmedParcels,
            payment_fail_ratio: paymentFailRatio,
        };
    });
    return fullReport;
};

module.exports = {
    getBookingStats,
    generateParcelsReport,
    getRevenueStats,
    generateAllUsersFraudReport
};