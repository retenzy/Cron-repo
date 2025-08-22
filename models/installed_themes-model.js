const Sequelize = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define(
    'installed_themes',
    {
      id: {
        type: Sequelize.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
        unique: true,
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
      theme_ids: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      script_tag_ids: {
        type: Sequelize.TEXT,
      },
      published_theme_id: {
        type: Sequelize.TEXT,
      },
    },
    {
      collate: 'latin1_swedish_ci',
      timestamps: false,
    }
  );
};
