import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import QuizCard from './QuizCard';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctOption: number;
  points: number;
  image?: string;
  explanation?: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  timeLimit: number;
  totalPoints: number;
  passingScore: number;
}

interface QuizContainerProps {
  quiz: Quiz;
  onComplete: (score: number, answers: number[], timeSpent: number) => void;
}

export default function QuizContainer({ quiz, onComplete }: QuizContainerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  const handleAnswer = (answer: number, timeSpent: number) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);
    setTotalTimeSpent((prev) => prev + timeSpent);

    // Calculate score for this question
    if (answer === currentQuestion.correctOption) {
      const newScore = score + currentQuestion.points;
      setScore(newScore);
      toast.success('Correct answer! 🎉');
    } else {
      toast.error('Incorrect answer');
    }

    // Show explanation if available
    if (currentQuestion.explanation) {
      toast(currentQuestion.explanation, {
        duration: 5000,
        icon: '📝',
      });
    }

    // Move to next question or complete quiz
    if (isLastQuestion) {
      handleQuizComplete(newAnswers);
    } else {
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => prev + 1);
      }, 1500);
    }
  };

  const handleQuizComplete = (finalAnswers: number[]) => {
    setIsCompleted(true);
    const passed = score >= quiz.passingScore;
    
    toast[passed ? 'success' : 'error'](
      passed
        ? `Congratulations! You passed with a score of ${score}/${quiz.totalPoints}`
        : `Quiz completed. Your score: ${score}/${quiz.totalPoints}. Required: ${quiz.passingScore}`
    );

    onComplete(score, finalAnswers, totalTimeSpent);
  };

  // Prevent leaving the page accidentally
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isCompleted) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isCompleted]);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
        <p className="text-gray-600">{quiz.description}</p>
      </div>

      <QuizCard
        question={currentQuestion}
        questionIndex={currentQuestionIndex}
        totalQuestions={quiz.questions.length}
        timeLimit={quiz.timeLimit}
        onAnswer={handleAnswer}
        isAnswered={answers.length > currentQuestionIndex}
      />

      <div className="mt-8">
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>Total Points: {quiz.totalPoints}</span>
          <span>Passing Score: {quiz.passingScore}</span>
          <span>Current Score: {score}</span>
        </div>
      </div>
    </div>
  );
} 