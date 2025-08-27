"use client";

import React from 'react';

const SharedPage = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Shared With Me</h1>
        <p className="text-gray-600 mt-2">Content that others have shared with you</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5v14M5 12l7-7 7 7" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No shared content yet</h3>
          <p className="text-gray-600">When others share content with you, it will appear here.</p>
        </div>
      </div>
    </div>
  );
};

export default SharedPage; 