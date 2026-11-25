import React from 'react';
import {
  DailyActivity,
  User,
  MenteeSummary,
  getDailyNo,
  getDailyDate,
  getDailyStart,
  getDailyEnd,
  getDailyDuration,
  getDailyActivities,
  getDailyActivitiesStatus,
  getDailyTargetDesc,
  getDailyTargetStatus,
  getDailyNote,
  getDailyEvidence,
  getDailyMenteeName,
  isTotalSummaryRow,
  getDailyStatusReview,
  isDailyEditable,
} from '../types';
import { StatusBadge } from './StatusBadge';
import {
  Edit3,
  Trash2,
  ExternalLink,
  Plus,
  Menu,
  Printer,
  MessageSquare,
  ChevronDown
} from 'lucide-react';

interface Props {
  activities: DailyActivity[];
  users?: Array<User | MenteeSummary>;
  editable?: boolean;
  onEdit?: (item: DailyActivity) => void;
  onDelete?: (item: DailyActivity) => void;
  deletingId?: string | null;
  // Mentor Review Actions
  mentorMode?: boolean;
  onReview?: (item: DailyActivity) => void;
  onReviewWithNote?: (item: DailyActivity) => void;
  // Google Sheets bottom tabs
  sheetTabs?: string[];
  activeSheetTab?: string;
  onSelectSheetTab?: (tab: string) => void;
  onAddNew?: () => void;
  emptyMessage?: string;
  showMenteeColumn?: boolean;
}

