from datetime import datetime
from database import db

class WeightLog(db.Model):
    __tablename__ = 'weight_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('family_members.id'), nullable=False)
    weight_kg = db.Column(db.Float, nullable=False)
    bmi = db.Column(db.Float, nullable=False)
    logged_date = db.Column(db.Date, default=datetime.utcnow().date)
    
    def to_dict(self):
        return {
            'id': self.id,
            'member_id': self.member_id,
            'weight_kg': self.weight_kg,
            'bmi': self.bmi,
            'logged_date': self.logged_date.strftime('%Y-%m-%d')
        }
