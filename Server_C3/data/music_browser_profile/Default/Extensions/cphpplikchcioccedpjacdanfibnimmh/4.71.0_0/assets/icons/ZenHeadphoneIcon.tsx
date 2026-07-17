import React from 'react';

interface ZenHeadphoneIconProps {
  height?: number;
  spread?: boolean;
  width?: number;
}

function ZenHeadphoneIcon({ height = 17, spread = false, width = 24 }: ZenHeadphoneIconProps) {
  return (
    <svg
      fill="none"
      height={height}
      overflow="visible"
      viewBox="0 0 24 17"
      width={width}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Right ear piece */}
      <path
        d="M22.5 9H20.5C20.2239 9 20 9.22386 20 9.5V15.5C20 15.7761 20.2239 16 20.5 16H21.5C22.3284 16 23 15.3284 23 14.5V9.5C23 9.22386 22.7761 9 22.5 9Z"
        fill="white"
        stroke="#1A2A3D"
        strokeWidth="1.2"
        style={{
          transform: spread ? 'translateX(2px)' : 'none',
          transformOrigin: 'center',
        }}
      />
      {/* Left ear piece */}
      <path
        d="M1.5 9H3.5C3.77614 9 4 9.22386 4 9.5V15.5C4 15.7761 3.77614 16 3.5 16H2.5C1.67157 16 1 15.3284 1 14.5V9.5C1 9.22386 1.22386 9 1.5 9Z"
        fill="white"
        stroke="#1A2A3D"
        strokeWidth="1.2"
        style={{
          transform: spread ? 'translateX(-2px)' : 'none',
          transformOrigin: 'center',
        }}
      />
      {/* Headband */}
      <path
        d={
          spread
            ? 'M0 9C0 9 3 0.5 12 0.5C21 0.5 24 9 24 9'
            : 'M1.5 9C1.5 9 4 0.5 12 0.5C20 0.5 22.5 9 22.5 9'
        }
        stroke="#1A2A3D"
        strokeLinecap="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export default ZenHeadphoneIcon;
