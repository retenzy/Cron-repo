const db = require('../models');
const { generateXML } = require('../helper/productReviewService');
const { Op } = require('sequelize');

module.exports = async function googleShoppingJob() {
  const integrations = await db.Integration.findAll({
    where: { app: 'google' },
    include: [{ model: db.Store, where: { is_uninstalled: { [Op.ne]: '1' }, is_test_store: { [Op.ne]: '1' } } }],
  });
  await Promise.all(integrations.map(i => generateXML(i.store)));
};