import React from 'react';

export const ProgressBar: React.FC = () => {
  return (
    <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden mt-4 border border-cyan-500/20 shadow-inner">
      <div 
        className="h-full bg-cyan-400 rounded-full progress-bar-indicator"
        style={{
          boxShadow: '0 0 8px rgba(6, 182, 212, 0.8)'
        }}
      ></div>
    </div>
  );
};
