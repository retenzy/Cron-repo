const Sequelize = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define(
    'customer',
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
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      customer_email: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      first_name: {
        type: Sequelize.STRING,
        defaultValue: null,
      },
      last_name: {
        type: Sequelize.STRING,
        defaultValue: null,
      },
      accepts_marketing: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      orders_count: {
        type: Sequelize.INTEGER(20),
        defaultValue: 0,
      },
      total_spent: {
        type: Sequelize.INTEGER(20),
        defaultValue: 0,
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      country_code: {
        type: Sequelize.INTEGER(44),
        defaultValue: null,
      },
      tags: {
        type: Sequelize.STRING,
        defaultValue: null,
      },
      is_credit: {
        type: Sequelize.ENUM('0', '1'),
        defaultValue: '0',
      },
      date_of_birth: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      date_of_anniversary: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      gender: {
        type: Sequelize.STRING(8),
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
          fields: ['store_id', 'customer_id'],
        },
      ],
    }
  );
};
