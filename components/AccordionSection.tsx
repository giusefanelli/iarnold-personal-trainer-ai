import React from 'react';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface Props {
  title: string;
  subtitle: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const AccordionSection: React.FC<Props> = ({ title, subtitle, isOpen, onToggle, children, icon }) => {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden transition-all duration-300">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex justify-between items-center p-6 text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-4">
          {icon}
          <div>
            <h2 className="text-xl font-bold text-cyan-400 mb-1">{title}</h2>
            <p className="text-slate-400 text-sm">{subtitle}</p>
          </div>
        </div>
        <ChevronDownIcon
          className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-500 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="p-6 pt-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccordionSection;