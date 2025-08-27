import React from "react";

interface StatsCardsProps {
  stats: {
    myContent: number;
    sharedContent: number;
    myFolders: number;
  };
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <div className="flex gap-8 w-full justify-center">
      {/* My Content (Book with Checkmark Icon) */}
      <div className="flex items-center bg-white rounded-xl shadow-md px-6 py-4 min-w-[180px] max-w-[220px]">
        <span className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 shadow-lg mr-4">
          {/* Book with Checkmark Icon */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 19.5C4 18.1193 5.11929 17 6.5 17H20" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6.5 2H20V22H6.5C5.11929 22 4 20.8807 4 19.5V2.5C4 1.11929 5.11929 0 6.5 0Z" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 11L11 13L15 9" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        <div className="flex-1 flex flex-col">
          <span className="text-sm font-semibold text-gray-700">My Content</span>
        </div>
        <span className="text-2xl font-bold text-gray-900 ml-4">{stats.myContent}</span>
      </div>
      
      {/* Shared Content (Two Users Icon) */}
      <div className="flex items-center bg-white rounded-xl shadow-md px-6 py-4 min-w-[180px] max-w-[220px]">
        <span className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 shadow-lg mr-4">
          {/* Two People Icon */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45768C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        <div className="flex-1 flex flex-col">
          <span className="text-sm font-semibold text-gray-700">Shared Content</span>
        </div>
        <span className="text-2xl font-bold text-gray-900 ml-4">{stats.sharedContent}</span>
      </div>
      
      {/* My Folders (Two Folders Icon) */}
      <div className="flex items-center bg-white rounded-xl shadow-md px-6 py-4 min-w-[180px] max-w-[220px]">
        <span className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 shadow-lg mr-4">
          {/* Single Folder Icon */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 7C3 5.89543 3.89543 5 5 5H9L11 7H19C20.1046 7 21 7.89543 21 9V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7Z" stroke="#374151" strokeWidth="2"/>
          </svg>
        </span>
        <div className="flex-1 flex flex-col">
          <span className="text-sm font-semibold text-gray-700">My Folders</span>
        </div>
        <span className="text-2xl font-bold text-gray-900 ml-4">{stats.myFolders}</span>
      </div>
    </div>
  );
}; 