export const SpreadsheetDailyTable: React.FC<Props> = ({
  activities,
  users,
  editable = false,
  onEdit,
  onDelete,
  deletingId,
  mentorMode = false,
  onReview,
  onReviewWithNote,
  sheetTabs,
  activeSheetTab,
  onSelectSheetTab,
  onAddNew,
  emptyMessage = 'Belum ada aktivitas yang dicatat di lembar ini.',
  showMenteeColumn = false,
}) => {
  // Filter out any summary/total rows like 'NO: TOTAL'
  const validActivities = activities.filter(a => !isTotalSummaryRow(a));

  return (
    <div className="w-full bg-white dark:bg-[#1e1e1e] rounded-2xl border border-slate-300 dark:border-[#2d2d2d] shadow-sm overflow-hidden transition-colors duration-200">
      {/* Top Sheet Name Banner */}
      <div className="bg-slate-50 dark:bg-[#252526] px-4 py-2 border-b border-slate-200 dark:border-[#2d2d2d] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="font-semibold text-xs text-slate-800 dark:text-white">
            Daily Activities
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-500 dark:text-[#858585]">
          {validActivities.length} Baris Data
        </span>
      </div>

      {/* Spreadsheet Main Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          {/* Header matching Google Sheets screenshot: Dark Navy Blue (#16325B) with white text & filter carats */}
          <thead>
            <tr className="bg-[#16325B] dark:bg-[#0f243d] text-white font-bold text-[11px] tracking-wide select-none">
              <th className="py-2.5 px-3 text-center border-r border-blue-900/50 w-12 font-bold">
                NO
              </th>
              {showMenteeColumn && (
                <th className="py-2.5 px-3.5 border-r border-blue-900/50 min-w-[150px] whitespace-nowrap">
                  Peserta
                </th>
              )}
              <th className="py-2.5 px-3.5 border-r border-blue-900/50 min-w-[170px] whitespace-nowrap">
                <div className="flex items-center justify-between gap-1">
                  <span>Date</span>
                  <ChevronDown className="w-3 h-3 text-blue-200/70" />
                </div>
              </th>
              <th className="py-2.5 px-2.5 text-center border-r border-blue-900/50 w-20 whitespace-nowrap">
                <div className="flex items-center justify-center gap-1">
                  <span>Start</span>
                  <ChevronDown className="w-3 h-3 text-blue-200/70" />
                </div>
              </th>
              <th className="py-2.5 px-2.5 text-center border-r border-blue-900/50 w-20 whitespace-nowrap">
                <div className="flex items-center justify-center gap-1">
                  <span>End</span>
                  <ChevronDown className="w-3 h-3 text-blue-200/70" />
                </div>
              </th>
              <th className="py-2.5 px-2.5 text-center border-r border-blue-900/50 w-24 whitespace-nowrap">
                <div className="flex items-center justify-center gap-1">
                  <span>Duration</span>
                  <ChevronDown className="w-3 h-3 text-blue-200/70" />
                </div>
              </th>
              <th className="py-2.5 px-4 border-r border-blue-900/50 min-w-[280px]">
                <div className="flex items-center justify-between gap-1">
                  <span>Activities</span>
                  <ChevronDown className="w-3 h-3 text-blue-200/70" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center border-r border-blue-900/50 min-w-[130px] whitespace-nowrap">
                <div className="flex items-center justify-center gap-1">
                  <span>Activities Status</span>
                  <ChevronDown className="w-3 h-3 text-blue-200/70" />
                </div>
              </th>
              <th className="py-2.5 px-3.5 border-r border-blue-900/50 min-w-[170px]">
                <div className="flex items-center justify-between gap-1">
                  <span>Target Desc</span>
                  <ChevronDown className="w-3 h-3 text-blue-200/70" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center border-r border-blue-900/50 min-w-[120px] whitespace-nowrap">
                <div className="flex items-center justify-center gap-1">
                  <span>Target Status</span>
                  <ChevronDown className="w-3 h-3 text-blue-200/70" />
                </div>
              </th>
              <th className="py-2.5 px-3.5 border-r border-blue-900/50 min-w-[170px]">
                <div className="flex items-center justify-between gap-1">
                  <span>Note</span>
                  <ChevronDown className="w-3 h-3 text-blue-200/70" />
                </div>
              </th>
              <th className="py-2.5 px-3.5 border-r border-blue-900/50 min-w-[180px]">
                <div className="flex items-center justify-between gap-1">
                  <span>Achieved Target Evidence</span>
                  <ChevronDown className="w-3 h-3 text-blue-200/70" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center border-r border-blue-900/50 min-w-[130px] whitespace-nowrap">
                <div className="flex items-center justify-center gap-1">
                  <span>Status Review</span>
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

          {/* Table Body with Google Sheets soft green tint (#edf7ed / #e3f2e1) & VS Code Dark theme */}
          <tbody className="divide-y divide-slate-200/80 dark:divide-[#2d2d2d] text-slate-800 dark:text-[#cccccc]">
            {validActivities.length === 0 ? (
              <tr>
                <td
                  colSpan={editable || mentorMode ? (showMenteeColumn ? 15 : 14) : (showMenteeColumn ? 13 : 12)}
                  className="py-12 text-center text-slate-400 dark:text-[#858585] bg-slate-50/50 dark:bg-[#252526]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              validActivities.map((item, idx) => {
                const no = getDailyNo(item, idx);
                const date = getDailyDate(item);
                const start = getDailyStart(item);
                const end = getDailyEnd(item);
                const duration = getDailyDuration(item);
                const acts = getDailyActivities(item);
                const actStatus = getDailyActivitiesStatus(item);
                const targetDesc = getDailyTargetDesc(item);
                const targetStatus = getDailyTargetStatus(item);
                const note = getDailyNote(item);
                const evidence = getDailyEvidence(item);
                const menteeName = getDailyMenteeName(item, users);
                const canEdit = editable && isDailyEditable(item);

                return (
                  <tr
                    key={item.Log_ID || `${no}-${idx}`}
                    className="hover:bg-blue-50/70 dark:hover:bg-[#2a2d2e] bg-[#edf7ed] even:bg-[#e4f3e2] dark:bg-[#1e1e1e] dark:even:bg-[#252526] transition-colors border-b border-[#cfe6ce] dark:border-[#2d2d2d]"
                  >
                    {/* NO */}
                    <td className="py-2.5 px-2 text-center font-mono font-semibold text-slate-700 dark:text-[#858585] border-r border-[#cfe6ce] dark:border-[#2d2d2d]">
                      {no}
                    </td>

                    {/* Mentee (if shown) */}
                    {showMenteeColumn && (
                      <td className="py-2.5 px-3.5 whitespace-nowrap font-medium text-slate-900 dark:text-white border-r border-[#cfe6ce] dark:border-[#2d2d2d]">
                        {menteeName}
                      </td>
                    )}

                    {/* Date */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap font-medium text-slate-900 dark:text-white border-r border-[#cfe6ce] dark:border-[#2d2d2d]">
                      {date}
                    </td>

                    {/* Start */}
                    <td className="py-2.5 px-2.5 text-center font-mono text-slate-700 dark:text-[#cccccc] border-r border-[#cfe6ce] dark:border-[#2d2d2d]">
                      {start}
                    </td>

                    {/* End */}
                    <td className="py-2.5 px-2.5 text-center font-mono text-slate-700 dark:text-[#cccccc] border-r border-[#cfe6ce] dark:border-[#2d2d2d]">
                      {end}
                    </td>

                    {/* Duration */}
                    <td className="py-2.5 px-2.5 text-center font-mono font-semibold text-[#0b4e8c] dark:text-[#9cdcfe] border-r border-[#cfe6ce] dark:border-[#2d2d2d]">
                      {duration !== '-' ? `${duration}` : '-'}
                    </td>

                    {/* Activities */}
                    <td className="py-2.5 px-4 leading-relaxed text-slate-900 dark:text-[#d4d4d4] border-r border-[#cfe6ce] dark:border-[#2d2d2d]">
                      <div className="whitespace-pre-line max-w-sm font-normal">
                        {acts}
                      </div>
                    </td>

                    {/* Activities Status with dropdown appearance */}
                    <td className="py-2.5 px-3 text-center border-r border-[#cfe6ce] dark:border-[#2d2d2d] whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 bg-white/70 dark:bg-[#1e1e1e] px-2 py-0.5 rounded border border-slate-300 dark:border-[#383838]">
                        <StatusBadge status={actStatus} size="sm" />
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </td>

                    {/* Target Desc */}
                    <td className="py-2.5 px-3.5 leading-relaxed text-slate-700 dark:text-[#cccccc] border-r border-[#cfe6ce] dark:border-[#2d2d2d]">
                      <div className="whitespace-pre-line max-w-xs">
                        {targetDesc}
                      </div>
                    </td>

                    {/* Target Status */}
                    <td className="py-2.5 px-3 text-center border-r border-[#cfe6ce] dark:border-[#2d2d2d] whitespace-nowrap">
                      {targetStatus && targetStatus !== '-' ? (
                        <div className="inline-flex items-center gap-1 bg-white/70 dark:bg-[#1e1e1e] px-2 py-0.5 rounded border border-slate-300 dark:border-[#383838]">
                          <StatusBadge status={targetStatus} size="sm" />
                          <ChevronDown className="w-3 h-3 text-slate-400" />
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-[#666666]">-</span>
                      )}
                    </td>

                    {/* Note */}
                    <td className="py-2.5 px-3.5 text-slate-600 dark:text-[#858585] border-r border-[#cfe6ce] dark:border-[#2d2d2d]">
                      <div className="whitespace-pre-line max-w-xs text-[11px]">
                        {note}
                      </div>
                    </td>

                    {/* Achieved Target Evidence */}
                    <td className="py-2.5 px-3.5 text-slate-600 dark:text-[#858585] border-r border-[#cfe6ce] dark:border-[#2d2d2d]">
                      {evidence && evidence !== '-' ? (
                        evidence.startsWith('http') ? (
                          <a
                            href={evidence}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[#0b4e8c] dark:text-[#9cdcfe] hover:underline font-mono text-[11px] truncate max-w-[200px]"
                            title={evidence}
                          >
                            <span className="truncate">{evidence}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-[11px] font-mono text-slate-700 dark:text-[#cccccc] truncate block max-w-[200px]">
                            {evidence}
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400 dark:text-[#666666]">-</span>
                      )}
                    </td>

                    {/* Status Review */}
                    <td className="py-2.5 px-3 text-center border-r border-[#cfe6ce] dark:border-[#2d2d2d] whitespace-nowrap">
                      {mentorMode ? (
                        <button
                          onClick={() => onReviewWithNote && onReviewWithNote(item)}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold rounded px-2 py-0.5 border border-slate-200 dark:border-[#383838] bg-white/70 dark:bg-[#1e1e1e] text-slate-700 dark:text-[#cccccc] hover:bg-slate-50 dark:hover:bg-[#252526] focus:outline-none cursor-pointer"
                          title="Klik untuk update status & catatan"
                        >
                          <StatusBadge status={getDailyStatusReview(item)} size="sm" />
                          <MessageSquare className="w-3 h-3 text-slate-400 dark:text-[#858585]" />
                        </button>
                      ) : (
                        <StatusBadge status={getDailyStatusReview(item)} size="sm" />
                      )}
                    </td>

                    {/* Action Column for Peserta */}
                    {editable && (
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {canEdit && onEdit && (
                            <button
                              onClick={() => onEdit(item)}
                              className="p-1.5 text-slate-500 hover:text-[#0b4e8c] dark:hover:text-white rounded-lg hover:bg-white dark:hover:bg-[#383838] transition-colors cursor-pointer border border-slate-300 dark:border-[#383838]"
                              title="Edit Baris Aktivitas"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {canEdit && onDelete && (
                            <button
                              onClick={() => onDelete(item)}
                              disabled={deletingId === (item.Log_ID || String(no))}
                              className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-[#341b1d] transition-colors cursor-pointer disabled:opacity-50 border border-slate-300 dark:border-[#383838]"
                              title="Hapus Baris Aktivitas"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}

                    {/* Action Column for Mentor */}
                    {mentorMode && (
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {onReview && (
                            <button
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

      {/* Google Sheets Bottom Tab Bar */}
      {sheetTabs && sheetTabs.length > 0 && (
        <div className="bg-slate-100 dark:bg-[#181818] border-t border-slate-300 dark:border-[#2d2d2d] px-3 py-1.5 flex items-center justify-between gap-3 text-xs overflow-x-auto select-none">
          <div className="flex items-center gap-1">
            {onAddNew && (
              <button
                onClick={onAddNew}
                className="p-1.5 text-slate-600 dark:text-[#cccccc] hover:bg-slate-200 dark:hover:bg-[#252526] rounded-md transition-colors cursor-pointer"
                title="Tambah Logbook Baru"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}

            <div className="p-1.5 text-slate-400 dark:text-[#858585]">
              <Menu className="w-3.5 h-3.5" />
            </div>

            <div className="h-4 w-px bg-slate-300 dark:bg-[#383838] mx-1" />

            {/* Sheet Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {sheetTabs.map((tab) => {
                const isActive = activeSheetTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => onSelectSheetTab && onSelectSheetTab(tab)}
                    className={`px-3 py-1 rounded-t-md font-medium transition-all text-xs border cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-white dark:bg-[#252526] text-[#0b4e8c] dark:text-[#3794ff] border-slate-300 dark:border-[#383838] border-b-transparent font-semibold shadow-xs'
                        : 'bg-transparent text-slate-600 dark:text-[#858585] border-transparent hover:bg-slate-200/70 dark:hover:bg-[#252526]'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-400 dark:text-[#858585] shrink-0 hidden sm:block">
            {validActivities.length} Baris Data
          </div>
        </div>
      )}
    </div>
  );
};

