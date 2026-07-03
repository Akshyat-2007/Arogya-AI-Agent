import json
from datetime import datetime
from database import db

class MealPlan(db.Model):
    __tablename__ = 'meal_plans'
    
    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('family_members.id'), nullable=False)
    plan_type = db.Column(db.String(20), nullable=False)  # Daily, Weekly
    plan_json = db.Column(db.Text, nullable=False)  # Stored as serialized JSON string
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    @property
    def parsed_plan(self):
        """Parse plan_json column into python dict/list."""
        try:
            return json.loads(self.plan_json)
        except Exception:
            return {}

    def to_dict(self):
        return {
            'id': self.id,
            'member_id': self.member_id,
            'plan_type': self.plan_type,
            'plan': self.parsed_plan,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }
