import { NextResponse } from 'next/server';
import { syncDatabase } from '@/lib/database';
import { FamilyMember, WeightLog } from '@/lib/models';

export async function GET() {
  try {
    await syncDatabase();
    const members = await FamilyMember.findAll();
    return NextResponse.json(members.map(m => m.toDict()));
  } catch (err) {
    return NextResponse.json({ error: `Failed to fetch members: ${err.message}` }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await syncDatabase();
    const data = await req.json() || {};

    // Validation
    const requiredFields = ['name', 'age', 'gender', 'height_cm', 'weight_kg', 'activity_level', 'dietary_type', 'health_goals'];
    const missing = requiredFields.filter(field => !(field in data) || data[field] === null || data[field] === undefined);
    if (missing.length > 0) {
      return NextResponse.json({ error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 });
    }

    const member = await FamilyMember.create({
      name: data.name,
      age: parseInt(data.age),
      gender: data.gender,
      height_cm: parseFloat(data.height_cm),
      weight_kg: parseFloat(data.weight_kg),
      activity_level: data.activity_level,
      dietary_type: data.dietary_type,
      allergies: data.allergies || '',
      health_goals: data.health_goals,
      regional_preference: data.regional_preference || 'None'
    });

    // Log initial weight
    await WeightLog.create({
      member_id: member.id,
      weight_kg: member.weight_kg,
      bmi: member.bmi
    });

    return NextResponse.json(member.toDict(), { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: `Failed to create member: ${err.message}` }, { status: 500 });
  }
}
