const Sequelize = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define(
    'order_address',
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
      address_type: {
        type: Sequelize.ENUM('shipping', 'billing'),
        allowNull: false,
      },
      address1: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      address2: {
        type: Sequelize.STRING,
      },
      city: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      country: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      first_name: {
        type: Sequelize.STRING,
      },
      last_name: {
        type: Sequelize.STRING,
      },
      phone: {
        type: Sequelize.STRING(20),
      },
      province: {
        type: Sequelize.STRING(20),
      },
      province_code: {
        type: Sequelize.STRING(20),
      },
      country_code: {
        type: Sequelize.STRING(20),
      },
      zip_code: {
        type: Sequelize.STRING(20),
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
          fields: ['store_id', 'order_id', 'address_type'],
        },
      ],
    }
  );
};
