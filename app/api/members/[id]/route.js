import { NextResponse } from 'next/server';
import { syncDatabase } from '@/lib/database';
import { FamilyMember, WeightLog, ChatHistory, MealPlan } from '@/lib/models';

export async function GET(req, { params }) {
  try {
    await syncDatabase();
    const { id } = await params;
    const member = await FamilyMember.findByPk(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
    return NextResponse.json(member.toDict());
  } catch (err) {
    return NextResponse.json({ error: `Failed to fetch member: ${err.message}` }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await syncDatabase();
    const { id } = await params;
    const member = await FamilyMember.findByPk(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const data = await req.json() || {};

    if ('name' in data) member.name = data.name;
    if ('age' in data) member.age = parseInt(data.age);
    if ('gender' in data) member.gender = data.gender;
    if ('height_cm' in data) member.height_cm = parseFloat(data.height_cm);
    if ('activity_level' in data) member.activity_level = data.activity_level;
    if ('dietary_type' in data) member.dietary_type = data.dietary_type;
    if ('allergies' in data) member.allergies = data.allergies;
    if ('health_goals' in data) member.health_goals = data.health_goals;
    if ('regional_preference' in data) member.regional_preference = data.regional_preference;

    // Special weight update logic
    if ('weight_kg' in data) {
      const newWeight = parseFloat(data.weight_kg);
      if (newWeight !== member.weight_kg) {
        member.weight_kg = newWeight;
        // Trigger weight history log
        await WeightLog.create({
          member_id: member.id,
          weight_kg: newWeight,
          bmi: member.bmi
        });
      }
    }

    await member.save();
    return NextResponse.json(member.toDict());
  } catch (err) {
    return NextResponse.json({ error: `Failed to update member: ${err.message}` }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await syncDatabase();
    const { id } = await params;
    const member = await FamilyMember.findByPk(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Manually delete dependent records to satisfy foreign key constraints
    await WeightLog.destroy({ where: { member_id: member.id } });
    await ChatHistory.destroy({ where: { member_id: member.id } });
    await MealPlan.destroy({ where: { member_id: member.id } });

    await member.destroy();
    return NextResponse.json({ success: true, message: 'Member profile deleted successfully' });
  } catch (err) {
    return NextResponse.json({ error: `Failed to delete member: ${err.message}` }, { status: 500 });
  }
}
