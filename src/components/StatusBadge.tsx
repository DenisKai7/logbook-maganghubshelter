import React from 'react';
import { ItemStatus } from '../types';

interface Props {
  status: ItemStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const isSm = size === 'sm';
  const clean = String(status || '').trim();

  // Activities Status
  if (clean === 'Done' || clean === 'Disetujui') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-full transition-colors ${
          isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        } bg-emerald-100/80 text-emerald-800 border border-emerald-300 dark:bg-[#1b3424] dark:text-[#4ec9b0] dark:border-[#2e6040]`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-[#4ec9b0]" />
        Done
      </span>
    );
  }

  if (clean === 'On Progress' || clean === 'In Progress') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-full transition-colors ${
          isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        } bg-sky-100/80 text-sky-800 border border-sky-300 dark:bg-[#1e2733] dark:text-[#9cdcfe] dark:border-[#264f78]`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-sky-600 dark:bg-[#3794ff] animate-pulse" />
        {clean}
      </span>
    );
  }

  if (clean === 'Cancelled') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-full transition-colors ${
          isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        } bg-rose-100/80 text-rose-800 border border-rose-300 dark:bg-[#341b1d] dark:text-[#f48771] dark:border-[#5c2427]`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-[#f48771]" />
        Cancelled
      </span>
    );
  }

  if (clean === 'Rescheduled') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-full transition-colors ${
          isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        } bg-purple-100/80 text-purple-800 border border-purple-300 dark:bg-[#2e1d38] dark:text-[#c586c0] dark:border-[#4d2d5e]`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-[#c586c0]" />
        Rescheduled
      </span>
    );
  }

  // Target Status
  if (clean === 'Achieved') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-full transition-colors ${
          isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        } bg-teal-100/80 text-teal-800 border border-teal-300 dark:bg-[#16332d] dark:text-[#4ec9b0] dark:border-[#245248]`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-[#4ec9b0]" />
        Achieved
      </span>
    );
  }

  if (clean === 'Exceeded') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-full transition-colors ${
          isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        } bg-indigo-100/80 text-indigo-800 border border-indigo-300 dark:bg-[#1f2438] dark:text-[#9cdcfe] dark:border-[#2b3558]`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-[#569cd6]" />
        Exceeded
      </span>
    );
  }

  if (clean === 'Not Achieved') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-full transition-colors ${
          isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        } bg-amber-100/80 text-amber-900 border border-amber-300 dark:bg-[#342c15] dark:text-[#dcdcaa] dark:border-[#5a4d22]`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-[#cca700]" />
        Not Achieved
      </span>
    );
  }

  if (clean === 'Ditugaskan') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-full transition-colors ${
          isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        } bg-violet-100/80 text-violet-800 border border-violet-300 dark:bg-[#2e1d38] dark:text-[#c586c0] dark:border-[#4d2d5e]`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-violet-600 dark:bg-[#c586c0]" />
        Ditugaskan
      </span>
    );
  }

  if (clean === 'Revisi') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-full transition-colors ${
          isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        } bg-amber-100/80 text-amber-900 border border-amber-300 dark:bg-[#342c15] dark:text-[#dcdcaa] dark:border-[#5a4d22]`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-[#cca700]" />
        Perlu Revisi
      </span>
    );
  }

  if (clean === 'Ditolak') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-full transition-colors ${
          isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        } bg-rose-100/80 text-rose-800 border border-rose-300 dark:bg-[#341b1d] dark:text-[#f48771] dark:border-[#5c2427]`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-[#f48771]" />
        Ditolak
      </span>
    );
  }

  if (clean === 'N/A' || !clean || clean === '-') {
    return (
      <span
        className={`inline-flex items-center font-medium rounded-full transition-colors ${
          isSm ? 'px-2 py-0.5 text-xs' : 'px-2 py-0.5 text-xs'
        } text-slate-400 dark:text-[#666666]`}
      >
        -
      </span>
    );
  }

  // Default / Menunggu
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full transition-colors ${
        isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      } bg-slate-100 text-slate-700 border border-slate-300 dark:bg-[#252526] dark:text-[#cccccc] dark:border-[#383838]`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-[#858585]" />
      {clean === 'Menunggu' ? 'Menunggu' : clean}
    </span>
  );
};
