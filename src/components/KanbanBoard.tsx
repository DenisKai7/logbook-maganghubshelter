import React from 'react';
import {
  KanbanItem,
  User,
  MenteeSummary,
  KANBAN_STATUS_OPTIONS,
  KANBAN_PRIORITY_OPTIONS,
  KANBAN_REVIEW_OPTIONS,
  getKanbanNo,
  getKanbanTask,
  getKanbanPeserta,
  getKanbanUser,
  getKanbanPriority,
  getKanbanStatus,
  getKanbanDueDate,
  getKanbanStartDate,
  getKanbanEndDate,
  getKanbanReview,
  getKanbanNotes,
  getKanbanEvidence,
  KanbanStatus,
  KanbanPriority,
  KanbanReview
} from '../types';
import { StatusBadge } from './StatusBadge';
import {
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  ChevronDown,
  MessageSquare,
  Printer,
} from 'lucide-react';

interface Props {
  items: KanbanItem[];
  users?: Array<User | MenteeSummary>;
  currentUser: User;
  editable?: boolean;
  onEdit?: (item: KanbanItem) => void;
  onDelete?: (item: KanbanItem) => void;
  deletingId?: string | null;
  onStatusChange?: (item: KanbanItem, newStatus: KanbanStatus) => void;
  // Mentor Review mode
  mentorMode?: boolean;
  onReview?: (item: KanbanItem) => void;
  onReviewWithNote?: (item: KanbanItem) => void;
  onAddNew?: () => void;
  sheetTabs?: string[];
  activeSheetTab?: string;
  onSelectSheetTab?: (tab: string) => void;
  emptyMessage?: string;
}

