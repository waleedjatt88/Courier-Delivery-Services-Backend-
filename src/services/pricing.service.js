
const db = require('../../models');
const { Pricing, Zone } = db; 


const getAllPricingRules = async () => {
    const rules = await Pricing.findAll({
        include: {
            model: Zone,
            attributes: ['name'] 
        },
        order: [['zoneId', 'ASC']] 
    });
    return rules;
};


const updatePricingRule = async (ruleId, updateData) => {
    const rule = await Pricing.findByPk(ruleId);
    if (!rule) {
        throw new Error("Pricing rule not found.");
    }

    const allowedUpdates = ['baseFare', 'perKgCharge', 'expressChargePercent','agentCommissionPercent'];
    const updates = {};
    for (const key of allowedUpdates) {
        if (updateData[key] !== undefined) {
            updates[key] = updateData[key];
        }
    }

    await rule.update(updates);
    return rule;
};

module.exports = {
    getAllPricingRules,
    updatePricingRule
};