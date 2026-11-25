import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<Props> = ({ isOpen, onClose, title, subtitle, children }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', onKey);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />
      <div className="relative w-full max-w-xl bg-white dark:bg-[#252526] rounded-2xl border border-slate-200 dark:border-[#383838] shadow-2xl z-10 overflow-visible my-8 animate-fade-in-up transition-colors duration-200">
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-[#2d2d2d]">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 dark:text-[#858585] mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:text-[#858585] dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#2d2d2d] transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 text-slate-800 dark:text-[#cccccc]">{children}</div>
      </div>
    </div>
  );
};
