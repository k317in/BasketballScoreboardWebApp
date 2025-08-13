import React, { useEffect, useState } from 'react';

interface FlipNumberProps {
  value: number | string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  className?: string;
}

const FlipNumber: React.FC<FlipNumberProps> = ({ value, size = 'medium', className = '' }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (value !== displayValue) {
      setIsFlipping(true);
      const timer = setTimeout(() => {
        setDisplayValue(value);
        setIsFlipping(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [value, displayValue]);

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'text-2xl sm:text-3xl md:text-4xl h-12 sm:h-16 md:h-20 w-8 sm:w-12 md:w-16';
      case 'medium':
        return 'text-4xl sm:text-5xl md:text-6xl h-16 sm:h-20 md:h-24 w-12 sm:w-16 md:w-20';
      case 'large':
        return 'text-6xl sm:text-7xl md:text-8xl h-20 sm:h-24 md:h-32 w-16 sm:w-20 md:w-24';
      case 'xlarge':
        return 'text-8xl sm:text-9xl md:text-[10rem] h-24 sm:h-32 md:h-40 w-20 sm:w-24 md:w-32';
      default:
        return 'text-4xl sm:text-5xl md:text-6xl h-16 sm:h-20 md:h-24 w-12 sm:w-16 md:w-20';
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div 
        className={`
          ${getSizeClasses()}
          bg-gray-900 
          border-2 border-gray-700 
          rounded-lg 
          flex items-center justify-center 
          font-mono font-bold 
          text-yellow-300
          shadow-lg
          transition-transform duration-150
          ${isFlipping ? 'scale-y-0' : 'scale-y-100'}
        `}
        style={{
          transformOrigin: 'center',
          background: 'linear-gradient(180deg, #1f2937 0%, #111827 50%, #0f172a 100%)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.2)'
        }}
      >
        <span className="drop-shadow-sm">{displayValue}</span>
        
        {/* Split line effect */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-800 opacity-50" />
      </div>
    </div>
  );
};

export default FlipNumber;