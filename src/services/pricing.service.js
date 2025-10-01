
const db = require('../../models');
const { Pricing, Zone } = db; 
const { Op} = require("sequelize");


const getAllPricingRules = async () => {
    const globalZone = await Zone.findOne({ where: { name: 'GLOBAL_SETTINGS' } });
    const whereClause = {};
    if (globalZone) {
        whereClause.zoneId = { [Op.ne]: globalZone.id };
    }
    const rules = await Pricing.findAll({
        where: whereClause,
                attributes: [
            'id',
            'zoneId',
            'baseFare',
            'expressChargePercent'
        ],
        include: { 
            model: Zone, 
            attributes: ['name'] 
        },
        order: [['zoneId', 'ASC']] 
    });
    return rules;
};

const getAgentCommission = async () => {
    const globalZone = await Zone.findOne({ where: { name: 'GLOBAL_SETTINGS' } });
    if (!globalZone) throw new Error("Global settings zone not found.");
    const commissionRule = await Pricing.findOne({
        where: { zoneId: globalZone.id }
    });
    if (!commissionRule) throw new Error("Agent commission rule not defined.");
    return { agentCommissionPercent: commissionRule.agentCommissionPercent };
};

const updateAgentCommission = async (newPercentage) => {
    if (typeof newPercentage !== 'number' || newPercentage < 0) {
        throw new Error("Invalid percentage value provided.");
    }
    const globalZone = await Zone.findOne({ where: { name: 'GLOBAL_SETTINGS' } });
    if (!globalZone) throw new Error("Global settings zone not found.");

    const [commissionRule] = await Pricing.findOrCreate({
        where: { zoneId: globalZone.id },
        defaults: { agentCommissionPercent: newPercentage }
    });
    commissionRule.agentCommissionPercent = newPercentage;
    await commissionRule.save();
    return { message: "Agent commission updated successfully.", agentCommissionPercent: commissionRule.agentCommissionPercent };
};


const updatePricingRule = async (ruleId, updateData) => {
    const rule = await Pricing.findByPk(ruleId);
    if (!rule) {
        throw new Error("Pricing rule not found.");
    }
    const allowedUpdates = ['baseFare', 'expressChargePercent'];
    const updates = {};
    for (const key of allowedUpdates) {
        if (updateData[key] !== undefined) {
            updates[key] = updateData[key];
        }
    }
    await rule.update(updates);
    await rule.reload({
        include: {
            model: Zone,
            attributes: ['name'] 
        }
    });
        return rule;
};

module.exports = {
    getAllPricingRules,
    updatePricingRule,
    getAgentCommission,
    updateAgentCommission
};