import React, { useState, ReactNode } from 'react';

interface TooltipProps {
  text: string;
  children: ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const [isShowing, setIsShowing] = useState(false);

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setIsShowing(true)}
      onMouseLeave={() => setIsShowing(false)}
      onFocus={() => setIsShowing(true)}
      onBlur={() => setIsShowing(false)}
      tabIndex={0}
      aria-label={text} // For screen readers
    >
      {children}
      {isShowing && (
        <div 
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs z-10 p-2.5 text-xs font-medium text-white bg-slate-800 dark:bg-slate-900 rounded-lg shadow-lg animate-fade-in"
        >
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-800 dark:border-t-slate-900" aria-hidden="true"></div>
        </div>
      )}
    </span>
  );
};

export default Tooltip;