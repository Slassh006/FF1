import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { connectDB } from '@/app/lib/db';
import CraftlandCode from '@/app/models/CraftlandCode';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    await connectDB();
    
    const submissions = await CraftlandCode.find({
      submittedBy: userId
    })
    .sort({ createdAt: -1 })
    .select('_id code title description region status isFraudulent upvotes downvotes likes createdAt coverImage category difficulty videoUrl tags')
    .lean();

    return NextResponse.json({ submissions });
  } catch (error: any) {
    console.error('Error fetching craftland code submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
} 