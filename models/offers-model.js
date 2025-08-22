const Sequelize = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define(
    'offer',
    {
      id: {
        type: Sequelize.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      store_id: {
        type: Sequelize.INTEGER(11),
        references: {
          model: 'stores',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      product_id: {
        type: Sequelize.JSON,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      variant: {
        type: Sequelize.JSON,
        allowNull: true,
        references: {
          model: 'products',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      customer_ids: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      discount_value: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('fixed', 'percentage'),
        allowNull: false,
      },
      is_active: {
        type: Sequelize.ENUM('0', '1', '2'),
        allowNull: false,
      },
      is_draft: {
        type: Sequelize.STRING(20),
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },

      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      start_time: {
        type: Sequelize.STRING(20),
        default: '0.00',
      },
      end_time: {
        type: Sequelize.STRING(20),
        default: '0.00',
      },
      banner_img: {
        type: Sequelize.STRING,
        default: null,
      },
      deal_url: {
        type: Sequelize.STRING,
        default: null,
      },
      deal_type: {
        type: Sequelize.ENUM('all', 'selected', 'page'),
        allowNull: false,
        default: 'all',
      },
      page_settings: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: true,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    },
    {
      collate: 'utf8mb4_unicode_ci',
      timestamps: false,
    }
  );
};
