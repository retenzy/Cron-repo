const db = require('../models');
const moment = require('moment');
const { Op } = require('sequelize');
const CONFIG = require('../config');

async function addToList(email) {
  const Sib = require('sib-api-v3-sdk');
  const cfg = require('../config');
  const client = Sib.ApiClient.instance;
  client.authentications['api-key'].apiKey = cfg.brevo.api_key;
  const api = new Sib.ContactsApi();
  try {
    const info = await api.getContactInfo(email);
    if ((info.listIds || []).includes(11)) return;
    await api.addContactToList(11, { emails: [email] });
  } catch (e) {
    console.error('Brevo error:', e.message);
  }
}

const checkForFile = (domainName, token, themeId, fileName) => {
  return new Promise(async (resolve, reject) => {
    try {
      const AssetObj = new Asset(domainName, token, themeId);
      const shopifyPayload = {
        'asset[key]': `${fileName}.json`,
        theme_id: themeId,
        type: 'json',
      };

      const assetData = await AssetObj.get(themeId, shopifyPayload);

      if (assetData.data) {
        resolve(assetData.data);
      } else {
        reject(new Error('File not found'));
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
};

module.exports = async function extensionStatusJob() {
  const sevenDaysAgo = moment().subtract(7, 'days').toDate();

  const stores = await db.Store.findAll({
    where: { created_at: { [Op.gte]: sevenDaysAgo }, is_uninstalled: '0' },
    attributes: ['id', 'domain', 'token', 'email'],
  });

  const themes = await db.installedTheme.findAll({
    where: { store_id: { [Op.in]: stores.map(s => s.id) } },
    attributes: ['store_id', 'published_theme_id'],
  });

  const themeMap = new Map();
  themes.forEach(t => themeMap.set(t.store_id, t.published_theme_id));

  const emailsToAdd = [];

  for (const s of stores) {
    const themeId = themeMap.get(s.id);
    if (!themeId) continue;

    try {
      const [settingsRes, productRes] = await Promise.all([
        checkForFile(s.domain, s.token, themeId, 'config/settings_data'),
        checkForFile(s.domain, s.token, themeId, 'templates/product'),
      ]);

      const settings = JSON.parse(settingsRes.value);
      const product = JSON.parse(productRes.value);

      let anyOff = false;

      // app-embeds
      const blocks = settings.current.blocks || {};
      for (const k in blocks) {
        const b = blocks[k];
        if (b.type?.includes(`${CONFIG.extension.app_name}/blocks/DashboardExtension`)) anyOff ||= b.disabled;
        if (b.type?.includes(`${CONFIG.extension.app_name}/blocks/WidgetExtension`)) anyOff ||= b.disabled;
      }

      // product blocks
      const mainBlocks = product.sections?.main?.blocks || {};
      for (const k in mainBlocks) {
        if (mainBlocks[k].type?.includes(`${CONFIG.extension.app_name}/blocks/ProductRating`)) break;
      }

      for (const k in product.sections) {
        const sec = product.sections[k];
        if (sec.type === 'apps') {
          for (const b in sec.blocks || {}) {
            if (sec.blocks[b].type?.includes(`${CONFIG.extension.app_name}/blocks/ProductReview`)) break;
          }
        }
      }

      if (anyOff) emailsToAdd.push(s.email);
    } catch (err) {
      console.error(`Error processing store ${s.domain}:`, err.message);
    }
  }

  // batch add to list (parallel)
  await Promise.all(emailsToAdd.map(email => addToList(email)));
};
