const Sequelize = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define(
    'credit_list',
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
      },
      customer_email: {
        type: Sequelize.STRING,
      },
      credit: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      credit_expiry_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      is_credit_expired: {
        type: Sequelize.ENUM('0', '1'),
        allowNull: false,
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
