const weightSlabService = require('../services/weightslab.service.js');

const getAllSlabs = async (req, res) => {
    try {
        const slabs = await weightSlabService.getAllSlabs();
        const response = {
            message: "Get Successfully.",
            count: slabs.length, 
            data: slabs
        };
        res.status(200).json(response);
    } catch (error) {
        console.error("Error fetching weight slabs:", error);
        res.status(500).json({ message: "Failed to fetch weight slabs." });
    }
};

const createSlab = async (req, res) => {
    try {
        const newSlab = await weightSlabService.createSlab(req.body);
        const response = {
            message: "Created Successfully.",
            data: newSlab 
        };
        res.status(201).json(response);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


const updateSlab = async (req, res) => {
    try {
        const updatedSlab = await weightSlabService.updateSlab(req.params.id, req.body);
        const response = {
            message: "WeightBase Price Updated Successfully.",
            data: updatedSlab 
        };
        res.status(200).json(response);
    } catch (error) {
        if (error.message.includes("not found")) {
            return res.status(404).json({ message: error.message });
        }
        res.status(400).json({ message: error.message });
    }
};

const deleteSlab = async (req, res) => {
    try {
        const result = await weightSlabService.deleteSlab(req.params.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

module.exports = {
    getAllSlabs,
    createSlab,
    updateSlab,
    deleteSlab
};