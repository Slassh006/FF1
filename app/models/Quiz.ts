import mongoose, { Schema, Document } from 'mongoose';

export interface IQuiz extends Document {
  title: string;
  description: string;
  questions: {
    question: string;
    options: string[];
    correctAnswer: number;
    points: number;
    image?: string;
  }[];
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'active' | 'completed';
  maxParticipants: number;
  currentParticipants: number;
  rewards: {
    firstPlace: number;
    secondPlace: number;
    thirdPlace: number;
    participation: number;
  };
  leaderboard: {
    userId: Schema.Types.ObjectId;
    score: number;
    rank: number;
    completedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const QuizSchema = new Schema<IQuiz>(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
    },
    questions: [{
      question: {
        type: String,
        required: true,
      },
      options: [{
        type: String,
        required: true,
      }],
      correctAnswer: {
        type: Number,
        required: true,
        min: 0,
      },
      points: {
        type: Number,
        required: true,
        default: 1,
      },
      image: String,
    }],
    startDate: {
      type: Date,
      required: [true, 'Please provide a start date'],
    },
    endDate: {
      type: Date,
      required: [true, 'Please provide an end date'],
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'completed'],
      default: 'draft',
    },
    maxParticipants: {
      type: Number,
      required: [true, 'Please provide maximum participants'],
      min: [1, 'Maximum participants must be at least 1'],
    },
    currentParticipants: {
      type: Number,
      default: 0,
    },
    rewards: {
      firstPlace: {
        type: Number,
        required: true,
        min: 0,
      },
      secondPlace: {
        type: Number,
        required: true,
        min: 0,
      },
      thirdPlace: {
        type: Number,
        required: true,
        min: 0,
      },
      participation: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    leaderboard: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      score: {
        type: Number,
        required: true,
        min: 0,
      },
      rank: {
        type: Number,
        required: true,
        min: 1,
      },
      completedAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
QuizSchema.index({ status: 1, startDate: 1, endDate: 1 });
QuizSchema.index({ 'leaderboard.userId': 1 });

// Method to update leaderboard
QuizSchema.methods.updateLeaderboard = async function(userId: string, score: number) {
  const leaderboardEntry = {
    userId,
    score,
    rank: 0,
    completedAt: new Date(),
  };

  // Add or update entry
  const existingIndex = this.leaderboard.findIndex(
    (entry: { userId: Schema.Types.ObjectId }) => entry.userId.toString() === userId
  );

  if (existingIndex !== -1) {
    this.leaderboard[existingIndex] = leaderboardEntry;
  } else {
    this.leaderboard.push(leaderboardEntry);
  }

  // Sort and update ranks
  this.leaderboard.sort((a: { score: number }, b: { score: number }) => b.score - a.score);
  this.leaderboard.forEach((entry: { rank: number }, index: number) => {
    entry.rank = index + 1;
  });

  await this.save();
};

// Method to check if quiz is active
QuizSchema.methods.isActive = function() {
  const now = new Date();
  return (
    this.status === 'active' &&
    now >= this.startDate &&
    now <= this.endDate &&
    this.currentParticipants < this.maxParticipants
  );
};

export default mongoose.models.Quiz || mongoose.model<IQuiz>('Quiz', QuizSchema); 