import React from 'react';

interface PremiumIconProps {
  color?: string;
  style?: React.CSSProperties;
}

function PremiumIcon({ color, style = {} }: PremiumIconProps) {
  return (
    <svg
      fill="none"
      height="16"
      style={{ display: 'inline-flex', ...style }}
      viewBox="0 0 16 16"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.3467 13.2953L13.4867 4.24149M7.3467 13.2953L0.883545 4.24149M7.3467 13.2953L5.19231 4.24149M7.3467 13.2953L9.50108 4.24149M13.4867 4.24149L11.44 1M13.4867 4.24149H0.883545M11.44 1L9.50108 4.24149M11.44 1H7.3467M3.03793 1L0.883545 4.24149M3.03793 1L5.19231 4.24149M3.03793 1H7.3467M5.19231 4.24149L7.3467 1M9.50108 4.24149L7.3467 1"
        stroke={`${color ?? 'white'}`}
        strokeLinejoin="round"
        strokeWidth="0.69161"
      />
    </svg>
  );
}

export default PremiumIcon;
