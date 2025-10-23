
import React from 'react';

// This icon is a representation of the user-provided image of an AI bodybuilder.
export const BodybuilderIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
    {/* Circuit path on the back */}
    <path fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M38 30 V22 h-4 v-4 h-4 M30 18 H22 M38 30 H46 v8 h4 v4 h-8 v-4 h-4 z" />
    {/* Main body silhouette */}
    <path fill="currentColor" d="M43.1,13.1c-3.9-2.6-9-2-12.6,1.4C26.9,18,25,22.7,25.2,27.7c-5.1-0.1-9.9,3.1-11.4,7.9 c-1.5,4.9,0.7,10.2,5.6,11.7c-0.6,4.6-0.3,9.4,1.4,13.8C24.8,60.2,30,62,35.4,62c9.8,0,17.7-7.9,17.7-17.7 c0-3.3-0.9-6.4-2.6-9.1C56.9,33.5,54,26.4,48,21.5C46.8,18.1,45.4,15.3,43.1,13.1z M49.5,44.2c0,7.6-6.2,13.7-13.7,13.7 c-4.4,0-8.3-2.1-10.9-5.4c-2.2-2.8-3.1-6.2-2.5-9.6c0.1-0.5,0.2-1,0.4-1.4c0,0-0.1,0-0.1,0c-3.1-1-4.4-4.5-3.4-7.5 c1-3.1,4.5-4.4,7.5-3.4c0.5,0.2,1,0.4,1.4,0.7c3.1-6.6,10.4-10.4,17.9-9.3c0.6,0.1,1.2,0.2,1.8,0.4 C48.1,28.6,50.8,35.9,49.5,44.2z" />
  </svg>
);
