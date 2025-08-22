const Sequelize = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define(
    'order_item',
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
        type: Sequelize.INTEGER(11),
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      line_item_id: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      artwork_url: {
        type: Sequelize.STRING(100),
      },
      product_id: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      variant_id: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      product_title: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      variant_title: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      quantity: {
        type: Sequelize.INTEGER(20),
        allowNull: true,
      },
      fulfillment_status: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      price: {
        type: Sequelize.STRING(20),
        defaultValue: '0.00',
      },
      sku: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      item_discount_amount: {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: null,
      },
      // approve_artwork: {
      //   type: Sequelize.ENUM('0', '1'),
      //   allowNull: false,
      //   defaultValue: '0',
      //   comment: '(0=not approved, 1=approved)'
      // },
      shipment_status: {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: null,
      },
      is_review: {
        type: Sequelize.ENUM('0', '1'),
        allowNull: false,
        defaultValue: '0',
      },
      review_status: {
        type: Sequelize.ENUM('0', '1', '2'),
        allowNull: false,
        defaultValue: '0',
        comment: '(0=Email not sent, 1=Email sent, 2=Review submited)',
      },
      review_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      review_received_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      email_sent_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      email_reminder_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      email_reminder_count: {
        type: Sequelize.INTEGER(5),
        allowNull: true,
        defaultValue: 0,
      },
      fulfillment_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      delivery_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
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
          fields: ['store_id', 'order_id', 'line_item_id'],
        },
        {
          index: true,
          fields: ['store_id', 'review_date', 'review_status'],
        },
      ],
    }
  );
};
