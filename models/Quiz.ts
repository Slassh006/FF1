import mongoose, { Document, Schema } from 'mongoose';

export interface IQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface IQuiz extends Document {
  title: string;
  description: string;
  questions: IQuizQuestion[];
  category: mongoose.Types.ObjectId;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number; // in minutes
  points: number;
  attempts: number;
  passPercentage: number;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const quizQuestionSchema = new Schema<IQuizQuestion>({
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
  explanation: {
    type: String,
  },
});

const quizSchema = new Schema<IQuiz>({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  questions: [quizQuestionSchema],
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true,
  },
  timeLimit: {
    type: Number,
    required: true,
    min: 1,
  },
  points: {
    type: Number,
    required: true,
    min: 1,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  passPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Add indexes
quizSchema.index({ title: 'text', description: 'text' });
quizSchema.index({ category: 1 });
quizSchema.index({ difficulty: 1 });
quizSchema.index({ isActive: 1 });
quizSchema.index({ createdBy: 1 });

// Define the model
const Quiz = mongoose.models?.Quiz || mongoose.model<IQuiz>('Quiz', quizSchema);

export default Quiz; 