
import React from 'react';

interface SegmentedControlProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

const SegmentedControl = <T extends string,>({ label, options, value, onChange }: SegmentedControlProps<T>) => {
  return (
    <div>
      <label className="text-sm font-medium text-gray-400 mb-2 block">{label}</label>
      <div className="flex w-full bg-gray-800 rounded-md p-1">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`w-full text-center text-sm font-semibold py-2 rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-accent focus:ring-offset-2 focus:ring-offset-gray-900
              ${value === option.value ? 'bg-blue-accent text-white' : 'bg-transparent text-gray-300 hover:bg-gray-700'}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SegmentedControl;
