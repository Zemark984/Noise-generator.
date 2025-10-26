
import React from 'react';

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  unit?: string;
}

const Slider: React.FC<SliderProps> = ({ label, value, onChange, min, max, step, unit }) => {
  // Use a unique ID to associate the label with the input for mouse users and accessibility.
  const id = `slider-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const formattedValue = value.toFixed(unit === 'dB' ? 1 : 0);
  const valueWithUnit = `${formattedValue}${unit ? ` ${unit}` : ''}`;

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex justify-between items-baseline">
        <label htmlFor={id} className="text-sm font-medium text-gray-400">{label}</label>
        <span className="text-sm font-mono text-blue-accent bg-gray-800 px-2 py-1 rounded">
          {formattedValue} {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg focus:outline-none focus:ring-2 focus:ring-blue-accent"
        style={{
            background: `linear-gradient(to right, #58a6ff 0%, #58a6ff ${((value - min) / (max - min)) * 100}%, #30363d ${((value - min) / (max - min)) * 100}%, #30363d 100%)`
        }}
        // Accessibility attributes to make the slider usable with screen readers and keyboards.
        aria-label={`${label}, current value: ${valueWithUnit}`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />
    </div>
  );
};

export default Slider;
