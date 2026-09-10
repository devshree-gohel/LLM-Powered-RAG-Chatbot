import React from 'react';

interface VeraLogoProps {
  size?: number;
  className?: string;
}

export const VeraLogo: React.FC<VeraLogoProps> = ({ size = 32, className = '' }) => {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {/* Subtle purple aura glow */}
      <div 
        className="absolute inset-0 bg-violet-400/30 rounded-full blur-[6px] pointer-events-none"
        style={{ width: size, height: size }}
      />
      
      {/* Exact Vera 8-Petal Emblem */}
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="relative drop-shadow-[0_0_8px_rgba(192,132,252,0.75)]"
      >
        <defs>
          <linearGradient id="veraPetalGradient" x1="16" y1="2" x2="16" y2="15" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E9D5FF" />
            <stop offset="45%" stopColor="#C084FC" />
            <stop offset="100%" stopColor="#818CF8" />
          </linearGradient>
        </defs>

        <g>
          {/* 8 symmetrically rotated petals around (16, 16) */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <path
              key={angle}
              d="M16 2.8C17.4 2.8 18.6 5.8 18.1 9.2C17.7 11.5 16.5 13.5 16 14.3C15.5 13.5 14.3 11.5 13.9 9.2C13.4 5.8 14.6 2.8 16 2.8Z"
              fill="url(#veraPetalGradient)"
              transform={`rotate(${angle} 16 16)`}
            />
          ))}
        </g>
        
        {/* Crisp dark center eye */}
        <circle cx="16" cy="16" r="2.2" fill="#080914" />
      </svg>
    </div>
  );
};
