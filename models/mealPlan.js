const { DataTypes, Model } = require('sequelize');
const sequelize = require('../database');

class MealPlan extends Model {
  get parsed_plan() {
    try {
      return this.plan_json ? JSON.parse(this.plan_json) : {};
    } catch (e) {
      return {};
    }
  }

  toDict() {
    const formattedCreatedAt = this.created_at
      ? new Date(this.created_at).toISOString().replace('T', ' ').substring(0, 19)
      : '';
    return {
      id: this.id,
      member_id: this.member_id,
      plan_type: this.plan_type,
      plan: this.parsed_plan,
      created_at: formattedCreatedAt
    };
  }
}

MealPlan.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  member_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  plan_type: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  plan_json: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'MealPlan',
  tableName: 'meal_plans',
  timestamps: false
});

module.exports = MealPlan;
