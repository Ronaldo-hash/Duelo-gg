
import React from 'react';
import { FoundationFile } from '../types';

interface FileCardProps {
  file: FoundationFile;
  isActive: boolean;
  onClick: () => void;
}

export const FileCard: React.FC<FileCardProps> = ({ file, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
        isActive 
          ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
          : 'bg-slate-900 border-slate-800 hover:border-slate-600'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-500' : 'bg-slate-800'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-slate-100">{file.name}</h3>
          <p className="text-xs text-slate-400 mt-1">{file.path}</p>
        </div>
      </div>
    </button>
  );
};
