
import React, { useState } from 'react';

interface CodeViewerProps {
  content: string;
  fileName: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ content, fileName }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800">
        <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 012-2h4.586A1 1 0 0111 2.586L15.414 7c.28.28.414.66.414 1V14a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
          </svg>
          {fileName}
        </span>
        <button
          onClick={handleCopy}
          className="text-xs flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copiado!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copiar
            </>
          )}
        </button>
      </div>
      <div className="flex-1 overflow-auto p-6 scrollbar-thin scrollbar-thumb-slate-800">
        <pre className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          <code className="text-slate-300">{content}</code>
        </pre>
      </div>
    </div>
  );
};
