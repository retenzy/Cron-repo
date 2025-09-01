const db = require('../models');
const moment = require('moment');
const { creditLogsData } = require('../creditLogsData');
const helper = require('../helper/app-helper');
module.exports = async function birthdayCreditJob() {
  
  const d = moment().format('DD');
  const m = moment().format('MM');
  const rule = await db.CreditRules.findOne({ where: { rule_type: 'birthday', is_active: '1' } });
  if (!rule) return;
  const shop = await db.Store.findOne({ where: { id: rule.store_id } });
      //   let checksettigs = await helper.getMailSettings(`RewardEmailSetup.birthday`, shop.id)
      // console.log('ismailReached, checksettigs', checksettigs);
  const customers = await db.sequelize.query(
    `SELECT * FROM customers WHERE DAY(date_of_birth)=${d} AND MONTH(date_of_birth)=${m}`,
    { type: db.sequelize.QueryTypes.SELECT }
  );
  await Promise.all(customers.map(c => creditLogsData(shop, rule.id, c.customer_id)));
};