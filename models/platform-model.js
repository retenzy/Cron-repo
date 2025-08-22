const Sequelize = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'platform',
    {
      id: {
        type: Sequelize.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
      },
      status: {
        type: Sequelize.DataTypes.ENUM('Active', 'Inactive', 'Beta'),
        allowNull: false,
      },
    },
    {
      collate: 'utf8mb4_unicode_ci',
      timestamps: false,
    }
  );
};
