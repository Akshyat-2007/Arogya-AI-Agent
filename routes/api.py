import json
from datetime import datetime
from flask import Blueprint, jsonify, request
from database import db
from models import FamilyMember, WeightLog, MealPlan, ChatHistory
from services import GeminiService

api_bp = Blueprint('api', __name__)
gemini_service = GeminiService()

# ----------------------------------------------------
# FAMILY MEMBERS CRUD API
# ----------------------------------------------------

@api_bp.route('/members', methods=['GET'])
def get_members():
    members = FamilyMember.query.all()
    return jsonify([m.to_dict() for m in members])

@api_bp.route('/members/<int:member_id>', methods=['GET'])
def get_member(member_id):
    member = FamilyMember.query.get(member_id)
    if not member:
        return jsonify({'error': 'Member not found'}), 404
    return jsonify(member.to_dict())

@api_bp.route('/members', methods=['POST'])
def create_member():
    data = request.get_json() or {}
    
    # Validation
    required_fields = ['name', 'age', 'gender', 'height_cm', 'weight_kg', 'activity_level', 'dietary_type', 'health_goals']
    missing = [field for field in required_fields if field not in data or data[field] is None]
    if missing:
        return jsonify({'error': f'Missing required fields: {", ".join(missing)}'}), 400

    try:
        member = FamilyMember(
            name=data['name'],
            age=int(data['age']),
            gender=data['gender'],
            height_cm=float(data['height_cm']),
            weight_kg=float(data['weight_kg']),
            activity_level=data['activity_level'],
            dietary_type=data['dietary_type'],
            allergies=data.get('allergies', ''),
            health_goals=data['health_goals'],
            regional_preference=data.get('regional_preference', 'None')
        )
        db.session.add(member)
        db.session.commit()

        # Log initial weight
        initial_log = WeightLog(
            member_id=member.id,
            weight_kg=member.weight_kg,
            bmi=member.bmi
        )
        db.session.add(initial_log)
        db.session.commit()

        return jsonify(member.to_dict()), 210
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create member: {str(e)}'}), 500

