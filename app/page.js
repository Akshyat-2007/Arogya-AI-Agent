import { redirect } from 'next/navigation';
import { syncDatabase } from '@/lib/database';
import { FamilyMember } from '@/lib/models';

export default async function Home() {
  try {
    await syncDatabase();
    const members = await FamilyMember.findAll();
    if (members && members.length > 0) {
      redirect(`/dashboard?member_id=${members[0].id}`);
    } else {
      redirect('/profiles');
    }
  } catch (e) {
    console.error('Error in index route, redirecting to profiles:', e);
    redirect('/profiles');
  }
}
