const Sequelize = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('point_branding', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    store_id: {
      type: Sequelize.INTEGER,
      references: {
        model: 'stores',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    branding: {
      type: Sequelize.JSON,
      allowNull: true,
    },
  });
};
