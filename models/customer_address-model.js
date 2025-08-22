const Sequelize = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define(
    'customer_address',
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
      customer_id: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      address_id: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      first_name: {
        type: Sequelize.STRING,
        defaultValue: null,
      },
      last_name: {
        type: Sequelize.STRING,
        defaultValue: null,
      },
      address1: {
        type: Sequelize.STRING,
      },
      address2: {
        type: Sequelize.STRING,
      },
      city: {
        type: Sequelize.STRING,
      },
      country: {
        type: Sequelize.STRING,
      },
      phone: {
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
      is_default_address: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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
          fields: ['store_id', 'customer_id', 'address_id'],
        },
      ],
    }
  );
};
