const db = require('../models');
const moment = require('moment');
const { Op } = require('sequelize');

module.exports = async function pointsExpiryJob() {
  console.log('Running points expiry job...');
  const BATCH = 100;

const stores = await db.Settings.findAll({
  where: { key: 'point_expiry' },
  include: [{
    model: db.Store,
    attributes: ['store_id'],
    where: { is_uninstalled: '0' }, // <-- skip uninstalled stores
  }],
});


  for (const store of stores) {
    const storeId = store.store_id;
    let config;

    try {
      config = JSON.parse(store.value);
    } catch {
      continue;
    }

    if (!config || config.active !== 1) continue;

    const cut = moment().subtract(Number(config.time), 'months').format('YYYY-MM-DD');

    const users = await db.CreditLogs.findAll({
      where: {
        store_id: storeId,
        created_at: { [Op.lt]: cut },
        is_expired: '0',
        action_type: ['credit', 'redeem'],
      },
      attributes: ['customer_credit_id', 'customer_email'],
      group: ['customer_credit_id', 'customer_email'],
      raw: true,
    });

    if (!users.length) continue;

    // ✅ Pre-fetch total points per customer to avoid N+1 queries
    const pointsByCustomer = await db.CreditLogs.findAll({
      where: {
        store_id: storeId,
        customer_credit_id: {
          [Op.in]: users.map(u => u.customer_credit_id),
        },
      },
      attributes: [
        'customer_credit_id',
        [db.sequelize.fn('SUM', db.sequelize.col('credit')), 'total_credit'],
      ],
      group: ['customer_credit_id'],
      raw: true,
    });

    // Convert to map: customer_credit_id => total_credit
    const creditMap = new Map();
    for (const { customer_credit_id, total_credit } of pointsByCustomer) {
      creditMap.set(customer_credit_id, parseFloat(total_credit));
    }

    for (let i = 0; i < users.length; i += BATCH) {
      const slice = users.slice(i, i + BATCH);

      await Promise.all(
        slice.map(async u => {
          const pts = creditMap.get(u.customer_credit_id) || 0;

          console.log(`Expired points for ${u.customer_email}: ${pts}`);

          if (pts > 0) {
            await db.CreditLogs.create({
              store_id: storeId,
              customer_credit_id: u.customer_credit_id,
              customer_email: u.customer_email,
              credit: -pts,
              available: -pts,
              is_expired: 1,
              action_type: 'expired',
              comment: `Expired ${pts} point(s)`,
              is_email_send: 1,
              created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
            });
          }
        })
      );
    }
  }
};
