import { NextRequest, NextResponse } from 'next/server';
import Quiz from '@/app/models/Quiz';
import { connectDB } from '@/app/lib/db';

interface Params {
  params: {
    id: string;
  };
}

// Get a specific quiz by ID
export async function GET(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    
    const { id } = params;
    
    // Find quiz by ID
    const quiz = await Quiz.findById(id);
    
    if (!quiz) {
      return NextResponse.json(
        { success: false, message: 'Quiz not found' },
        { status: 404 }
      );
    }
    
    // Check if quiz is active
    const now = new Date();
    if (quiz.status !== 'active' || now < quiz.startDate || now > quiz.endDate) {
      return NextResponse.json(
        { success: false, message: 'Quiz is not active' },
        { status: 400 }
      );
    }
    
    // Check if quiz is full
    if (quiz.currentParticipants >= quiz.maxParticipants) {
      return NextResponse.json(
        { success: false, message: 'Quiz is full' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      quiz,
    });
  } catch (error: any) {
    console.error('Fetch Quiz Error:', error.message);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
} 