const db = require('../../models');
const { User, BookingParcel } = db;
const { Op, Sequelize } = require("sequelize"); 



const getAllUsers = async (roleType = null, pageParam = 1, limitParam = 10) => {
    const page = Math.max(parseInt(pageParam) || 1, 1);
    const limit = Math.max(parseInt(limitParam) || 10, 1);
    const offset = (page - 1) * limit;
    const whereClause = {};
    if (roleType === 'restricted') {
        whereClause[Op.or] = [
            { isActive: false },
            { suspendedUntil: { [Op.ne]: null, [Op.gt]: new Date() } }
        ];
    } else {
        whereClause.isActive = true;
        whereClause.suspendedUntil = {
            [Op.or]: { [Op.eq]: null, [Op.lt]: new Date() }
        };
        if (roleType) {
            const validRoles = ['customer', 'agent', 'guest'];
            if (!validRoles.includes(roleType)) {
                throw new Error(`Invalid user type specified: ${roleType}`);
            }
            whereClause.role = roleType;
        }}
    const { count, rows: users } = await User.findAndCountAll({
        where: whereClause,
        attributes: { exclude: ['passwordHash'] },
        order: [['id', 'DESC']],
        limit,
        offset
    });
    return {
        users,
        pagination: {
            totalCounts: count,
            currentPage: page,
            itemsPerPage: limit,
            totalPages: Math.ceil(count / limit),
        }
    };};


const deleteUser = async (userId) => {
    const user = await User.findByPk(userId);
    if (!user) {
        throw new Error("User not found");
    }
    await user.destroy();
    return { message: "User deleted successfully." };
};


const updateUser = async (userId, updateData) => {
    const user = await User.findByPk(userId);
    if (!user) {
        throw new Error("User not found");
    }

    await user.update(updateData);
    const userResult = user.toJSON();
    delete userResult.passwordHash;
        return userResult;
};

const blockUser = async (userId) => {
    const user = await User.findByPk(userId);
    if (!user) {
        throw new Error("User not found");
    }
    if (user.suspendedUntil && user.suspendedUntil > new Date()) {
        const suspensionEndDate = user.suspendedUntil.toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
        throw new Error(`Cannot block this user. The user is currently suspended until ${suspensionEndDate}. Please un-suspend first.`);
    }
        user.isActive = false;
    await user.save();
    const userResult = user.toJSON();
    delete userResult.passwordHash;
    return userResult;
};

const unblockUser = async (userId) => {
    const user = await User.findByPk(userId);
    if (!user) throw new Error("User not found");
    user.isActive = true;
    await user.save();
     const userResult = user.toJSON();
    delete userResult.passwordHash;
    return user;
};


const suspendUser = async (userId) => {
    const user = await User.findByPk(userId);
    if (!user) {
        throw new Error("User not found");
    }
    if (user.isActive === false) {
        throw new Error("Cannot suspend this user because the account is permanently blocked. Please un-block the user first.");
    }
    const suspensionEndDate = new Date();
    suspensionEndDate.setDate(suspensionEndDate.getDate() + 3); 
    user.suspendedUntil = suspensionEndDate;
    await user.save();

    const userResult = user.toJSON();
    delete userResult.passwordHash;
    return userResult;
};

const unsuspendUser = async (userId) => {
    const user = await User.findByPk(userId);
    if (!user) throw new Error("User not found");
    user.suspendedUntil = null; 
    await user.save();
    const userResult = user.toJSON();
    delete userResult.passwordHash;
    return user;
};

const getAgentStats = async () => {
    const totalAgents = await User.count({
        where: {
            role: 'agent'
        }
    });
    const activeParcelStatuses = [
        'scheduled',
        'picked_up',
        'in_transit',
        'out_for_delivery'
    ];

    const activeAgentIdsResult = await BookingParcel.findAll({
        where: {
            status: {
                [Op.in]: activeParcelStatuses
            },
            agentId: {
                [Op.ne]: null 
            }
        },
        attributes: [
            [Sequelize.fn('DISTINCT', Sequelize.col('agentId')), 'agentId']
        ],
        raw: true
    });
    const activeAgents = activeAgentIdsResult.length;
    return {
        totalAgents,
        activeAgents
    };
};

const getGlobalParcelStats = async () => {
    const statsResult = await BookingParcel.findAll({
        attributes: [
            [Sequelize.fn('SUM', Sequelize.literal("CASE WHEN status NOT IN ('unconfirmed', 'cancelled') THEN 1 ELSE 0 END")), 'totalBookings'],
            [Sequelize.fn('SUM', Sequelize.literal("CASE WHEN status = 'order_placed' THEN 1 ELSE 0 END")), 'order_placed'],
            [Sequelize.fn('SUM', Sequelize.literal("CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END")), 'scheduled'],
            [Sequelize.fn('SUM', Sequelize.literal("CASE WHEN status = 'picked_up' THEN 1 ELSE 0 END")), 'picked_up'],
            [Sequelize.fn('SUM', Sequelize.literal("CASE WHEN status = 'in_transit' THEN 1 ELSE 0 END")), 'in_transit'],
            [Sequelize.fn('SUM', Sequelize.literal("CASE WHEN status = 'out_for_delivery' THEN 1 ELSE 0 END")), 'out_for_delivery'],
            [Sequelize.fn('SUM', Sequelize.literal("CASE WHEN status = 'delivered' THEN 1 ELSE 0 END")), 'delivered'],
            [Sequelize.fn('SUM', Sequelize.literal("CASE WHEN status = 'cancelled' AND \"paymentStatus\" IN ('pending', 'completed') THEN 1 ELSE 0 END")), 'cancelled']        ],
        raw: true
    });
    const stats = statsResult[0]; 
    for (const key in stats) {
        stats[key] = parseInt(stats[key], 10) || 0;
    }
    return stats;
};

const getOverallPerformanceStats = async () => {
    const totalAssignedParcels = await BookingParcel.count({
        where: {
            agentId: { [Op.ne]: null },
            status: { [Op.notIn]: ['unconfirmed', 'cancelled'] }
        }
    });

    const deliveredParcels = await BookingParcel.count({
        where: {
            agentId: { [Op.ne]: null },
            status: 'delivered'
        }
    });

    const calculatedPercentage = (totalAssignedParcels > 0)
        ? Math.round((deliveredParcels / totalAssignedParcels) * 100)
        : 0;

    return {
         totalAssignedParcels,
        deliveryPerformancePercentage: `${calculatedPercentage}%` 
    };
};

const setUserSuspiciousFlag = async (userId, isSuspicious) => {
    const user = await User.findByPk(userId);
    if (!user) {
        throw new Error("User not found.");
    }
    if (typeof isSuspicious !== 'boolean') {
        throw new Error("isSuspicious flag must be a boolean (true or false).");
    }
    user.isSuspicious = isSuspicious;
    await user.save();
    const userResult = user.toJSON();
    delete userResult.passwordHash;
    return userResult;
};


module.exports = {
    getAllUsers,
    deleteUser,
    updateUser,
    blockUser,
    unblockUser,
    suspendUser,
    unsuspendUser,
    getAgentStats,
    getGlobalParcelStats,
    setUserSuspiciousFlag,
    getOverallPerformanceStats
};