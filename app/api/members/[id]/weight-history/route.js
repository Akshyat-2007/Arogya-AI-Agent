import { NextResponse } from 'next/server';
import { syncDatabase } from '@/lib/database';
import { FamilyMember, WeightLog } from '@/lib/models';

export async function GET(req, { params }) {
  try {
    await syncDatabase();
    const { id } = await params;
    const member = await FamilyMember.findByPk(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const logs = await WeightLog.findAll({
      where: { member_id: id },
      order: [['logged_date', 'ASC']]
    });

    return NextResponse.json(logs.map(log => log.toDict()));
  } catch (err) {
    return NextResponse.json({ error: `Failed to fetch weight history: ${err.message}` }, { status: 500 });
  }
}
