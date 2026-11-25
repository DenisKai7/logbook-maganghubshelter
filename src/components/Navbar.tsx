import React from 'react';
import { User } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  LogOut,
  UserCheck,
  ShieldCheck,
  GraduationCap,
  KeyRound,
  Sun,
  Moon,
  Building
} from 'lucide-react';

interface Props {
  user: User;
  onLogout: () => void;
  onOpenChangePin: () => void;
}

export const Navbar: React.FC<Props> = ({ user, onLogout, onOpenChangePin }) => {
  const { theme, toggleTheme } = useTheme();

  const getRoleBadge = () => {
    switch (user.role) {
      case 'Peserta':
        return {
          icon: <GraduationCap className="w-3.5 h-3.5 text-[#0b4e8c] dark:text-[#9cdcfe]" />,
          label: 'Peserta Magang',
          bg: 'bg-blue-50 text-[#0b4e8c] border-blue-200/70 dark:bg-[#1e2733] dark:text-[#9cdcfe] dark:border-[#264f78]',
        };
      case 'Mentor':
        return {
          icon: <UserCheck className="w-3.5 h-3.5 text-amber-600 dark:text-[#dcdcaa]" />,
          label: 'Mentor Pembimbing',
          bg: 'bg-amber-50 text-amber-900 border-amber-200/70 dark:bg-[#342c15] dark:text-[#dcdcaa] dark:border-[#5a4d22]',
        };
      case 'HR':
        return {
          icon: <ShieldCheck className="w-3.5 h-3.5 text-slate-700 dark:text-[#4ec9b0]" />,
          label: 'Admin HR',
          bg: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-[#252526] dark:text-[#cccccc] dark:border-[#383838]',
        };
    }
  };

  const roleMeta = getRoleBadge();

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#181818] backdrop-blur-md border-b border-slate-200 dark:border-[#2d2d2d] transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand with PT. Shelter Indonesia Gemilang distinction */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0b4e8c] dark:bg-[#0e639c] text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-sm ring-2 ring-blue-500/10">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-white text-base tracking-tight">
                MagangHub
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 dark:bg-[#1e2733] text-[#0b4e8c] dark:text-[#9cdcfe] border border-blue-200/60 dark:border-[#264f78]">
                Shelter
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-[#858585] hidden sm:block">
              PT. Shelter Indonesia Gemilang
            </p>
          </div>
        </div>

        {/* User Info & Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User profile brief */}
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-800 dark:text-[#d4d4d4] leading-tight">
              {user.nama}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-[#858585]">
              {user.divisi}
            </p>
          </div>

          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${roleMeta.bg}`}>
            {roleMeta.icon}
            <span className="hidden sm:inline">{roleMeta.label}</span>
          </div>

          {/* Theme Switcher Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 text-slate-500 dark:text-[#858585] hover:text-[#0b4e8c] dark:hover:text-[#9cdcfe] rounded-lg border border-slate-200 dark:border-[#2d2d2d] bg-slate-50 dark:bg-[#252526] hover:bg-slate-100 dark:hover:bg-[#2d2d2d] transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Beralih ke Mode Terang (Light Mode)' : 'Beralih ke Mode Gelap VS Code (Dark Mode)'}
            aria-label="Ganti Tema"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#dcdcaa]" />
            ) : (
              <Moon className="w-4 h-4 text-[#0b4e8c]" />
            )}
          </button>

          {/* Change PIN Button */}
          <button
            onClick={onOpenChangePin}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-[#2d2d2d] bg-slate-50 dark:bg-[#252526] hover:bg-slate-100 dark:hover:bg-[#2d2d2d] text-slate-600 dark:text-[#cccccc] transition-colors cursor-pointer"
            title="Ganti PIN Akun"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#0b4e8c] dark:text-[#9cdcfe]" />
            <span className="hidden md:inline font-medium">Ganti PIN</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-[#341b1d] rounded-lg transition-colors cursor-pointer"
            title="Keluar dari Akun"
            aria-label="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
