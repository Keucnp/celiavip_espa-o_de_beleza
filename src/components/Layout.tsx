import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wallet, 
  Calendar as CalendarIcon, 
  CheckSquare, 
  Users, 
  Settings,
  Sun,
  Moon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const navItems = [
    { to: '/', icon: CalendarIcon, label: 'Início' },
    { to: '/finance', icon: Wallet, label: 'Finanças' },
    { to: '/tasks', icon: CheckSquare, label: 'Tarefas' },
    { to: '/clients', icon: Users, label: 'Clientes' },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Resumo' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 pb-20 md:pb-0 md:pl-20">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-20 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50">
        <div className="p-4 flex flex-col items-center gap-8 h-full">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
            O
          </div>
          
          <nav className="flex flex-col gap-4 flex-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => cn(
                  "p-3 rounded-xl transition-all duration-200 group relative",
                  isActive 
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" 
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                <item.icon size={24} />
                <span className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  {item.label}
                </span>
              </NavLink>
            ))}
          </nav>

          <button
            onClick={toggleTheme}
            className="p-3 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex justify-around items-center z-50">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex flex-col items-center gap-1 p-2 transition-all duration-200",
              isActive 
                ? "text-indigo-600 dark:text-indigo-400" 
                : "text-slate-400"
            )}
          >
            <item.icon size={20} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center gap-1 p-2 text-slate-400"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          <span className="text-[10px] font-medium">Tema</span>
        </button>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={window.location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
