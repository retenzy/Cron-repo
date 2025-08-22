const Sequelize = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define(
    'application_user',
    {
      id: {
        type: Sequelize.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      store_id: {
        type: Sequelize.INTEGER(11),
        allowNull: true,
        defaultValue: null,
      },
      user_id: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      email: {
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
      account_owner: {
        type: Sequelize.BOOLEAN,
      },
      locale: {
        type: Sequelize.STRING,
        defaultValue: null,
      },
      collaborator: {
        type: Sequelize.BOOLEAN,
      },
      email_verified: {
        type: Sequelize.BOOLEAN,
      },
    },
    {
      collate: 'utf8mb4_unicode_ci',
      timestamps: true,
    }
  );
};
