import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { FaTrophy, FaUsers, FaClock } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

interface Question {
  id: string;
  question: string;
  options: string[];
  points: number;
  image?: string;
}

interface QuizCardProps {
  quiz: {
    _id: string;
    title: string;
    description: string;
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
  };
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  timeLimit: number;
  onAnswer: (answer: number, timeSpent: number) => void;
  isAnswered: boolean;
}

const QuizCard: React.FC<QuizCardProps> = ({
  quiz,
  question,
  questionIndex,
  totalQuestions,
  timeLimit,
  onAnswer,
  isAnswered,
}) => {
  const startDate = new Date(quiz.startDate);
  const endDate = new Date(quiz.endDate);
  const now = new Date();
  const isActive = now >= startDate && now <= endDate;
  const spotsLeft = quiz.maxParticipants - quiz.currentParticipants;
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [startTime] = useState(Date.now());

  // Handle timer with useCallback
  useEffect(() => {
    if (isAnswered || !timeLimit) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!isAnswered) {
            handleSubmit(-1); // Auto-submit on timeout
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLimit, isAnswered]);

  const handleOptionSelect = useCallback((index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
  }, [isAnswered]);

  const handleSubmit = useCallback((forcedAnswer: number = -1) => {
    if (isAnswered) {
      toast.error('This question has already been answered');
      return;
    }

    const answer = forcedAnswer === -1 ? selectedOption : forcedAnswer;
    if (answer === null && forcedAnswer === -1) {
      toast.error('Please select an answer before submitting');
      return;
    }

    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      onAnswer(answer ?? -1, timeSpent);
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error('Failed to submit answer. Please try again.');
    }
  }, [isAnswered, selectedOption, startTime, onAnswer]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
    >
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {quiz.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {quiz.description}
        </p>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="flex items-center text-gray-600 dark:text-gray-300">
            <FaTrophy className="mr-2 text-yellow-500" />
            <span>{quiz.rewards.firstPlace} coins</span>
          </div>
          <div className="flex items-center text-gray-600 dark:text-gray-300">
            <FaUsers className="mr-2 text-blue-500" />
            <span>{spotsLeft} spots left</span>
          </div>
          <div className="flex items-center text-gray-600 dark:text-gray-300">
            <FaClock className="mr-2 text-green-500" />
            <span>
              {format(endDate, 'MMM d, h:mm a')}
            </span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className={`px-3 py-1 rounded-full text-sm ${
            isActive
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
          }`}>
            {isActive ? 'Active' : 'Ended'}
          </span>
          
          <Link
            href={`/quiz/${quiz._id}`}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              isActive && spotsLeft > 0
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isActive && spotsLeft > 0 ? 'Take Quiz' : 'Quiz Ended'}
          </Link>
        </div>

        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-500">
            Question {questionIndex + 1} of {totalQuestions}
          </span>
          {timeLimit > 0 && (
            <span className="text-sm font-medium text-indigo-600">
              Time left: {timeLeft}s
            </span>
          )}
        </div>

        <div className="space-y-4 mt-4">
          <h3 className="text-lg font-medium text-gray-900">{question.question}</h3>

          {question.image && (
            <div className="relative w-full h-48 md:h-64">
              <Image
                src={question.image}
                alt="Question image"
                fill
                className="object-contain rounded-lg"
              />
            </div>
          )}

          <div className="space-y-2">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionSelect(index)}
                disabled={isAnswered}
                className={`w-full p-4 text-left rounded-lg border transition-colors ${
                  selectedOption === index
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-200'
                } ${isAnswered ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-6 h-6 flex items-center justify-center rounded-full border ${
                      selectedOption === index
                        ? 'border-indigo-500 bg-indigo-500 text-white'
                        : 'border-gray-300'
                    }`}
                  >
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="text-gray-900">{option}</span>
                </div>
              </button>
            ))}
          </div>

          {!isAnswered && (
            <div className="mt-6">
              <button
                onClick={() => handleSubmit()}
                disabled={selectedOption === null}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Answer
              </button>
            </div>
          )}

          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                style={{
                  width: `${((questionIndex + 1) / totalQuestions) * 100}%`,
                }}
              />
            </div>
          </div>

          {question.points > 0 && (
            <div className="mt-2 text-sm text-gray-500 text-right">
              Points: {question.points}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default QuizCard; 