const PRIORITY_BADGE_STYLE: Record<KanbanPriority, string> = {
  Low: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-[#252526] dark:text-[#858585] dark:border-[#383838]',
  Medium: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-[#162738] dark:text-[#9cdcfe] dark:border-[#264f78]',
  High: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-[#342c15] dark:text-[#dcdcaa] dark:border-[#5a4d22]',
  Urgent: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-[#341b1d] dark:text-[#f48771] dark:border-[#5c2427]'
};

export const KanbanBoard: React.FC<Props> = ({
  items,
  users,
  currentUser,
  editable = false,
  onEdit,
  onDelete,
  deletingId,
  onStatusChange,
  mentorMode = false,
  onReview,
  onReviewWithNote,
  onAddNew,
  sheetTabs,
  activeSheetTab,
  onSelectSheetTab,
  emptyMessage = 'Belum ada task di lembar Kanban.'
}) => {
  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="bg-white dark:bg-[#252526] p-4 rounded-2xl border border-slate-200/90 dark:border-[#2d2d2d] shadow-xs flex items-center justify-between gap-3 transition-colors duration-200">
        <span className="text-xs text-slate-400 dark:text-[#858585] font-mono">
          {items.length} Task Terdaftar
        </span>
        {onAddNew && (
          <button
            type="button"
            onClick={onAddNew}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#0b4e8c] hover:bg-[#083b6b] dark:bg-[#0e639c] dark:hover:bg-[#1177bb] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Task Kanban</span>
          </button>
        )}
      </div>

      {/* ========================================================= */}
      {/* SPREADSHEET TABLE VIEW */}
      {/* ========================================================= */}
      <div className="w-full bg-white dark:bg-[#1e1e1e] rounded-2xl border border-slate-300 dark:border-[#2d2d2d] shadow-sm overflow-hidden transition-colors duration-200">
        {/* Header Banner */}
        <div className="bg-slate-50 dark:bg-[#252526] px-4 py-2 border-b border-slate-200 dark:border-[#2d2d2d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span className="font-semibold text-xs text-slate-800 dark:text-white">
              Kanban
            </span>
            <span className="text-[11px] text-slate-400 dark:text-[#858585]">
              (Project &amp; Weekly Kanban Sheet)
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 dark:text-[#858585]">
            {items.length} Baris Task
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#16325B] dark:bg-[#0f243d] text-white font-bold text-[11px] tracking-wide select-none">
                <th className="py-2.5 px-3 text-center border-r border-blue-900/50 w-12 font-bold">
                  No
                </th>
                <th className="py-2.5 px-4 border-r border-blue-900/50 min-w-[240px]">
                  <div className="flex items-center justify-between gap-1">
                    <span>Task</span>
                    <ChevronDown className="w-3 h-3 text-blue-200/70" />
                  </div>
                </th>
                <th className="py-2.5 px-3.5 border-r border-blue-900/50 min-w-[140px] whitespace-nowrap">
                  <div className="flex items-center justify-between gap-1">
                    <span>Peserta</span>
                    <ChevronDown className="w-3 h-3 text-blue-200/70" />
                  </div>
                </th>
                <th className="py-2.5 px-3.5 border-r border-blue-900/50 min-w-[120px] whitespace-nowrap">
                  <div className="flex items-center justify-between gap-1">
                    <span>User</span>
                    <ChevronDown className="w-3 h-3 text-blue-200/70" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-center border-r border-blue-900/50 min-w-[100px] whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1">
                    <span>Priority</span>
                    <ChevronDown className="w-3 h-3 text-blue-200/70" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-center border-r border-blue-900/50 min-w-[110px] whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1">
                    <span>Status</span>
                    <ChevronDown className="w-3 h-3 text-blue-200/70" />
                  </div>
                </th>
                <th className="py-2.5 px-3 border-r border-blue-900/50 min-w-[120px] whitespace-nowrap">
                  <div className="flex items-center justify-between gap-1">
                    <span>Due Date</span>
                    <ChevronDown className="w-3 h-3 text-blue-200/70" />
                  </div>
                </th>
                <th className="py-2.5 px-2.5 text-center border-r border-blue-900/50 w-20 whitespace-nowrap">
                  <span>Start</span>
                </th>
                <th className="py-2.5 px-2.5 text-center border-r border-blue-900/50 w-20 whitespace-nowrap">
                  <span>End</span>
                </th>
                <th className="py-2.5 px-3.5 border-r border-blue-900/50 min-w-[160px]">
                  <div className="flex items-center justify-between gap-1">
                    <span>Evidence</span>
                    <ChevronDown className="w-3 h-3 text-blue-200/70" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-center border-r border-blue-900/50 min-w-[120px] whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1">
                    <span>Review</span>
                    <ChevronDown className="w-3 h-3 text-blue-200/70" />
                  </div>
                </th>
                <th className="py-2.5 px-3.5 border-r border-blue-900/50 min-w-[160px]">
                  <div className="flex items-center justify-between gap-1">
                    <span>Notes</span>
                    <ChevronDown className="w-3 h-3 text-blue-200/70" />
                  </div>
                </th>
                {(editable || mentorMode) && (
                  <th className="py-2.5 px-3 text-center w-28 whitespace-nowrap">
                    Aksi
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200/80 dark:divide-[#2d2d2d] text-slate-800 dark:text-[#cccccc]">
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={editable || mentorMode ? 13 : 12}
                    className="py-12 text-center text-slate-400 dark:text-[#858585] bg-slate-50/50 dark:bg-[#252526]"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => {
                  const no = getKanbanNo(item, idx);
                  const task = getKanbanTask(item);
                  const pesertaStr = getKanbanPeserta(item, users);
                  const userStr = getKanbanUser(item);
                  const priority = getKanbanPriority(item);
                  const status = getKanbanStatus(item);
                  const dueDate = getKanbanDueDate(item);
                  const review = getKanbanReview(item);
                  const notes = getKanbanNotes(item);
                  const evidence = getKanbanEvidence(item);
                  const isLocked = review === 'Disetujui' || review === 'Ditolak';

                  return (
                    <tr
                      key={item.Plan_ID || `${no}-${idx}`}
                      className="hover:bg-blue-50/70 dark:hover:bg-[#2a2d2e] bg-[#edf7ed] even:bg-[#e4f3e2] dark:bg-[#1e1e1e] dark:even:bg-[#252526] transition-colors border-b border-[#cfe6ce] dark:border-[#2d2d2d]"
                    >
                      <td className="py-2.5 px-2 text-center font-mono font-semibold text-slate-700 dark:text-[#858585] border-r border-[#cfe6ce] dark:border-[#2d2d2d]">
                        {no}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white border-r border-[#cfe6ce] dark:border-[#2d2d2d]">
                        <div className="whitespace-pre-line max-w-sm">
                          {task}
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap font-medium text-slate-800 dark:text-[#cccccc] border-r border-[#cfe6ce] dark:border-[#2d2d2d]">
                        {pesertaStr}
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-700 dark:text-[#cccccc] border-r border-[#cfe6ce] dark:border-[#2d2d2d]">
                        {userStr}
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-[#cfe6ce] dark:border-[#2d2d2d] whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${PRIORITY_BADGE_STYLE[priority]}`}
                        >
                          {priority}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-[#cfe6ce] dark:border-[#2d2d2d] whitespace-nowrap">
                        {onStatusChange ? (
                          <select
                            value={status}
                            onChange={(e) => onStatusChange(item, e.target.value as KanbanStatus)}
                            className="text-[11px] font-semibold rounded px-1.5 py-0.5 border border-slate-200 dark:border-[#383838] bg-white/70 dark:bg-[#1e1e1e] text-slate-700 dark:text-[#cccccc] focus:outline-none cursor-pointer"
                          >
                            {KANBAN_STATUS_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-800 dark:text-white">
                            {status}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700 dark:text-[#cccccc] border-r border-[#cfe6ce] dark:border-[#2d2d2d] whitespace-nowrap">
                        {dueDate}
                      </td>
                      <td className="py-2.5 px-2.5 text-center font-mono text-slate-700 dark:text-[#cccccc] border-r border-[#cfe6ce] dark:border-[#2d2d2d]">
                        {getKanbanStartDate(item) === '-' ? '-' : getKanbanStartDate(item)}
                      </td>
                      <td className="py-2.5 px-2.5 text-center font-mono text-slate-700 dark:text-[#cccccc] border-r border-[#cfe6ce] dark:border-[#2d2d2d]">
                        {getKanbanEndDate(item) === '-' ? '-' : getKanbanEndDate(item)}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-600 dark:text-[#858585] border-r border-[#cfe6ce] dark:border-[#2d2d2d]">
                        {evidence ? (
                          <a
                            href={evidence.startsWith('http') ? evidence : `https://${evidence}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[#0b4e8c] dark:text-[#9cdcfe] hover:underline font-mono text-[11px] truncate max-w-[150px]"
                          >
                            <span className="truncate">{evidence}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-slate-400 dark:text-[#666666]">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-[#cfe6ce] dark:border-[#2d2d2d] whitespace-nowrap">
                        {mentorMode ? (
                          <button
                            onClick={() => onReviewWithNote && onReviewWithNote(item)}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold rounded px-2 py-0.5 border border-slate-200 dark:border-[#383838] bg-white/70 dark:bg-[#1e1e1e] text-slate-700 dark:text-[#cccccc] hover:bg-slate-50 dark:hover:bg-[#252526] focus:outline-none cursor-pointer"
                            title="Klik untuk update status review & catatan"
                          >
                            <StatusBadge status={review} size="sm" />
                            <MessageSquare className="w-3 h-3 text-slate-400 dark:text-[#858585]" />
                          </button>
                        ) : (
                          <StatusBadge status={review} size="sm" />
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-600 dark:text-[#858585] border-r border-[#cfe6ce] dark:border-[#2d2d2d]">
                        <div className="whitespace-pre-line max-w-[200px] text-[11px]">
                          {notes || <span className="text-slate-400 dark:text-[#666666]">-</span>}
                        </div>
                      </td>
                      {(editable || mentorMode) && (
                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            {editable && !isLocked && onEdit && (
                              <button
                                type="button"
                                onClick={() => onEdit(item)}
                                className="p-1.5 text-slate-500 hover:text-[#0b4e8c] dark:hover:text-white rounded-lg hover:bg-white dark:hover:bg-[#383838] transition-colors cursor-pointer border border-slate-300 dark:border-[#383838]"
                                title="Edit Task"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {editable && !isLocked && onDelete && (
                              <button
                                type="button"
                                onClick={() => onDelete(item)}
                                disabled={deletingId === (item.Plan_ID || String(no))}
                                className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-[#341b1d] transition-colors cursor-pointer disabled:opacity-50 border border-slate-300 dark:border-[#383838]"
                                title="Hapus Task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {mentorMode && onReview && (
                              <button
                                type="button"
                                onClick={() => onReview(item)}
                                className="p-1.5 text-slate-600 dark:text-[#cccccc] hover:text-[#0b4e8c] dark:hover:text-white rounded hover:bg-white dark:hover:bg-[#252526] border border-slate-300 dark:border-[#383838] transition-colors cursor-pointer"
                                title="Lihat / Print Laporan"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Sheet Tabs (for Mentor & HR filter) */}
      {sheetTabs && sheetTabs.length > 0 && (
        <div className="bg-slate-100 dark:bg-[#181818] border border-slate-300 dark:border-[#2d2d2d] rounded-xl px-3 py-1.5 flex items-center justify-between gap-3 text-xs overflow-x-auto select-none">
          <div className="flex items-center gap-1 overflow-x-auto">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-[#858585] mr-1">
              Tab Sheet:
            </span>
            {sheetTabs.map((tab) => {
              const isActive = activeSheetTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => onSelectSheetTab && onSelectSheetTab(tab)}
                  className={`px-3 py-1 rounded-md font-medium transition-all text-xs border cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-white dark:bg-[#252526] text-[#0b4e8c] dark:text-[#3794ff] border-slate-300 dark:border-[#383838] font-bold shadow-xs'
                      : 'bg-transparent text-slate-600 dark:text-[#858585] border-transparent hover:bg-slate-200/70 dark:hover:bg-[#252526]'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
