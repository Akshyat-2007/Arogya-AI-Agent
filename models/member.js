const { DataTypes, Model } = require('sequelize');
const sequelize = require('../database');

class FamilyMember extends Model {
  get bmi() {
    if (!this.height_cm || !this.weight_kg) return 0.0;
    const height_m = this.height_cm / 100.0;
    return Math.round((this.weight_kg / (height_m * height_m)) * 10) / 10;
  }

  get bmi_category() {
    const bmi_val = this.bmi;
    if (bmi_val < 18.5) {
      return { label: 'Underweight', color: 'warning', desc: 'Higher risk of nutritional deficiency.' };
    } else if (bmi_val >= 18.5 && bmi_val < 25) {
      return { label: 'Normal Weight', color: 'success', desc: 'Healthy weight range.' };
    } else if (bmi_val >= 25 && bmi_val < 30) {
      return { label: 'Overweight', color: 'warning', desc: 'Increased risk of cardiorespiratory issues.' };
    } else {
      return { label: 'Obese', color: 'danger', desc: 'Higher risk of metabolic disorders.' };
    }
  }

  get tdee() {
    if (!this.weight_kg || !this.height_cm || !this.age) return 2000;
    let bmr;
    if (this.gender.toLowerCase() === 'male') {
      bmr = 88.362 + (13.397 * this.weight_kg) + (4.799 * this.height_cm) - (5.677 * this.age);
    } else if (this.gender.toLowerCase() === 'female') {
      bmr = 447.593 + (9.247 * this.weight_kg) + (3.098 * this.height_cm) - (4.330 * this.age);
    } else {
      bmr = 267.97 + (11.32 * this.weight_kg) + (3.95 * this.height_cm) - (5.0 * this.age);
    }

    const activity_multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      extra: 1.9
    };
    const multiplier = activity_multipliers[this.activity_level.toLowerCase()] || 1.2;
    return Math.round(bmr * multiplier);
  }

  get target_calories() {
    const tdee_val = this.tdee;
    const goal = this.health_goals.toLowerCase();
    if (goal.includes('loss')) {
      const target = tdee_val - 500;
      const min_calories = this.gender.toLowerCase() === 'female' ? 1200 : 1500;
      return Math.max(target, min_calories);
    } else if (goal.includes('gain')) {
      return tdee_val + 400;
    } else {
      return tdee_val;
    }
  }

  get target_macros() {
    const calories = this.target_calories;
    const goal = this.health_goals.toLowerCase();
    let p_pct, c_pct, f_pct;
    if (goal.includes('gain')) {
      p_pct = 0.25; c_pct = 0.50; f_pct = 0.25;
    } else if (goal.includes('loss')) {
      p_pct = 0.30; c_pct = 0.40; f_pct = 0.30;
    } else {
      p_pct = 0.20; c_pct = 0.55; f_pct = 0.25;
    }

    const protein_g = Math.round((calories * p_pct) / 4);
    const carbs_g = Math.round((calories * c_pct) / 4);
    const fat_g = Math.round((calories * f_pct) / 9);

    return {
      protein: protein_g,
      carbs: carbs_g,
      fat: fat_g
    };
  }

  toDict() {
    return {
      id: this.id,
      name: this.name,
      age: this.age,
      gender: this.gender,
      height_cm: this.height_cm,
      weight_kg: this.weight_kg,
      activity_level: this.activity_level,
      dietary_type: this.dietary_type,
      allergies: this.allergies,
      health_goals: this.health_goals,
      regional_preference: this.regional_preference,
      bmi: this.bmi,
      bmi_category: this.bmi_category,
      target_calories: this.target_calories,
      target_macros: this.target_macros
    };
  }
}

FamilyMember.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  gender: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  height_cm: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  weight_kg: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  activity_level: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  dietary_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  allergies: {
    type: DataTypes.STRING(255),
    defaultValue: ''
  },
  health_goals: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  regional_preference: {
    type: DataTypes.STRING(100),
    defaultValue: 'None'
  }
}, {
  sequelize,
  modelName: 'FamilyMember',
  tableName: 'family_members',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = FamilyMember;
