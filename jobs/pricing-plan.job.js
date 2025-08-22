const db = require('../models');
const moment = require('moment');
const { Op } = require('sequelize');

async function addToList(email) {
  const Sib = require('sib-api-v3-sdk');
  const cfg = require('../config');
  const client = Sib.ApiClient.instance;
  client.authentications['api-key'].apiKey = cfg.brevo.api_key;
  const api = new Sib.ContactsApi();
  try {
    const info = await api.getContactInfo(email);
    if ((info.listIds || []).includes(9)) return;
    await api.addContactToList(9, { emails: [email] });
  } catch (e) { console.error('Brevo error:', e.message); }
}

module.exports.pricingPlanJob = async () => {
  const fourteen = moment().subtract(14, 'days').toDate();

  const stores = await db.Store.findAll({
    where: {
      created_at: { [Op.lte]: fourteen },
      is_uninstalled: '0',
    },
    attributes: ['email', 'pricing_plan_id'],
  });

  await Promise.all(
    stores
      .filter(s => s.pricing_plan_id === 208)
      .map(s => addToList(s.email))
  );
};