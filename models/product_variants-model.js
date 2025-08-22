const Sequelize = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define(
    'product_variant',
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
      product_id: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      variant_id: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        defaultValue: null,
      },
      sku: {
        type: Sequelize.STRING,
      },
      image_id: {
        type: Sequelize.INTEGER(11),
        references: {
          model: 'product_images',
          key: 'id',
        },
      },
      grams: {
        type: Sequelize.STRING(100),
        defaultValue: null,
      },
      price: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: '0.00',
      },
      weight: {
        type: Sequelize.STRING(100),
        defaultValue: null,
      },
      barcode: {
        type: Sequelize.STRING(100),
        defaultValue: null,
      },
      option_1: {
        type: Sequelize.STRING(100),
        defaultValue: null,
      },
      option_value_1: {
        type: Sequelize.STRING(100),
        defaultValue: null,
      },
      option_2: {
        type: Sequelize.STRING(100),
        defaultValue: null,
      },
      option_value_2: {
        type: Sequelize.STRING(100),
        defaultValue: null,
      },
      option_3: {
        type: Sequelize.STRING(100),
        defaultValue: null,
      },
      option_value_3: {
        type: Sequelize.STRING(100),
        defaultValue: null,
      },
      position: {
        type: Sequelize.STRING(20),
        defaultValue: null,
      },
      compared_at_price: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: '0.00',
      },
      inventory_management: {
        type: Sequelize.STRING(100),
        defaultValue: null,
      },
      inventory_policy: {
        type: Sequelize.STRING(20),
        defaultValue: null,
      },
      inventory_item_id: {
        type: Sequelize.STRING(20),
        defaultValue: null,
      },
      inventory_quantity: {
        type: Sequelize.INTEGER(20),
        defaultValue: null,
      },
      is_delete: {
        type: Sequelize.ENUM('0', '1'),
        defaultValue: '0',
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
          fields: ['store_id', 'product_id', 'variant_id'],
        },
      ],
    }
  );
};
