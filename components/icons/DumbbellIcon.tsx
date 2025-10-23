
import React from 'react';

export const DumbbellIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 120 70"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* Barbell bar */}
    <rect x="28" y="32" width="17" height="6" fill="#e4e4e7" />
    <rect x="75" y="32" width="17" height="6" fill="#e4e4e7" />
    
    {/* Weights */}
    <g fill="#FFFFFF" stroke="#374151" strokeWidth="1.5">
        {/* Left */}
        <ellipse cx="20" cy="35" rx="8" ry="14" />
        <ellipse cx="10" cy="35" rx="6" ry="11" />
        {/* Right */}
        <ellipse cx="100" cy="35" rx="8" ry="14" />
        <ellipse cx="110" cy="35" rx="6" ry="11" />
    </g>
    
    {/* Center holes */}
    <ellipse cx="20" cy="35" rx="1.5" ry="3" fill="#374151" />
    <ellipse cx="100" cy="35"rx="1.5" ry="3" fill="#374151" />
    
    {/* Reflection */}
    <path d="M17 26 a 20 20 0 0 1 0 18" stroke="white" strokeOpacity="0.4" strokeWidth="2" fill="none" />
    <path d="M103 26 a 20 20 0 0 0 0 18" stroke="white" strokeOpacity="0.4" strokeWidth="2" fill="none" />

    {/* Central CPU and Traces - drawn on top */}
    <g>
      {/* Circuit traces */}
      <g stroke="#22d3ee" strokeWidth="1.2" fill="none" strokeLinecap="round">
        <path d="M45 26 h -5 M45 31 h -8 M45 35 h -5 M45 39 h -8 M45 44 h -5" />
        <path d="M75 26 h 5 M75 31 h 8 M75 35 h 5 M75 39 h 8 M75 44 h 5" />
        <path d="M52.5 20 v-5 l-4-4 M52.5 15 l4-4" />
        <path d="M60 20 v-8 M60 12 l-3-3 M60 12 l3-3" />
        <path d="M67.5 20 v-5 l4-4 M67.5 15 l-4-4" />
        <path d="M52.5 50 v 5 l-4 4 M52.5 55 l4 4" />
        <path d="M60 50 v 8 M60 58 l-3 3 M60 58 l3 3" />
        <path d="M67.5 50 v 5 l4 4 M67.5 55 l-4 4" />
      </g>
      {/* CPU Body */}
      <rect x="45" y="20" width="30" height="30" rx="3" fill="#083344" stroke="#22d3ee" strokeWidth="1.5" />
      <text x="60" y="42" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" textAnchor="middle" fill="#22d3ee">AI</text>
    </g>
  </svg>
);
