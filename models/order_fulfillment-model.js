const Sequelize = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define(
    'order_fulfillments',
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
        type: Sequelize.INTEGER(11),
        allowNull: false,
        references: {
          model: 'order_items',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      fulfillment_id: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      location_id: {
        type: Sequelize.STRING(20),
        allowNull: true,
        defaultValue: null,
      },
      fulfillable_quantity: {
        type: Sequelize.INTEGER(20),
        allowNull: true,
        defaultValue: null,
      },
      shipment_status: {
        type: Sequelize.INTEGER(20),
        allowNull: true,
        defaultValue: null,
      },
      tracking_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      tracking_company: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      tracking_url: {
        type: Sequelize.STRING(250),
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
      },
    },
    {
      collate: 'utf8mb4_unicode_ci',
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ['store_id', 'order_id', 'line_item_id', 'fulfillment_id'],
        },
      ],
    }
  );
};
