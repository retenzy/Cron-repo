const Sequelize = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define(
    'credit_log',
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
      customer_credit_id: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      customer_email: {
        type: Sequelize.STRING,
      },
      credit: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      available: {
        type: Sequelize.STRING,
        defaultValue: null,
      },
      is_expired: {
        type: Sequelize.ENUM('0', '1'),
        defaultValue: '0',
      },
      expiry_date: {
        type: Sequelize.DATEONLY,
      },
      action_type: {
        type: Sequelize.ENUM('credit', 'redeem', 'expired'),
        allowNull: false,
      },
      comment: {
        type: Sequelize.STRING,
        defaultValue: null,
      },
      is_email_send: {
        type: Sequelize.ENUM('0', '1'),
        defaultValue: '0',
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: true,
      },
    },
    {
      collate: 'utf8mb4_unicode_ci',
      timestamps: false,
    }
  );
};
