import { NextResponse } from 'next/server';
import { syncDatabase } from '@/lib/database';
import { FamilyMember, MealPlan } from '@/lib/models';
import GeminiService from '@/lib/services/geminiService';

const geminiService = new GeminiService();

export async function POST(req, { params }) {
  try {
    await syncDatabase();
    const { id } = await params;
    const member = await FamilyMember.findByPk(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const data = await req.json() || {};
    const planType = data.plan_type || 'Daily';

    // Request from Gemini
    const mealPlanData = await geminiService.generateMealPlan(member, planType);

    // Save to database
    const newPlan = await MealPlan.create({
      member_id: member.id,
      plan_type: planType,
      plan_json: JSON.stringify(mealPlanData)
    });

    return NextResponse.json(newPlan.toDict());
  } catch (err) {
    return NextResponse.json({ error: `Failed to generate meal plan: ${err.message}` }, { status: 500 });
  }
}
