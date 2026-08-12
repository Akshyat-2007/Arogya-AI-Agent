import { NextResponse } from 'next/server';
import { syncDatabase } from '@/lib/database';
import { FamilyMember, ChatHistory } from '@/lib/models';
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
    const userMessage = (data.message || '').trim();

    if (!userMessage) {
      return NextResponse.json({ error: 'Message content is empty' }, { status: 400 });
    }

    // Save user message to database
    const userChat = await ChatHistory.create({
      member_id: member.id,
      sender: 'user',
      message: userMessage
    });

    // Get past history for context
    const pastChats = await ChatHistory.findAll({
      where: { member_id: member.id },
      order: [['timestamp', 'ASC']],
      limit: 20
    });

    // Remove the latest userChat from past history context passed to Gemini
    const contextHistory = pastChats.filter(chat => chat.id !== userChat.id);

    // Call Gemini API
    const aiResponse = await geminiService.getChatResponse(member, contextHistory, userMessage);

    // Save AI response to database
    const agentChat = await ChatHistory.create({
      member_id: member.id,
      sender: 'agent',
      message: aiResponse
    });

    return NextResponse.json({
      user_message: userChat.toDict(),
      agent_message: agentChat.toDict()
    });
  } catch (err) {
    return NextResponse.json({ error: `Failed to process chat: ${err.message}` }, { status: 500 });
  }
}
