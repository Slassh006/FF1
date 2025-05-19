import { NextResponse } from 'next/server';
import Quiz from '@/app/models/Quiz';
import { connectDB } from '@/app/lib/db';

// GET /api/quiz - Get active quizzes
export async function GET() {
  try {
    await connectDB();
    
    const now = new Date();
    const quizzes = await Quiz.find({
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
    .select('title description startDate endDate rewards currentParticipants maxParticipants')
    .sort({ startDate: -1 });
    
    // Add computed fields
    const quizzesWithStatus = quizzes.map(quiz => ({
      ...quiz.toObject(),
      isFull: quiz.currentParticipants >= quiz.maxParticipants,
      timeLeft: Math.max(0, Math.floor((new Date(quiz.endDate).getTime() - now.getTime()) / 1000)),
    }));
    
    return NextResponse.json({ 
      success: true, 
      quizzes: quizzesWithStatus,
      total: quizzesWithStatus.length,
    });
  } catch (error: any) {
    console.error('Quiz fetch error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch quizzes',
        error: error.message 
      },
      { status: 500 }
    );
  }
} 