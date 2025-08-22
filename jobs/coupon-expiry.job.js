// const { reviewRequestMailSend } = require('../controllers/Merchant/review-request-cron');
const db = require('../models');
const moment = require('moment');
const { Op } = require('sequelize');
const helper = require('../helper/app-helper'); // adjust path if needed


/** * Job to expire coupons that have reached their expiration date.
 * It marks them as expired in the database.
 * Coupons are considered expired if their `expires_on` date is less than or equal to the current date and time.
 * It also ensures that only coupons that are not already marked as expired are processed.  
 * @returns {Promise<void>}
 */
module.exports.expireCoupons = async () => {
  try {
    const now = new Date();
    console.log('now=>', now);
    // Find coupons that have expired (expires_on is not null and <= now)
    const expiredCoupons = await db.CreditRedemption.findAll({
      where: {
        expires_on: {
          [Op.lte]: now,
          // [Op.not]: null, // Exclude nulls
        },
        is_expired: { [Op.not]: '1' }, // Only those not already expired
      },
    });

    console.log('expiredCoupons=>', expiredCoupons);
    console.log(`Found ${expiredCoupons.length} coupon(s) to expire.`);
    if (expiredCoupons.length === 0) return;

    const idsToUpdate = expiredCoupons.map((coupon) => coupon.id);

    await db.CreditRedemption.update(
      { is_expired: '1' },
      {
        where: { id: { [Op.in]: idsToUpdate } },
      }
    );

    console.log(`Marked ${idsToUpdate.length} coupon(s) as expired.`);
  } catch (error) {
    console.error('Error in expiring coupons:', error);
    // If this is not in an Express route, do not use next()
  }
};