const cron = require('node-cron');
const db = require('../models');
const { Op } = require('sequelize');
const { User } = db;

console.log('Scheduler initialized.');


const autoRejectJob = cron.schedule('* * * * *', async () => {
  try {
    console.log('Running auto-reject check for pending parcels at:', new Date());
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const [affectedRows] = await db.BookingParcel.update(
        { 
            agentAcceptanceStatus: 'rejected',
            agentRejectionReason: 'Auto-rejected: No response within 10 minutes',
            status: 'order_placed',
            agentId: null 
        },{
            where: {
                agentAcceptanceStatus: 'pending',
                assignedAt: { [Op.lte]: tenMinutesAgo } 
            }}
    );
    if (affectedRows > 0) {
        console.log(`Auto-rejected ${affectedRows} parcel(s) due to timeout`);
    }
  } catch (error) {
    console.error('Error during auto-reject cron job:', error);
  }
});

const unsuspendUsers = cron.schedule('0 1 * * *', async () => {
    console.log(`🧹 Running  to unsuspend users at: ${new Date()}`);
    try {
        const [affectedCount] = await User.update(
            { suspendedUntil: null }, 
            {
                where: {
                    suspendedUntil: {
                        [Op.ne]: null,      
                        [Op.lt]: new Date() 
                    }
                }
            }
        );
        if (affectedCount > 0) {
            console.log(`✅ Successfully un-suspended ${affectedCount} user(s).`);
        } else {
            console.log('No users to unsuspend.');
        }

    } catch (error) {
        console.error('!!! Error during unsuspend users :', error);
    }
}, {
    scheduled: false 
});


module.exports = { autoRejectJob, unsuspendUsers };