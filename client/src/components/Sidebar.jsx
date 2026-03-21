// client/src/components/Sidebar.jsx
// Shared sidebar navigation used by interviewee workspace pages.

import React from 'react';
import { useComingSoon } from '../context/ComingSoonContext';

const Sidebar = ({ items = [], isOpen, onNavigate }) => {
  const { openComingSoon } = useComingSoon();

  return (
    <aside
      className={`${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 w-20 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark flex flex-col items-center py-6 gap-8 z-40 fixed md:relative h-screen transition-transform duration-300 pt-20 md:pt-6`}
    >
      <nav className="flex flex-col gap-6 w-full px-2">
        {items.map((item, index) => (
          <button
            key={`${item.label}-${index}`}
            onClick={() => onNavigate?.(item.key)}
            className={`group flex flex-col items-center gap-1 p-2 rounded-lg relative transition-all duration-300 ${
              item.isActive
                ? 'bg-primary/10 text-primary'
                : 'text-gray-400 hover:text-primary hover:bg-background-light dark:hover:bg-background-dark'
            }`}
          >
            <span className="material-symbols-outlined text-2xl md:text-[28px]">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
            {item.isActive && <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r-full"></div>}
          </button>
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-6">
        <button
          className="text-gray-400 hover:text-primary transition-colors"
          onClick={() => openComingSoon({ title: 'Settings', message: 'Settings are coming soon.' })}
        >
          <span className="material-symbols-outlined text-2xl">settings</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
