from datetime import datetime
from database import db

class FamilyMember(db.Model):
    __tablename__ = 'family_members'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    gender = db.Column(db.String(20), nullable=False)  # Male, Female, Other
    height_cm = db.Column(db.Float, nullable=False)
    weight_kg = db.Column(db.Float, nullable=False)
    activity_level = db.Column(db.String(50), nullable=False)  # Sedentary, Light, Moderate, Active, Extra
    dietary_type = db.Column(db.String(50), nullable=False)  # Vegetarian, Vegan, Eggetarian, Non-Vegetarian
    allergies = db.Column(db.String(255), default='')  # Comma-separated
    health_goals = db.Column(db.String(255), nullable=False)  # Weight Loss, Muscle Gain, Maintenance, Manage Health
    regional_preference = db.Column(db.String(100), default='None')  # North Indian, South Indian, etc.
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    weight_logs = db.relationship('WeightLog', backref='member', cascade='all, delete-orphan', lazy=True)
    meal_plans = db.relationship('MealPlan', backref='member', cascade='all, delete-orphan', lazy=True)
    chat_histories = db.relationship('ChatHistory', backref='member', cascade='all, delete-orphan', lazy=True)

    @property
    def bmi(self):
        """Calculate current Body Mass Index (BMI)."""
        if not self.height_cm or not self.weight_kg:
            return 0.0
        height_m = self.height_cm / 100.0
        return round(self.weight_kg / (height_m ** 2), 1)

    @property
    def bmi_category(self):
        """Get BMI category name and CSS color class."""
        bmi_val = self.bmi
        if bmi_val < 18.5:
            return {'label': 'Underweight', 'color': 'warning', 'desc': 'Higher risk of nutritional deficiency.'}
        elif 18.5 <= bmi_val < 25:
            return {'label': 'Normal Weight', 'color': 'success', 'desc': 'Healthy weight range.'}
        elif 25 <= bmi_val < 30:
            return {'label': 'Overweight', 'color': 'warning', 'desc': 'Increased risk of cardiorespiratory issues.'}
        else:
            return {'label': 'Obese', 'color': 'danger', 'desc': 'Higher risk of metabolic disorders.'}

    @property
    def tdee(self):
        """Estimate TDEE (Total Daily Energy Expenditure) based on Harris-Benedict formula."""
        if not self.weight_kg or not self.height_cm or not self.age:
            return 2000
            
        # Basal Metabolic Rate (BMR) calculation
        if self.gender.lower() == 'male':
            bmr = 88.362 + (13.397 * self.weight_kg) + (4.799 * self.height_cm) - (5.677 * self.age)
        elif self.gender.lower() == 'female':
            bmr = 447.593 + (9.247 * self.weight_kg) + (3.098 * self.height_cm) - (4.330 * self.age)
        else:
            # Average/neutral BMR formula
            bmr = 267.97 + (11.32 * self.weight_kg) + (3.95 * self.height_cm) - (5.0 * self.age)

        # Activity multiplier
        activity_multipliers = {
            'sedentary': 1.2,
            'light': 1.375,
            'moderate': 1.55,
            'active': 1.725,
            'extra': 1.9
        }
        
        multiplier = activity_multipliers.get(self.activity_level.lower(), 1.2)
        return int(bmr * multiplier)

    @property
    def target_calories(self):
        """Calculate target daily calorie intake based on health goal."""
        tdee_val = self.tdee
        goal = self.health_goals.lower()
        
        if 'loss' in goal:
            target = tdee_val - 500
            min_calories = 1200 if self.gender.lower() == 'female' else 1500
            return max(target, min_calories)
        elif 'gain' in goal:
            return tdee_val + 400
        else: # Maintenance or managing health
            return tdee_val

    @property
    def target_macros(self):
        """Calculate target macronutrients based on calorie budget and health goal."""
        calories = self.target_calories
        goal = self.health_goals.lower()
        
        # Macro ratios (Carbs / Protein / Fat in percentage of calories)
        # 1g carb = 4 kcal, 1g protein = 4 kcal, 1g fat = 9 kcal
        if 'gain' in goal:
            # High protein, moderate-high carb, moderate fat
            p_pct, c_pct, f_pct = 0.25, 0.50, 0.25
        elif 'loss' in goal:
            # High protein, moderate-low carb, moderate fat
            p_pct, c_pct, f_pct = 0.30, 0.40, 0.30
        else:
            # Standard balanced diet
            p_pct, c_pct, f_pct = 0.20, 0.55, 0.25
            
        protein_g = round((calories * p_pct) / 4)
        carbs_g = round((calories * c_pct) / 4)
        fat_g = round((calories * f_pct) / 9)
        
        return {
            'protein': protein_g,
            'carbs': carbs_g,
            'fat': fat_g
        }
        
    def to_dict(self):
        """Convert model data to a dictionary for API use."""
        return {
            'id': self.id,
            'name': self.name,
            'age': self.age,
            'gender': self.gender,
            'height_cm': self.height_cm,
            'weight_kg': self.weight_kg,
            'activity_level': self.activity_level,
            'dietary_type': self.dietary_type,
            'allergies': self.allergies,
            'health_goals': self.health_goals,
            'regional_preference': self.regional_preference,
            'bmi': self.bmi,
            'bmi_category': self.bmi_category,
            'target_calories': self.target_calories,
            'target_macros': self.target_macros
        }
