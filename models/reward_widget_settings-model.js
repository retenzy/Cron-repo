const Sequelize = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define(
    'reward_widget_settings',
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
      // is_display: {
      //   type: Sequelize.ENUM("0", "1"),
      //   defaultValue: "0",
      // },
      value: {
        type: Sequelize.JSON,
        defaultValue: null,
      },
      key: {
        type: Sequelize.STRING(30),
        defaultValue: null,
      },
      // value: {
      //   type: Sequelize.TEXT,
      //   defaultValue: null,
      // },
    },
    {
      collate: 'utf8mb4_unicode_ci',
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ['store_id', 'key'],
        },
      ],
    }
  );
};
