const db = require('../../models');
const { WeightSlab } = db;

const getAllSlabs = async () => {
    return await WeightSlab.findAll({ order: [['minWeight', 'ASC']] });
};
const createSlab = async (slabData) => {
    const { minWeight, maxWeight, charge } = slabData;
    if (!minWeight || !maxWeight || !charge) {
        throw new Error("minWeight, maxWeight, and charge are required.");
    }
    return await WeightSlab.create(slabData);
};

const updateSlab = async (slabId, updateData) => {
    const slab = await WeightSlab.findByPk(slabId);
    if (!slab) {
        throw new Error("Weight slab not found.");
    }
    await slab.update(updateData);
    return slab;
};

const deleteSlab = async (slabId) => {
    const slab = await WeightSlab.findByPk(slabId);
    if (!slab) {
        throw new Error("Weight slab not found.");
    }
    await slab.destroy();
    return { message: "Weight slab deleted successfully." };
};

module.exports = {
    getAllSlabs,
    createSlab,
    updateSlab,
    deleteSlab
};