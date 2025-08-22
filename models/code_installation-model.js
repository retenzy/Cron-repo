const Sequelize = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define(
    'code_installation',
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
      key_name: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      value: {
        type: Sequelize.TEXT('long') + ' CHARSET utf8 COLLATE utf8_general_ci',
      },
    },
    {
      collate: 'utf8mb4_general_ci',
      timestamps: false,
    }
  );
};
