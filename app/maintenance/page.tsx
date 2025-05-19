import React from 'react';
import { FaTools } from 'react-icons/fa';

const MaintenancePage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <FaTools className="text-6xl text-yellow-500 animate-spin" />
        </div>
        
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
          Site Under Maintenance
        </h1>
        
        <div className="space-y-4">
          <p className="text-lg text-gray-300">
            We are currently performing scheduled maintenance to improve your experience.
          </p>
          <p className="text-sm text-gray-400">
            Please check back later. We apologize for any inconvenience.
          </p>
        </div>

        <div className="pt-6 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            Expected completion time: Soon
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage; 