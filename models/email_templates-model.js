const Sequelize = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define(
    'email_templates',
    {
      id: {
        type: Sequelize.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      store_id: {
        type: Sequelize.INTEGER(11),
        defaultValue: null,
        references: {
          model: 'stores',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      template_key: {
        type: Sequelize.STRING(30),
        defaultValue: null,
      },
      name: {
        type: Sequelize.STRING(255),
        defaultValue: null,
      },
      value: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      json_value: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      subject: {
        type: Sequelize.TEXT,
        defaultValue: null,
      },
      campaign_name: {
        type: Sequelize.STRING(255),
        defaultValue: null,
      },
      is_active: {
        type: Sequelize.DataTypes.ENUM('0', '1'),
        defaultValue: '0',
        allowNull: false,
      },
    },
    {
      collate: 'utf8mb4_unicode_ci',
      timestamps: false,
    }
  );
};
