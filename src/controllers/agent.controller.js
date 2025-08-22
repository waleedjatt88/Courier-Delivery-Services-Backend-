const parcelService = require('../services/parcel.service.js');

const getMyAssignedParcels = async (req, res) => {
    try {
        const agentId = req.user.id;
        const parcels = await parcelService.getParcelsByAgentId(agentId);
        res.status(200).json({ parcels });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch assigned parcels.' });
    }
};

const getMyParcelDetails = async (req, res) => {
    try {
        const agentId = req.user.id; 
        const parcelId = req.params.id; 

        const parcel = await parcelService.getParcelById(parcelId);

        if (!parcel) {
            return res.status(404).json({ message: "Parcel not found." });
        }

        
        if (parcel.agentId !== agentId) {
            return res.status(403).json({ message: "Forbidden: You are not authorized to view this parcel." });
        }
        

        res.status(200).json({ parcel });

    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch parcel details.' });
    }
};


module.exports = {
    getMyAssignedParcels,
    getMyParcelDetails 
};