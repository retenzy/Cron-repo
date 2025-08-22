const Sequelize = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define(
    'limit_reached',
    {
      id: {
        type: Sequelize.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      store_id: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
        references: {
          model: 'stores',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      type: {
        type: Sequelize.STRING(30),
        defaultValue: 'email',
        comment: '(limit reached for email,order,customer)',
      },
      mail_sent_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      is_mail_sent: {
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
