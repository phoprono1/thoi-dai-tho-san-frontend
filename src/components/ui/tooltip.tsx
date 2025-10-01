import * as React from 'react';

interface TooltipProps {
  children: React.ReactNode;
}

interface TooltipTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

interface TooltipContentProps {
  children: React.ReactNode;
}

export const TooltipProvider: React.FC<TooltipProps> = ({ children }) => {
  return <>{children}</>;
};

export const Tooltip: React.FC<TooltipProps> = ({ children }) => {
  return <div className="relative inline-block">{children}</div>;
};

export const TooltipTrigger: React.FC<TooltipTriggerProps> = ({ children, asChild }) => {
  return (
    <div className="peer cursor-help">
      {children}
    </div>
  );
};

export const TooltipContent: React.FC<TooltipContentProps> = ({ children }) => {
  return (
    <div className="invisible peer-hover:visible absolute z-50 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm dark:bg-gray-700 whitespace-nowrap -top-10 left-1/2 -translate-x-1/2">
      {children}
      <div className="tooltip-arrow" />
    </div>
  );
};
