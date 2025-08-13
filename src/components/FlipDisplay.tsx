import React from 'react';
import FlipNumber from './FlipNumber';

interface FlipDisplayProps {
  value: string | number;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  className?: string;
  label?: string;
  labelSize?: 'small' | 'medium' | 'large';
}

const FlipDisplay: React.FC<FlipDisplayProps> = ({ 
  value, 
  size = 'medium', 
  className = '', 
  label,
  labelSize = 'medium'
}) => {
  const stringValue = String(value).padStart(2, '0');
  const digits = stringValue.split('');

  const getLabelSizeClasses = () => {
    switch (labelSize) {
      case 'small':
        return 'text-xs sm:text-sm';
      case 'medium':
        return 'text-sm sm:text-base md:text-lg';
      case 'large':
        return 'text-lg sm:text-xl md:text-2xl';
      default:
        return 'text-sm sm:text-base md:text-lg';
    }
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {label && (
        <div className={`${getLabelSizeClasses()} font-bold text-yellow-300 uppercase tracking-wider`}>
          {label}
        </div>
      )}
      <div className="flex gap-1">
        {digits.map((digit, index) => (
          <FlipNumber 
            key={`${index}-${digit}`} 
            value={digit} 
            size={size}
          />
        ))}
      </div>
    </div>
  );
};

export default FlipDisplay;