@api_bp.route('/members/<int:member_id>', methods=['PUT'])
def update_member(member_id):
    member = FamilyMember.query.get(member_id)
    if not member:
        return jsonify({'error': 'Member not found'}), 404
        
    data = request.get_json() or {}
    
    try:
        if 'name' in data: member.name = data['name']
        if 'age' in data: member.age = int(data['age'])
        if 'gender' in data: member.gender = data['gender']
        if 'height_cm' in data: member.height_cm = float(data['height_cm'])
        if 'activity_level' in data: member.activity_level = data['activity_level']
        if 'dietary_type' in data: member.dietary_type = data['dietary_type']
        if 'allergies' in data: member.allergies = data['allergies']
        if 'health_goals' in data: member.health_goals = data['health_goals']
        if 'regional_preference' in data: member.regional_preference = data['regional_preference']

        # Special weight update logic (creates a weight log if changed)
        if 'weight_kg' in data:
            new_weight = float(data['weight_kg'])
            if new_weight != member.weight_kg:
                member.weight_kg = new_weight
                # Trigger weight history log
                weight_log = WeightLog(
                    member_id=member.id,
                    weight_kg=new_weight,
                    bmi=member.bmi
                )
                db.session.add(weight_log)

        db.session.commit()
        return jsonify(member.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update member: {str(e)}'}), 500

@api_bp.route('/members/<int:member_id>', methods=['DELETE'])
def delete_member(member_id):
    member = FamilyMember.query.get(member_id)
    if not member:
        return jsonify({'error': 'Member not found'}), 404
        
    try:
        db.session.delete(member)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Member profile deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete member: {str(e)}'}), 500

# ----------------------------------------------------
# WEIGHT LOGGING API
# ----------------------------------------------------

@api_bp.route('/members/<int:member_id>/weight', methods=['POST'])
def add_weight_log(member_id):
    member = FamilyMember.query.get(member_id)
    if not member:
        return jsonify({'error': 'Member not found'}), 404
        
    data = request.get_json() or {}
    if 'weight_kg' not in data:
        return jsonify({'error': 'Weight in kg is required'}), 400
        
    try:
        weight_val = float(data['weight_kg'])
        
        # 1. Update current weight on family member
        member.weight_kg = weight_val
        
        # 2. Add log entry
        log_entry = WeightLog(
            member_id=member.id,
            weight_kg=weight_val,
            bmi=member.bmi
        )
        db.session.add(log_entry)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'member': member.to_dict(),
            'logged_entry': log_entry.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to log weight: {str(e)}'}), 500

@api_bp.route('/members/<int:member_id>/weight-history', methods=['GET'])
def get_weight_history(member_id):
    member = FamilyMember.query.get(member_id)
    if not member:
        return jsonify({'error': 'Member not found'}), 404
        
    logs = WeightLog.query.filter_by(member_id=member_id).order_by(WeightLog.logged_date.asc()).all()
    return jsonify([log.to_dict() for log in logs])

# ----------------------------------------------------
# CHAT LOGIC API
# ----------------------------------------------------

@api_bp.route('/members/<int:member_id>/chats', methods=['GET'])
def get_chat_history(member_id):
    member = FamilyMember.query.get(member_id)
    if not member:
        return jsonify({'error': 'Member not found'}), 404
        
    chats = ChatHistory.query.filter_by(member_id=member_id).order_by(ChatHistory.timestamp.asc()).all()
    return jsonify([c.to_dict() for c in chats])

@api_bp.route('/members/<int:member_id>/chat', methods=['POST'])
def send_chat_message(member_id):
    member = FamilyMember.query.get(member_id)
    if not member:
        return jsonify({'error': 'Member not found'}), 404
        
    data = request.get_json() or {}
    user_message = data.get('message', '').strip()
    
    if not user_message:
        return jsonify({'error': 'Message content is empty'}), 400
        
    try:
        # 1. Save user message to database
        user_chat = ChatHistory(
            member_id=member.id,
            sender='user',
            message=user_message
        )
        db.session.add(user_chat)
        db.session.commit()
        
        # 2. Get past history for context (exclude current user_chat since we pass it separately)
        past_chats = ChatHistory.query.filter_by(member_id=member_id)\
                                      .filter(ChatHistory.id != user_chat.id)\
                                      .order_by(ChatHistory.timestamp.asc())\
                                      .limit(20).all()
        
        # 3. Call Gemini API
        ai_response = gemini_service.get_chat_response(member, past_chats, user_message)
        
        # 4. Save AI response to database
        agent_chat = ChatHistory(
            member_id=member.id,
            sender='agent',
            message=ai_response
        )
        db.session.add(agent_chat)
        db.session.commit()
        
        return jsonify({
            'user_message': user_chat.to_dict(),
            'agent_message': agent_chat.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to process chat: {str(e)}'}), 500

# ----------------------------------------------------
# MEAL PLANNER API
# ----------------------------------------------------

@api_bp.route('/members/<int:member_id>/meal-plan/generate', methods=['POST'])
def generate_meal_plan(member_id):
    member = FamilyMember.query.get(member_id)
    if not member:
        return jsonify({'error': 'Member not found'}), 404
        
    data = request.get_json() or {}
    plan_type = data.get('plan_type', 'Daily')  # Daily / Weekly
    
    try:
        # Request from Gemini (or mock if no key / error)
        meal_plan_data = gemini_service.generate_meal_plan(member, plan_type=plan_type)
        
        # Save to database
        new_plan = MealPlan(
            member_id=member.id,
            plan_type=plan_type,
            plan_json=json.dumps(meal_plan_data)
        )
        db.session.add(new_plan)
        db.session.commit()
        
        return jsonify(new_plan.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to generate meal plan: {str(e)}'}), 500
        
@api_bp.route('/members/<int:member_id>/meal-plans', methods=['GET'])
def get_meal_plans(member_id):
    member = FamilyMember.query.get(member_id)
    if not member:
        return jsonify({'error': 'Member not found'}), 404
        
    plans = MealPlan.query.filter_by(member_id=member_id).order_by(MealPlan.created_at.desc()).all()
    return jsonify([p.to_dict() for p in plans])
