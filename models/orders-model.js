const Sequelize = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define(
    'order',
    {
      id: {
        type: Sequelize.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      store_id: {
        type: Sequelize.INTEGER(11),
        references: {
          model: 'stores',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      order_id: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      order_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: null,
      },
      order_created_at: {
        type: Sequelize.DATE,
      },
      order_updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      order_cancelled_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      customer_email: {
        type: Sequelize.STRING(250),
        // allowNull: false,
      },
      customer_id: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      price: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      fulfillment_status: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },

      financial_status: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      is_cep_order: {
        type: Sequelize.ENUM('0', '1', '2'),
        allowNull: false,
        defaultValue: '0',
        comment: '(1=order from deal, 2=Order by reward coupon)',
      },
      discount: {
        type: Sequelize.STRING(20),
        defaultValue: null,
      },
      gateway: {
        type: Sequelize.STRING(20),
        defaultValue: null,
      },
      // delivery_status: {
      //   type: Sequelize.STRING(20),
      //   allowNull: true,
      // },
      // is_reviewed: {
      //   type: Sequelize.ENUM("0", "1"),
      //   defaultValue: "0",
      // },
      // review_received_date: { type: Sequelize.DATE, allowNull: true },
      // review_request_sent: {
      //   type: Sequelize.ENUM("0", "1"),
      //   defaultValue: "0",
      // },
      // review_reminder_sent: {
      //   type: Sequelize.ENUM("0", "1", "2"),
      //   defaultValue: "0",
      //   comment: "(0=no reminder send,1=1st reminder sent,2=2nd reminder sent)",
      // },
      // request_sent_date: {
      //   type: Sequelize.DATE,
      //   allowNull: true,
      // },
      // reminder_sent_date: {
      //   type: Sequelize.DATE,
      //   allowNull: true,
      // },
      // email_message_id: {
      //   type: Sequelize.STRING(100),
      // },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: true,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    },
    {
      collate: 'utf8mb4_unicode_ci',
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ['store_id', 'order_id', 'customer_id'],
        },
        {
          fields: ['customer_id'],
        },
      ],
    }
  );
};
