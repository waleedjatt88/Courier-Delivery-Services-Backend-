const db = require('../../models');
const { User, BookingParcel } = db;
const { Op, Sequelize } = require("sequelize"); 



const getAllUsers = async (roleType = null) => {
    const whereClause = {};
    if (roleType && roleType !== 'restricted') {
        const validRoles = ['customer', 'agent', 'guest'];
        if (!validRoles.includes(roleType)) {
            throw new Error(`Invalid user type specified: ${roleType}`);
        }
        whereClause.role = roleType;
    }
    if (roleType === 'restricted') {
        whereClause[Op.or] = [
            { isActive: false }, 
            { 
                suspendedUntil: { 
                    [Op.ne]: null,
                    [Op.gt]: new Date()
                }
            }
        ];
    } else {
        whereClause.isActive = true;
        whereClause.suspendedUntil = {
            [Op.or]: {
                [Op.eq]: null,
                [Op.lt]: new Date()
            }
        };
    }
    const users = await User.findAll({
        where: whereClause,
        attributes: { exclude: ['passwordHash'] },
        order: [['createdAt', 'DESC']]
    });
    return users;
};


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

/**
 * 
 * @returns {Promise<object>}
 */
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


module.exports = {
    getAllUsers,
    deleteUser,
    updateUser,
    blockUser,
    unblockUser,
    suspendUser,
    unsuspendUser,
    getAgentStats
};