const db = require("./models");
const helper = require("./helper/app-helper");

exports.creditLogsData = async (store, rule_id, customer_id) => {
  try {
    let expiryDate = null;
    const customerResponse = await db.Customers.findOne({
      where: { customer_id: customer_id, store_id: store.id },
    });

    if (!customerResponse?.customer_email) return { message: "Customer dont have mail" };
    // const getStoreLogo = await db.Settings.findOne({
    //   where: { store_id: store.id, key: 'store_logo' },
    // });

    if (customerResponse) {
      await db.Customers.update({ is_credit: "1" }, { where: { customer_id: customer_id, store_id: store.id } });
    }

    const creditResponse = await db.CreditRules.findOne({
      where: { id: rule_id, store_id: store.id },
    });

    if (creditResponse) {
      if (creditResponse.expiry_days > 0) {
        const date = new Date();
        expiryDate = date.setDate(date.getDate() + parseInt(creditResponse.expiry_days));
      }

      const creditObject = {
        store_id: store.id,
        customer_credit_id: customerResponse ? customerResponse.id : null,
        customer_email: customerResponse.customer_email,
        credit: creditResponse.point,
        available: creditResponse.point,
        is_expired: "0",
        expiry_date: expiryDate,
        action_type: "credit",
        comment: creditResponse.rule_type,
      };

      const createCredit = await db.CreditLogs.create(creditObject);

      const mailObject = {
        store: store,
        customer: customerResponse,
        id: createCredit.id,
        rule: creditResponse,
        type: `${creditResponse.rule_type}_reward_earned`, // it only works for birthday_reward_earned
        customArgs: {
          email_type: `${creditResponse.rule_type}_reward_earned`,
          campaign_name: "reward_campaign",
        },
        category: [store?.username],
      };

      let ismailReached = await helper.isMailLimitReached(store);

      let checksettigs;
      if (creditResponse.rule_type === 'birthday') {
        checksettigs = await helper.getMailSettings(`RewardEmailSetup.Birthday`, store.id);
      } else {
        checksettigs = await helper.getMailSettings(`RewardEmailSetup.Anniversary`, store.id);
      }
      
      if (parseInt(store.email_enable) && checksettigs) {
        let response;
        if (store.email_notification === "retenzy" || store.email_notification === "sendgrid") {
          helper.sendCustomerEmail(mailObject);
        }

        const eventData = {
          name: `Retenzy-${creditResponse.rule_type.trim()[0].toUpperCase()}${creditResponse.rule_type.trim().slice(1)} Reward`,
          email: customerResponse.customer_email,
          properties: {
            rewardName: `${creditResponse.rule_type.trim()[0].toUpperCase()}${creditResponse.rule_type.trim().slice(1)} Reward`,
            comment: creditResponse.comment,
            expiry_days: creditResponse.expiry_days == 0 ? "never expire" : `${creditResponse.expiry_days}`,
            point: `${creditResponse.point}`,
            first_name: customerResponse.first_name,
            last_name: creditResponse.last_name,
          },
        };

        if (store.email_notification === "klaviyo") {
          response = await helper.sendEventToKlaviyo(id, eventData);
        }
        if (store.email_notification === "mailchimp") {
          response = await helper.sendEventToMailchimp(id, eventData);
        }
        if (store.email_notification === "omnisend") {
          response = await helper.sendEventToOmnisend(id, eventData);
        }
        if (response.status == true) {
          let emailLogsObj = {
            store_id: mailObject.store.id,
            email_type: "Reward",
            sent_type: "auto",
            email_sent_date: new Date(),
            message: `Credit recieved - auto | Customer: ${mailObject.customer.customer_email} | Recieved ${mailObject?.rule?.point} for ${mailObject.type}`,
            email_message_id: response?.message_id,
            email_client: response?.mailClient,
          };
          await insertEmailLogs(emailLogsObj);
        }
      }
      return { message: "Credit log inserted" };
    }
    return { message: "No rule exist" };
  } catch (error) {
    throw error;
  }
};

