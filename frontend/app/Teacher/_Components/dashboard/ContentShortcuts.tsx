"use client";

import React from "react";
import { useRouter } from "next/navigation";

export const ContentShortcuts: React.FC = () => {
  const router = useRouter();

  const handleCreateContent = () => {
    router.push('/Teacher/Create');
  };

  const handleMyLibrary = () => {
    router.push('/Teacher/Library');
  };

  const handleSharedWithMe = () => {
    router.push('/Teacher/Shared'); // You can create this page later
  };

  return (
    <div className="w-full">
      {/* Content Heading */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Content</h2>
      </div>
      
      {/* Content Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
        {/* Create New Content */}
              <button
        className="w-full bg-[#E6E6FA] rounded-xl px-4 sm:px-6 py-6 sm:py-8 flex flex-col items-center justify-center shadow-md hover:scale-[1.02] transition-transform relative overflow-hidden"
        onClick={handleCreateContent}
      >
          <div className="flex items-center gap-2 mb-2 -ml-4 sm:-ml-8 lg:-ml-12">
            <div className="flex flex-col items-start">
              <span className="text-lg sm:text-xl font-bold text-gray-800 font-inter">Create New</span>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-bold text-gray-800 font-inter">Content</span>
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-black flex items-center justify-center">
                  <svg width="8" height="8" className="sm:w-[10px] sm:h-[10px]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18L15 12L9 6" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          {/* Plus in rounded square - positioned with padding */}
          <span className="absolute bottom-4 sm:bottom-6 -right-2 inline-flex items-center justify-center rounded-lg bg-[#D8D4FF] shadow w-12 h-12 sm:w-14 sm:h-14">
            <svg width="32" height="32" className="sm:w-[40px] sm:h-[40px]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2v20M2 12h20" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </span>
        </button>
        
        {/* My Library */}
              <button
        className="w-full bg-[#FFE57F] rounded-xl px-4 sm:px-6 py-6 sm:py-8 flex flex-col items-center justify-center shadow-md hover:scale-[1.02] transition-transform relative overflow-hidden"
        onClick={handleMyLibrary}
      >
          <div className="flex items-center gap-2 mb-2 -ml-4 sm:-ml-8 lg:-ml-12">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-bold text-gray-800 font-inter">My Library</span>
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-black flex items-center justify-center">
                <svg width="8" height="8" className="sm:w-[10px] sm:h-[10px]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 18L15 12L9 6" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
          {/* Library/bookshelf icon - positioned with padding */}
          <span className="absolute bottom-4 sm:bottom-6 -right-2 inline-flex items-center justify-center rounded-lg bg-[#FFC107] shadow w-12 h-12 sm:w-14 sm:h-14">
            <svg width="28" height="28" className="sm:w-[36px] sm:h-[36px]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="6" y1="22" x2="6" y2="2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <line x1="10" y1="22" x2="10" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <line x1="14" y1="22" x2="14" y2="4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <line x1="22" y1="22" x2="18" y2="4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </span>
        </button>
        
        {/* Shared With Me */}
        <button
          className="w-full bg-[#B0C4DE] rounded-xl px-4 sm:px-6 py-6 sm:py-8 flex flex-col items-center justify-center shadow-md hover:scale-[1.02] transition-transform relative overflow-hidden"
          onClick={handleSharedWithMe}
        >
          <div className="flex items-center gap-2 mb-2 -ml-4 sm:-ml-8 lg:-ml-12">
            <div className="flex flex-col items-start">
              <span className="text-lg sm:text-xl font-bold text-gray-800 font-inter">Shared</span>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-bold text-gray-800 font-inter">With Me</span>
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-black flex items-center justify-center">
                  <svg width="8" height="8" className="sm:w-[10px] sm:h-[10px]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18L15 12L9 6" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          {/* Upload/share icon - positioned with padding */}
          <span className="absolute bottom-4 sm:bottom-6 -right-2 inline-flex items-center justify-center rounded-lg bg-[#8FA8C8] shadow w-12 h-12 sm:w-14 sm:h-14">
            <svg width="28" height="28" className="sm:w-[36px] sm:h-[36px]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5v14M5 12l7-7 7 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
}; 