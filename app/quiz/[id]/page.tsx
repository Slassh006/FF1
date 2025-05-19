'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { FaTrophy, FaClock, FaUsers } from 'react-icons/fa';
import { format } from 'date-fns';

interface Question {
  question: string;
  options: string[];
  points: number;
  image?: string;
}

interface Quiz {
  _id: string;
  title: string;
  description: string;
  questions: Question[];
  startDate: string;
  endDate: string;
  maxParticipants: number;
  currentParticipants: number;
  rewards: {
    firstPlace: number;
    secondPlace: number;
    thirdPlace: number;
    participation: number;
  };
}

export default function QuizPage({ params }: { params: { id: string } }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timerError, setTimerError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching quiz:', params.id);
        const response = await fetch(`/api/quiz/${params.id}`);
        const data = await response.json();

        if (!response.ok) {
          console.error('Failed to fetch quiz:', data);
          throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        if (!data.success) {
          console.error('Quiz fetch failed:', data);
          throw new Error(data.message || 'Failed to fetch quiz');
        }

        console.log('Quiz fetched successfully:', data.quiz.title);
        setQuiz(data.quiz);
        setTimeLeft(Math.floor((new Date(data.quiz.endDate).getTime() - new Date().getTime()) / 1000));
        
        // Initialize answers array with -1 (no answer selected)
        setAnswers(new Array(data.quiz.questions.length).fill(-1));
      } catch (err: any) {
        console.error('Quiz fetch error:', err);
        setError(err.message || 'Failed to fetch quiz');
        toast.error(err.message || 'Failed to fetch quiz');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [params.id]);

  useEffect(() => {
    if (!quiz || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(); // Auto-submit when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz, timeLeft]);

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    if (submitted) return;
    setAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[questionIndex] = answerIndex;
      return newAnswers;
    });
  };

  const handleSubmit = async () => {
    if (submitted || submitting) return;

    // Validate all questions are answered
    if (answers.includes(-1)) {
      toast.error('Please answer all questions before submitting');
      return;
    }

    try {
      setSubmitting(true);
      console.log('Submitting quiz answers:', { quizId: quiz?._id, answers });
      
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: quiz?._id,
          answers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Failed to submit quiz:', data);
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      if (!data.success) {
        console.error('Quiz submission failed:', data);
        throw new Error(data.message || 'Failed to submit quiz');
      }

      console.log('Quiz submitted successfully:', data);
      setSubmitted(true);
      toast.success('Quiz submitted successfully!');
      
      // Redirect to leaderboard after a short delay
      setTimeout(() => {
        router.push(`/quiz/${params.id}/leaderboard`);
      }, 2000);
    } catch (err: any) {
      console.error('Quiz submission error:', err);
      toast.error(err.message || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-[60vh]">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
            <p className="text-gray-300">{error}</p>
            <button
              onClick={() => router.push('/quiz')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-300 mb-4">Quiz Not Found</h2>
            <button
              onClick={() => router.push('/quiz')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if quiz has expired
  if (new Date(quiz.endDate) < new Date()) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-300 mb-4">Quiz Expired</h2>
            <p className="text-gray-400 mb-4">This quiz has ended. Check the leaderboard for results!</p>
            <button
              onClick={() => router.push(`/quiz/${params.id}/leaderboard`)}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Leaderboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">{quiz.title}</h1>
            <div className="text-right">
              <div className="text-sm text-gray-400">Time Remaining</div>
              <div className="text-xl font-bold text-blue-500">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {quiz.questions.map((question, questionIndex) => (
              <motion.div
                key={questionIndex}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: questionIndex * 0.1 }}
                className="bg-gray-700/30 rounded-lg p-6"
              >
                <h3 className="text-xl font-semibold mb-4">
                  {questionIndex + 1}. {question.question}
                </h3>
                <div className="space-y-3">
                  {question.options.map((option, optionIndex) => (
                    <button
                      key={optionIndex}
                      onClick={() => handleAnswerSelect(questionIndex, optionIndex)}
                      className={`w-full text-left p-4 rounded-lg transition-colors ${
                        answers[questionIndex] === optionIndex
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-600/30 hover:bg-gray-600/50 text-gray-300'
                      }`}
                      disabled={submitted}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitted || submitting || answers.includes(-1)}
              className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
                submitted || submitting || answers.includes(-1)
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {submitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  Submitting...
                </div>
              ) : submitted ? (
                'Submitted'
              ) : (
                'Submit Quiz'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 