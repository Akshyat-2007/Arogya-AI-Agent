from flask import Blueprint, render_template, redirect, url_for, request
from models import FamilyMember

web_bp = Blueprint('web', __name__)

@web_bp.route('/')
def index():
    # If there are members, go to dashboard, otherwise redirect to profiles to create one
    first_member = FamilyMember.query.first()
    if first_member:
        return redirect(url_for('web.dashboard', member_id=first_member.id))
    return redirect(url_for('web.profiles'))

@web_bp.route('/dashboard')
def dashboard():
    member_id = request.args.get('member_id', type=int)
    members = FamilyMember.query.all()
    
    selected_member = None
    if member_id:
        selected_member = FamilyMember.query.get(member_id)
    elif members:
        selected_member = members[0]
        
    return render_template(
        'dashboard.html',
        members=members,
        selected_member=selected_member
    )

@web_bp.route('/profiles')
def profiles():
    members = FamilyMember.query.all()
    return render_template('profiles.html', members=members)

@web_bp.route('/chat')
def chat():
    member_id = request.args.get('member_id', type=int)
    members = FamilyMember.query.all()
    
    selected_member = None
    if member_id:
        selected_member = FamilyMember.query.get(member_id)
    elif members:
        selected_member = members[0]
        
    return render_template(
        'chat.html',
        members=members,
        selected_member=selected_member
    )

@web_bp.route('/meal-planner')
def meal_planner():
    member_id = request.args.get('member_id', type=int)
    members = FamilyMember.query.all()
    
    selected_member = None
    if member_id:
        selected_member = FamilyMember.query.get(member_id)
    elif members:
        selected_member = members[0]
        
    # Get the latest meal plan if any exists
    latest_plan = None
    if selected_member:
        from models.meal_plan import MealPlan
        latest_plan = MealPlan.query.filter_by(member_id=selected_member.id).order_by(MealPlan.created_at.desc()).first()

    return render_template(
        'meal_planner.html',
        members=members,
        selected_member=selected_member,
        latest_plan=latest_plan
    )

@web_bp.route('/bmi')
def bmi_calculator():
    # Standalone BMI page that doesn't strictly require saving, but can link to profile creation
    return render_template('bmi.html')
