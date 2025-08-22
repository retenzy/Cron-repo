const Sequelize = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define(
    'application_log',
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
      level: {
        type: Sequelize.ENUM('error', 'info'),
        defaultValue: 'error',
      },
      message: {
        type: Sequelize.STRING,
      },
      value: {
        type: Sequelize.JSON,
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
