import { NextRequest, NextResponse } from 'next/server';
import Quiz from '@/app/models/Quiz';
import { connectDB } from '@/app/lib/db';

interface Params {
  params: {
    id: string;
  };
}

// GET /api/quiz/leaderboard/:id - Get quiz leaderboard
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const quiz = await Quiz.findById(params.id)
      .select('leaderboard')
      .populate('leaderboard.userId', 'name avatar');
    
    if (!quiz) {
      return NextResponse.json(
        { success: false, message: 'Quiz not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      leaderboard: quiz.leaderboard,
    });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
} 