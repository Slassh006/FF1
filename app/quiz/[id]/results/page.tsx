'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { FaTrophy, FaMedal, FaAward, FaCoins } from 'react-icons/fa';

interface LeaderboardEntry {
  userId: {
    _id: string;
    name: string;
    avatar?: string;
  };
  score: number;
  rank: number;
  coinsEarned: number;
}

interface Quiz {
  _id: string;
  title: string;
  description: string;
  rewards: {
    firstPlace: number;
    secondPlace: number;
    thirdPlace: number;
    participation: number;
  };
  leaderboard: LeaderboardEntry[];
}

export default function QuizResults({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/quiz/leaderboard/${params.id}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch results');
        }

        setQuiz(data.quiz);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error || 'Results not found'}</p>
        <button
          onClick={() => router.push('/quiz')}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Back to Quizzes
        </button>
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <FaTrophy className="text-yellow-500 text-2xl" />;
      case 2:
        return <FaMedal className="text-gray-400 text-2xl" />;
      case 3:
        return <FaAward className="text-amber-600 text-2xl" />;
      default:
        return <span className="text-gray-500 font-semibold">{rank}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
      >
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Quiz Results
          </h1>
          <p className="text-gray-600 dark:text-gray-300">{quiz.title}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg text-center">
            <FaTrophy className="text-yellow-500 text-2xl mx-auto mb-2" />
            <p className="text-gray-800 dark:text-gray-200 font-semibold">1st Place</p>
            <p className="text-gray-600 dark:text-gray-300">{quiz.rewards.firstPlace} coins</p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center">
            <FaMedal className="text-gray-400 text-2xl mx-auto mb-2" />
            <p className="text-gray-800 dark:text-gray-200 font-semibold">2nd Place</p>
            <p className="text-gray-600 dark:text-gray-300">{quiz.rewards.secondPlace} coins</p>
          </div>
          <div className="bg-amber-100 dark:bg-amber-900 p-4 rounded-lg text-center">
            <FaAward className="text-amber-600 text-2xl mx-auto mb-2" />
            <p className="text-gray-800 dark:text-gray-200 font-semibold">3rd Place</p>
            <p className="text-gray-600 dark:text-gray-300">{quiz.rewards.thirdPlace} coins</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Leaderboard
          </h2>
          
          {quiz.leaderboard.map((entry, index) => (
            <motion.div
              key={entry.userId._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <div className="w-8 text-center">
                  {getRankIcon(entry.rank)}
                </div>
                <div className="flex items-center space-x-3">
                  {entry.userId.avatar ? (
                    <img
                      src={entry.userId.avatar}
                      alt={entry.userId.name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                      <span className="text-gray-600 dark:text-gray-300 font-semibold">
                        {entry.userId.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {entry.userId.name}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-gray-600 dark:text-gray-300">Score</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {entry.score}
                  </p>
                </div>
                <div className="flex items-center text-yellow-500">
                  <FaCoins className="mr-1" />
                  <span className="font-semibold">{entry.coinsEarned}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => router.push('/quiz')}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Quizzes
          </button>
        </div>
      </motion.div>
    </div>
  );
} 