
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="text-center py-6 mt-auto print:hidden">
      <p className="text-slate-500 text-sm">
        Powered by <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-400 hover:text-cyan-400 transition-colors">Google Gemini</a>
      </p>
    </footer>
  );
};

export default Footer;