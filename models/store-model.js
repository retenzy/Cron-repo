const Sequelize = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'store',
    {
      id: {
        type: Sequelize.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      store_id: {
        type: Sequelize.STRING(14),
        allowNull: false,
      },
      platform_id: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
        references: {
          model: 'platforms',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      username: {
        type: Sequelize.STRING,
      },
      sender_name: {
        type: Sequelize.STRING,
      },
      email: {
        type: Sequelize.STRING(320),
      },
      support_email: {
        type: Sequelize.STRING(320),
      },
      phone: {
        type: Sequelize.STRING,
        defaultValue: null,
      },
      domain: {
        type: Sequelize.STRING,
      },
      main_domain: {
        type: Sequelize.STRING,
      },
      referal_Id: {
        type: Sequelize.STRING,
        defaultValue: null,
      },
      social_media: {
        type: Sequelize.JSON,
        defaultValue: null,
      },
      shop_created_at: {
        type: Sequelize.STRING,
      },
      shop_owner: {
        type: Sequelize.STRING,
      },
      is_genuine_store: {
        type: Sequelize.DataTypes.ENUM('0', '1'),
        defaultValue: '0',
        allowNull: false,
        comment: '(0=no,1=yes)',
      },
      is_lifetime: {
        type: Sequelize.DataTypes.ENUM('0', '1'),
        defaultValue: '0',
        allowNull: false,
        comment: '(0=no,1=yes)',
      },
      api_key: {
        type: Sequelize.STRING(500),
        defaultValue: null,
      },
      token: {
        type: Sequelize.STRING(500),
      },
      country: {
        type: Sequelize.STRING,
        defaultValue: null,
      },
      iana_timezone: {
        type: Sequelize.STRING,
        defaultValue: null,
      },
      guid: {
        type: Sequelize.STRING(20),
        allowNull: true,
        defaultValue: null,
      },
      status: {
        type: Sequelize.DataTypes.ENUM('0', '1'),
        defaultValue: '0',
        allowNull: false,
        comment: '(0=inactive, 1 =active)',
      },
      is_deleted: {
        type: Sequelize.DataTypes.ENUM('0', '1'),
        defaultValue: '0',
        allowNull: false,
        comment: '(0=no,1=yes)',
      },
      currency: {
        type: Sequelize.STRING(10),
        defaultValue: null,
      },
      currency_format: {
        type: Sequelize.STRING(50) + ' CHARSET utf8 COLLATE utf8_general_ci',
        defaultValue: null,
      },
      pricing_plan_id: {
        type: Sequelize.INTEGER(11),
        allowNull: true,
        defaultValue: null,
        references: {
          model: 'pricing_plans',
          key: 'id',
        },
      },
      is_paid: {
        type: Sequelize.DataTypes.ENUM('0', '1'),
        defaultValue: '0',
        allowNull: false,
        comment: '(0=no,1=yes)',
      },
      is_freetrial_used: {
        type: Sequelize.DataTypes.ENUM('0', '1'),
        defaultValue: '0',
        allowNull: false,
        comment: '(0=no,1=yes)',
      },
      is_enable: {
        type: Sequelize.DataTypes.ENUM('0', '1'),
        defaultValue: '1',
        allowNull: false,
        comment: '(0=no,1=yes)',
      },
      is_uninstalled: {
        type: Sequelize.DataTypes.ENUM('0', '1'),
        defaultValue: '0',
        allowNull: false,
        comment: '(0=no,1=yes)',
      },
      is_test_store: {
        type: Sequelize.DataTypes.ENUM('0', '1'),
        defaultValue: '0',
        allowNull: false,
        comment: '(0=no,1=yes)',
      },
      is_send_mail: {
        type: Sequelize.DataTypes.INTEGER(2),
        defaultValue: '0',
      },
      email_notification: {
        type: Sequelize.STRING,
        defaultValue: 'retenzy',
      },
      sendgrid_list_id: {
        type: Sequelize.STRING,
      },
      is_private: {
        type: Sequelize.DataTypes.ENUM('0', '1'),
        defaultValue: '0',
        allowNull: false,
        comment: '(0=no,1=yes)',
      },
      is_script_added: {
        type: Sequelize.DataTypes.ENUM('0', '1'),
        defaultValue: '0',
        allowNull: false,
        comment: '(0=no,1=yes)',
      },
      stripe_customer_id: {
        type: Sequelize.STRING(50),
      },
      stripe_client_secret: {
        type: Sequelize.STRING(500),
      },
      stripe_payment_connected: {
        type: Sequelize.DataTypes.ENUM('0', '1'),
        defaultValue: '0',
        allowNull: false,
        comment: '(0=no,1=yes)',
      },
      stripe_payment_connected: {
        type: Sequelize.DataTypes.ENUM('0', '1'),
        defaultValue: '0',
        allowNull: false,
        comment: '(0=no,1=yes)',
      },
      tags: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: true,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
      reward_redeem_amount: {
        type: Sequelize.STRING(10),
        defaultValue: 0.25,
      },
      min_reward_to_redeem: {
        type: Sequelize.STRING(10),
        defaultValue: 20,
      },
      max_reward_to_redeem: {
        type: Sequelize.STRING(10),
        defaultValue: 50,
      },
      min_cart_amount_to_redeem: {
        type: Sequelize.STRING(10),
        defaultValue: 100,
      },
      is_redeem_edited: {
        type: Sequelize.DataTypes.ENUM('0', '1'),
        defaultValue: '0',
        allowNull: false,
        comment: '(0=no,1=yes)',
      },
      reward_expiry_days: {
        type: Sequelize.STRING(10),
        defaultValue: 0,
      },
      email_enable: {
        type: Sequelize.DataTypes.ENUM('0', '1'),
        defaultValue: '0',
        allowNull: false,
        comment: '(0=no,1=yes)',
      },
      test_email_count: {
        type: Sequelize.DataTypes.INTEGER(2),
        defaultValue: '0',
      },
      discount_coupon: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      shopify_plan: {
        type: Sequelize.STRING(100), // You can set the length as needed
        allowNull: false,
      },
      point_branding: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {
          singular: 'point',
          plural: 'points',
        },
      },
    },
    {
      collate: 'utf8mb4_unicode_ci',
      timestamps: false,
    }
  );
};
