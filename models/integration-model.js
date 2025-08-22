const Sequelize = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define(
    'integration',
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
      app: {
        type: Sequelize.STRING(30),
        defaultValue: null,
      },
      credential: {
        type: Sequelize.TEXT,
        defaultValue: null,
      },
      otherData: {
        type: Sequelize.TEXT,
        defaultValue: null,
      },
      is_connected: {
        type: Sequelize.ENUM('1', '0'),
        defaultValue: '0',
      },
    },
    {
      collate: 'utf8mb4_unicode_ci',
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ['store_id', 'app'],
        },
      ],
    }
  );
};
