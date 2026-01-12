import React from 'react';

export const ThinkingBubble: React.FC = () => {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-skyrim-gold flex items-center justify-center text-skyrim-dark font-bold text-sm">
        GM
      </div>
      <div className="flex-1 max-w-4xl">
        <div className="inline-block bg-skyrim-paper/80 backdrop-blur-sm border border-skyrim-border rounded-lg px-4 py-3 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-skyrim-text text-sm italic">Consulting the Elder Scrolls</span>
            <div className="flex gap-1">
              <span className="animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1s' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1s' }}>.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
