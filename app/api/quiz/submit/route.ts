import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../api/auth/[...nextauth]/route';
import Quiz from '@/models/Quiz';
import User from '@/models/User';
import { connectDB } from '@/lib/db';

interface QuizQuestion {
  points: number;
  correctAnswer: number;
}

interface Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

interface QuizStats {
  totalParticipated: number;
  totalWon: number;
  highestScore: number;
  totalCoinsEarned: number;
  totalQuizzes: number;
  correctAnswers: number;
  lastQuizDate: Date;
  coinsEarned: number;
}

// POST /api/quiz/submit - Submit quiz answers
export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id, answers } = await request.json();
    
    // Validate request body
    if (!id || !Array.isArray(answers)) {
      return NextResponse.json(
        { success: false, message: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    // Get the quiz
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
    
    // Get user
    const userDoc = await User.findById(session.user.id);
    if (!userDoc) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if user has already submitted this quiz
    const existingEntry = quiz.leaderboard.find(
      (entry: any) => entry.userId.toString() === userDoc._id.toString()
    );
    
    if (existingEntry) {
      return NextResponse.json(
        { success: false, message: 'You have already submitted this quiz' },
        { status: 400 }
      );
    }
    
    // Validate answers array length
    if (answers.length !== quiz.questions.length) {
      return NextResponse.json(
        { success: false, message: 'Invalid number of answers' },
        { status: 400 }
      );
    }
    
    // Validate answer values
    if (answers.some((answer: number) => typeof answer !== 'number' || answer < 0 || answer >= 4)) {
      return NextResponse.json(
        { success: false, message: 'Invalid answer values' },
        { status: 400 }
      );
    }
    
    // Calculate score
    let totalScore = 0;
    let correctAnswers = 0;
    
    quiz.questions.forEach((question: QuizQuestion, index: number) => {
      if (answers[index] === question.correctAnswer) {
        totalScore += question.points;
        correctAnswers++;
      }
    });
    
    // Calculate coins earned
    let coinsEarned = quiz.rewards.participation;
    const totalPoints = quiz.questions.reduce((sum: number, q: QuizQuestion) => sum + q.points, 0);
    
    if (totalScore >= totalPoints * 0.8) {
      coinsEarned += quiz.rewards.firstPlace;
    } else if (totalScore >= totalPoints * 0.6) {
      coinsEarned += quiz.rewards.secondPlace;
    } else if (totalScore >= totalPoints * 0.4) {
      coinsEarned += quiz.rewards.thirdPlace;
    }
    
    // Update quiz participation
    quiz.currentParticipants += 1;
    
    // Update leaderboard
    await quiz.updateLeaderboard(userDoc._id.toString(), totalScore);
    
    // Update user's quiz stats
    const passingScore = totalPoints * 0.4; // 40% is passing score
    userDoc.quizStats = {
      totalParticipated: userDoc.quizStats.totalParticipated + 1,
      totalWon: userDoc.quizStats.totalWon + (totalScore >= passingScore ? 1 : 0),
      highestScore: Math.max(userDoc.quizStats.highestScore, totalScore),
      totalCoinsEarned: userDoc.quizStats.totalCoinsEarned + coinsEarned
    };
    
    userDoc.coins += coinsEarned;
    
    // Log activity
    await userDoc.logActivity('quiz_completion', {
      id,
      score: totalScore,
      correctAnswers,
      coinsEarned,
    });
    
    // Save changes
    await Promise.all([quiz.save(), userDoc.save()]);
    
    return NextResponse.json({
      success: true,
      score: totalScore,
      correctAnswers,
      coinsEarned,
      passed: totalScore >= passingScore
    });
  } catch (error: any) {
    console.error('Quiz submission error:', error.message);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to submit quiz', 
        error: error.message 
      },
      { status: 500 }
    );
  }
} 