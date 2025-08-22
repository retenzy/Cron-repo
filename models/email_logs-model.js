const Sequelize = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define(
    'email_logs',
    {
      id: {
        type: Sequelize.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      store_id: {
        type: Sequelize.INTEGER(11),
        allowNull: true,
        references: {
          model: 'stores',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      email_type: {
        type: Sequelize.STRING(100),
      },
      sent_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        defaultValue: null,
        allowNull: true,
      },
      email_sent_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      order_id: {
        type: Sequelize.STRING(20), // Nullable, as not all emails are tied to orders
        allowNull: true,
        defaultValue: null,
        references: {
          model: 'orders',
          key: 'order_id',
        },
      },
      email_message_id: {
        type: Sequelize.STRING(100),
        defaultValue: null,
      },
      email_client: {
        type: Sequelize.STRING(20),
        defaultValue: 'Retenzy',
      },
      mail_status: {
        type: Sequelize.STRING(20),
        defaultValue: null,
      },
      event_type: {
        type: Sequelize.STRING(20),
        defaultValue: null,
      },
    },
    {
      collate: 'utf8mb4_unicode_ci',
      timestamps: false,
    }
  );
};
