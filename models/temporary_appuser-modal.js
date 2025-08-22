const Sequelize = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define(
    'temporary_appuser',
    {
      id: {
        type: Sequelize.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      shop: {
        type: Sequelize.STRING,
        defaultValue: null,
      },
      ip_address: {
        type: Sequelize.TEXT,
        defaultValue: null,
      },
      user_data: {
        type: Sequelize.JSON,
        defaultValue: null,
      },
    },
    {
      collate: 'utf8mb4_unicode_ci',
      timestamps: true,
    }
  );
};
