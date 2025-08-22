// const { creditExpiryReminderEmail } = require('../controllers/Merchant/credit-controller');
const db = require('../models');
const { Op, Sequelize } = require('sequelize');
const helper = require('../helper/app-helper');

const { orderBy } = require('lodash');
const moment = require('moment');

module.exports.creditExpiryReminderEmail = async () => {
  try {
    const stores = await db.Store.findAll({
      where: {
        is_uninstalled: '0',
        email_enable: '1',
      },
    });

    if (!stores || stores.length === 0) {
      return;
    }

    const sentReminders = new Set();

    for (const store of stores) {
      const store_id = store.id;

      const setting = await db.Settings.findOne({
        where: {
          store_id,
          key: 'point_expiry',
        },
        order: [['id', 'DESC']],
      });

      if (!setting) continue;

      let parsed;
      try {
        parsed = JSON.parse(setting.value);
      } catch {
        continue;
      }

      if (!parsed?.active || !parsed?.time) continue;

      const expiryMonths = parseInt(parsed.time);
      const now = moment();

      const logs = await db.CreditLogs.findAll({
        where: {
          store_id,
          action_type: ['credit', 'redeem'],
          is_expired: '0',
        },
      });

      for (const log of logs) {
        const earnedDate = moment(log.created_at);
        const expiryDate = earnedDate.clone().add(expiryMonths, 'months');
        const daysLeft = expiryDate.diff(now, 'days');
        const daysSinceEarned = now.diff(earnedDate, 'days');

        if (daysLeft < 0 || (daysLeft !== 30 && daysLeft !== 3)) continue;

        if (daysSinceEarned < expiryMonths * 30 - daysLeft) continue;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(log.customer_email)) continue;
        const reminderKey = `${log.id}_${daysLeft}`;
        console.log('reminderKey === ', reminderKey);

        if (sentReminders.has(reminderKey)) {
          continue;
        }

        // Mark as sent
        sentReminders.add(reminderKey);

        const mailObject = {
          store: {
            id: store.id,
            username: store.username,
            sender_name: store.sender_name || 'Retenzy',
            support_email: store.support_email,
          },
          customer: {
            customer_email: log.customer_email,
          },
          id: log.id,
          templateId: 'd-your-sendgrid-template-id',
          rule: {
            name: `Point Expiry Reminder ${expiryDate}`,
            points: log.credit,
            expiryDate: expiryDate.format('YYYY-MM-DD'),
          },
          type: 'reward_expiry_reminder',
          customArgs: {
            email_type: 'reward_expiry_reminder',
            campaign_name: 'reward_expiry_campaign',
          },
          category: [store.username],
          dynamicData: {
            customer_name: log.customer_name || 'Customer',
            points: log.credit,
            expiry_date: expiryDate.format('YYYY-MM-DD'),
            days_left: daysLeft,
          },
        };

        try {
          console.log('Sending email to:', log.customer_email);
          await helper.sendCustomerEmail(mailObject);
        } catch (err) {
          console.error('Failed to send email:', err);
          continue;
        }
      }
    }
  } catch (error) {
    console.error('Error in creditExpiryReminderEmail:', error);
    throw error;
  }
};
