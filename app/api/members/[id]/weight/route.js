import { NextResponse } from 'next/server';
import { syncDatabase } from '@/lib/database';
import { FamilyMember, WeightLog } from '@/lib/models';

export async function POST(req, { params }) {
  try {
    await syncDatabase();
    const { id } = await params;
    const member = await FamilyMember.findByPk(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const data = await req.json() || {};
    if (!('weight_kg' in data)) {
      return NextResponse.json({ error: 'Weight in kg is required' }, { status: 400 });
    }

    const weightVal = parseFloat(data.weight_kg);
    member.weight_kg = weightVal;
    await member.save();

    const logEntry = await WeightLog.create({
      member_id: member.id,
      weight_kg: weightVal,
      bmi: member.bmi
    });

    return NextResponse.json({
      success: true,
      member: member.toDict(),
      logged_entry: logEntry.toDict()
    });
  } catch (err) {
    return NextResponse.json({ error: `Failed to log weight: ${err.message}` }, { status: 500 });
  }
}
