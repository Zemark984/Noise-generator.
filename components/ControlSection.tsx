
import React from 'react';

interface ControlSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const ControlSection: React.FC<ControlSectionProps> = ({ title, icon, children, className }) => {
  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-lg p-4 md:p-6 ${className}`}>
      <div className="flex items-center mb-4">
        <div className="text-blue-accent mr-3">{icon}</div>
        <h2 className="text-lg font-bold text-white tracking-wide">{title}</h2>
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
};

export default ControlSection;