const { DataTypes, Model } = require('sequelize');
const sequelize = require('../database');

class WeightLog extends Model {
  toDict() {
    return {
      id: this.id,
      member_id: this.member_id,
      weight_kg: this.weight_kg,
      bmi: this.bmi,
      logged_date: this.logged_date
    };
  }
}

WeightLog.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  member_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  weight_kg: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  bmi: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  logged_date: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'WeightLog',
  tableName: 'weight_logs',
  timestamps: false
});

module.exports = WeightLog;
