import { NextResponse } from 'next/server';
import { syncDatabase } from '@/lib/database';
import { FamilyMember, ChatHistory } from '@/lib/models';

export async function GET(req, { params }) {
  try {
    await syncDatabase();
    const { id } = await params;
    const member = await FamilyMember.findByPk(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const chats = await ChatHistory.findAll({
      where: { member_id: id },
      order: [['timestamp', 'ASC']]
    });

    return NextResponse.json(chats.map(chat => chat.toDict()));
  } catch (err) {
    return NextResponse.json({ error: `Failed to fetch chat history: ${err.message}` }, { status: 500 });
  }
}
