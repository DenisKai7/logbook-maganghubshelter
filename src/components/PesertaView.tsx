import React, { useState } from 'react';
import {
  User,
  PesertaData,
  DailyActivity,
  KanbanItem,
  KANBAN_PRIORITY_OPTIONS,
  KANBAN_STATUS_OPTIONS,
  KanbanPriority,
  KanbanStatus,
  ACTIVITY_STATUS_OPTIONS,
  TARGET_STATUS_OPTIONS,
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
  getDailyNo,
  isDailyEditable,
  getKanbanTask,
  getKanbanPeserta,
  getKanbanUser,
  getKanbanPriority,
  getKanbanStatus,
  getKanbanDueDate,
  getKanbanStartDate,
  getKanbanEndDate,
  getKanbanReview,
  getKanbanEvidence
} from '../types';
import { api, formatIndonesianDate, computeDurationMinutes } from '../api';
import { StatusBadge } from './StatusBadge';
import { Modal } from './Modal';
import { SpreadsheetDailyTable } from './SpreadsheetDailyTable';
import { KanbanBoard } from './KanbanBoard';
import {
  Calendar,
  Clock,
  Plus,
  ExternalLink,
  Edit3,
  AlertTriangle,
  MessageSquare,
  CheckCircle2,
  FolderGit2,
  Target,
  Sparkles,
  BookOpen,
  Trash2,
  FileSpreadsheet,
  Layers
} from 'lucide-react';

interface Props {
  user: User;
  data: PesertaData;
  pin: string;
  onRefresh: () => void;
}

export const PesertaView: React.FC<Props> = ({ user, data, pin, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'kanban'>('daily');

  // Daily Activity Modal state matching the Google Sheet columns
  const [dailyModalOpen, setDailyModalOpen] = useState(false);
  const [editingDaily, setEditingDaily] = useState<DailyActivity | null>(null);
  const [dailyForm, setDailyForm] = useState({
    date: data.today,
    start: '08:00',
    end: '09:00',
    duration: 60 as number | string,
    activities: '',
    activitiesStatus: 'Done',
    targetDesc: '',
    targetStatus: 'Achieved',
    note: '',
    evidence: '',
  });
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyError, setDailyError] = useState('');

  // Kanban Modal state
  const [kanbanModalOpen, setKanbanModalOpen] = useState(false);
  const [editingKanban, setEditingKanban] = useState<KanbanItem | null>(null);
  const [kanbanForm, setKanbanForm] = useState({
    task: '',
    priority: 'Medium' as KanbanPriority,
    status: 'To Do' as KanbanStatus,
    dueDate: '',
    start: data.today,
    end: '',
    evidence: '',
  });
  const [kanbanLoading, setKanbanLoading] = useState(false);
  const [kanbanError, setKanbanError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Auto-calculate duration whenever start or end changes
  const handleTimeChange = (type: 'start' | 'end', val: string) => {
    const updated = { ...dailyForm, [type]: val };
    const dur = computeDurationMinutes(
      type === 'start' ? val : dailyForm.start,
      type === 'end' ? val : dailyForm.end
    );
    if (dur !== '') {
      updated.duration = dur;
    }
    setDailyForm(updated);
  };

  const handleDeleteItem = async (id: string, type: 'daily' | 'kanban' | 'weekly', label: string) => {
    if (!window.confirm(`Hapus ${label}? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await api.deleteItem(user.email, pin, { id, type: type as any });
      if (res.status === 'success') {
        onRefresh();
      } else {
        alert(res.message || 'Gagal menghapus data.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setDeletingId(null);
    }
  };

  // Stats calculation
  const approvedDaily = data.dailyActivities.filter(d => {
    return d.Status === 'Disetujui';
  }).length;
  const inProgressDaily = data.dailyActivities.filter(d => {
    const st = getDailyActivitiesStatus(d);
    return st === 'On Progress' && d.Status !== 'Disetujui';
  }).length;
  const totalMinutes = data.dailyActivities.reduce((acc, d) => {
    const dur = Number(d.Duration);
    return isNaN(dur) ? acc : acc + dur;
  }, 0);

  // Kanban Items list (using kanbanItems or weeklyPlans)
  const currentKanbanList: KanbanItem[] = data.kanbanItems || data.weeklyPlans || [];
  const completedKanban = currentKanbanList.filter(k => getKanbanStatus(k) === 'Done').length;

  // Open Daily Modal
  const openNewDaily = () => {
    setEditingDaily(null);
    const dur = computeDurationMinutes('08:00', '09:00') || 60;
    setDailyForm({
      date: data.today,
      start: '08:00',
      end: '09:00',
      duration: dur,
      activities: '',
      activitiesStatus: 'Done',
      targetDesc: '',
      targetStatus: 'Achieved',
      note: '',
      evidence: '',
    });
    setDailyError('');
    setDailyModalOpen(true);
  };

  const openEditDaily = (item: DailyActivity) => {
    if (!isDailyEditable(item)) {
      alert('Aktivitas yang sudah disetujui, revisi, atau ditolak tidak dapat diedit.');
      return;
    }
    setEditingDaily(item);
    const rawDate = item.Date || item.Tanggal || data.today;
    const durVal = item.Duration !== undefined && item.Duration !== '' ? item.Duration : computeDurationMinutes(item.Start || '08:00', item.End || '09:00');
    setDailyForm({
      date: rawDate,
      start: item.Start || '08:00',
      end: item.End || '09:00',
      duration: durVal || 60,
      activities: getDailyActivities(item),
      activitiesStatus: getDailyActivitiesStatus(item) || 'Done',
      targetDesc: getDailyTargetDesc(item) !== '-' ? getDailyTargetDesc(item) : '',
      targetStatus: getDailyTargetStatus(item) !== '-' ? getDailyTargetStatus(item) : '',
      note: getDailyNote(item) !== '-' ? getDailyNote(item) : '',
      evidence: getDailyEvidence(item) !== '-' ? getDailyEvidence(item) : '',
    });
    setDailyError('');
    setDailyModalOpen(true);
  };

  const handleSaveDaily = async (e: React.FormEvent) => {
    e.preventDefault();
    setDailyError('');
    if (!dailyForm.date || !dailyForm.activities.trim()) {
      setDailyError('Date dan Activities wajib diisi.');
      return;
    }

    setDailyLoading(true);
    try {
      const dur = dailyForm.duration !== '' ? Number(dailyForm.duration) : computeDurationMinutes(dailyForm.start, dailyForm.end);
      const formattedDate = formatIndonesianDate(dailyForm.date) || dailyForm.date;

      const res = await api.saveDailyActivity(user.email, pin, {
        no: editingDaily ? (editingDaily.No || editingDaily.Log_ID) : undefined,
        date: formattedDate,
        start: dailyForm.start,
        end: dailyForm.end,
        duration: dur !== '' ? dur : undefined,
        activities: dailyForm.activities.trim(),
        activitiesStatus: dailyForm.activitiesStatus,
        targetDesc: dailyForm.targetDesc.trim(),
        targetStatus: dailyForm.targetStatus,
        note: dailyForm.note.trim(),
        evidence: dailyForm.evidence.trim(),
        // User identity
        userId: user.userId,
        namaPeserta: user.nama,
        mentorId: user.mentorId || '',
        // compatibility
        tanggal: dailyForm.date,
        deskripsi: dailyForm.activities.trim(),
        kategori: 'Mengerjakan Tugas',
        outputLink: dailyForm.evidence.trim(),
        kendala: dailyForm.note.trim(),
        logId: editingDaily?.Log_ID
      });

      if (res.status === 'success') {
        setDailyModalOpen(false);
        onRefresh();
      } else {
        setDailyError(res.message || 'Gagal menyimpan aktivitas.');
      }
    } catch (err: any) {
      setDailyError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setDailyLoading(false);
    }
  };

  // Kanban Handlers
  const openNewKanban = () => {
    setEditingKanban(null);
    setKanbanForm({
      task: '',
      priority: 'Medium',
      status: 'To Do',
      dueDate: '',
      start: data.today,
      end: '',
      evidence: '',
    });
    setKanbanError('');
    setKanbanModalOpen(true);
  };

  const openEditKanban = (item: KanbanItem) => {
    const review = getKanbanReview(item);
    if (review === 'Disetujui' || review === 'Ditolak') {
      alert('Task yang sudah disetujui atau ditolak tidak dapat diedit.');
      return;
    }
    setEditingKanban(item);
    setKanbanForm({
      task: getKanbanTask(item),
      priority: getKanbanPriority(item),
      status: getKanbanStatus(item),
      dueDate: getKanbanDueDate(item) !== '-' ? getKanbanDueDate(item) : '',
      start: getKanbanStartDate(item) !== '-' ? getKanbanStartDate(item) : '',
      end: getKanbanEndDate(item) !== '-' ? getKanbanEndDate(item) : '',
      evidence: getKanbanEvidence(item),
    });
    setKanbanError('');
    setKanbanModalOpen(true);
  };

  const handleQuickStatusChange = async (item: KanbanItem, newStatus: KanbanStatus) => {
    const review = getKanbanReview(item);
    if (review === 'Disetujui' || review === 'Ditolak') {
      alert('Task yang sudah disetujui atau ditolak tidak dapat diubah statusnya.');
      return;
    }
    try {
      const res = await api.saveKanban(user.email, pin, {
        no: item.No || item.Plan_ID,
        id: String(item.No || item.Plan_ID),
        task: getKanbanTask(item),
        peserta: user.nama,
        user: getKanbanUser(item) || user.nama,
        userId: user.userId,
        mentorId: user.mentorId,
        priority: getKanbanPriority(item),
        status: newStatus,
        dueDate: getKanbanDueDate(item),
        start: getKanbanStartDate(item) !== '-' ? getKanbanStartDate(item) : '',
        end: newStatus === 'Done' ? (getKanbanEndDate(item) !== '-' ? getKanbanEndDate(item) : data.today) : (getKanbanEndDate(item) !== '-' ? getKanbanEndDate(item) : ''),
        evidence: getKanbanEvidence(item),
        review: review,
        targetMingguan: getKanbanTask(item),
        mingguKe: getKanbanDueDate(item),
      });
      if (res.status === 'success') {
        onRefresh();
      } else {
        alert(res.message || 'Gagal mengubah status Kanban.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    }
  };

  const handleSaveKanban = async (e: React.FormEvent) => {
    e.preventDefault();
    setKanbanError('');
    if (!kanbanForm.task.trim()) {
      setKanbanError('Task wajib diisi.');
      return;
    }

    if (editingKanban) {
      const review = getKanbanReview(editingKanban);
      if (review === 'Disetujui' || review === 'Ditolak') {
        setKanbanError('Task yang sudah disetujui atau ditolak tidak dapat diedit.');
        return;
      }
    }

    setKanbanLoading(true);
    try {
      const res = await api.saveKanban(user.email, pin, {
        no: editingKanban ? (editingKanban.No || editingKanban.Plan_ID) : undefined,
        id: editingKanban ? String(editingKanban.No || editingKanban.Plan_ID) : undefined,
        task: kanbanForm.task.trim(),
        peserta: user.nama,
        user: editingKanban ? getKanbanUser(editingKanban) : user.nama,
        userId: user.userId,
        mentorId: user.mentorId,
        priority: kanbanForm.priority,
        status: kanbanForm.status,
        dueDate: kanbanForm.dueDate,
        start: kanbanForm.start,
        end: kanbanForm.end,
        evidence: kanbanForm.evidence.trim(),
        review: editingKanban ? getKanbanReview(editingKanban) : 'Menunggu',
        targetMingguan: kanbanForm.task.trim(),
        mingguKe: kanbanForm.dueDate,
      });

      if (res.status === 'success') {
        setKanbanModalOpen(false);
        onRefresh();
      } else {
        setKanbanError(res.message || 'Gagal menyimpan task Kanban.');
      }
    } catch (err: any) {
      setKanbanError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setKanbanLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Editorial Overview Header */}
      <section className="bg-white dark:bg-[#252526] rounded-2xl border border-slate-200/90 dark:border-[#2d2d2d] p-5 sm:p-7 shadow-xs transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-500 dark:text-[#858585] text-xs font-semibold uppercase tracking-wider">
              <span>PT. Shelter Indonesia Gemilang</span>
              <span>•</span>
              <span>{user.divisi}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                Mentor: <strong className="text-slate-800 dark:text-white font-semibold">{data.mentorName}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
              {activeTab === 'daily' ? 'Daily Activities' : 'Kanban Task Management'}
            </h1>
            <p className="text-slate-500 dark:text-[#858585] text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
              {activeTab === 'daily'
                ? 'Lembar catatan aktivitas harian resmi PT. Shelter Indonesia Gemilang.'
                : 'Tabel manajemen tugas dan proyek magang.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <button
              onClick={activeTab === 'daily' ? openNewDaily : openNewKanban}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0b4e8c] hover:bg-[#083b6b] dark:bg-[#0e639c] dark:hover:bg-[#1177bb] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {activeTab === 'daily' ? 'Tambah Aktivitas' : 'Tambah Task Kanban'}
            </button>
          </div>
        </div>

        {/* Quiet Metric Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-100 dark:border-[#2d2d2d]">
          <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-[#1e2733] border border-blue-200/50 dark:border-[#264f78]">
            <span className="text-[11px] font-semibold text-[#0b4e8c] dark:text-[#9cdcfe] uppercase tracking-wider block">Minggu Ini</span>
            <span className="text-base font-semibold text-slate-900 dark:text-white font-mono mt-0.5 block">{data.currentWeek}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200/70 dark:border-[#2d2d2d]">
            <span className="text-[11px] font-medium text-slate-500 dark:text-[#858585] uppercase tracking-wider block">Total Aktivitas</span>
            <span className="text-base font-semibold text-slate-900 dark:text-white font-mono mt-0.5 block">{data.dailyActivities.length} Baris</span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-[#1b3424] border border-emerald-200/50 dark:border-[#2e6040]">
            <span className="text-[11px] font-semibold text-emerald-800 dark:text-[#4ec9b0] uppercase tracking-wider block">Kanban Done</span>
            <span className="text-base font-semibold text-emerald-900 dark:text-[#4ec9b0] font-mono mt-0.5 block">
              {completedKanban} / {currentKanbanList.length}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-[#342c15] border border-amber-200/50 dark:border-[#5a4d22]">
            <span className="text-[11px] font-semibold text-amber-800 dark:text-[#dcdcaa] uppercase tracking-wider block">Total Durasi Log</span>
            <span className="text-base font-semibold text-slate-900 dark:text-white font-mono mt-0.5 block">
              {totalMinutes} <span className="text-xs font-normal text-slate-400 dark:text-[#858585]">menit ({(totalMinutes / 60).toFixed(1)} jam)</span>
            </span>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#2d2d2d]">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('daily')}
            className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer flex items-center gap-2 ${
              activeTab === 'daily'
                ? 'text-[#0b4e8c] dark:text-[#3794ff] border-b-2 border-[#0b4e8c] dark:border-[#3794ff]'
                : 'text-slate-500 dark:text-[#858585] hover:text-slate-800 dark:hover:text-[#cccccc]'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Lembar Daily Activities ({data.dailyActivities.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('kanban')}
            className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer flex items-center gap-2 ${
              activeTab === 'kanban'
                ? 'text-[#0b4e8c] dark:text-[#3794ff] border-b-2 border-[#0b4e8c] dark:border-[#3794ff]'
                : 'text-slate-500 dark:text-[#858585] hover:text-slate-800 dark:hover:text-[#cccccc]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Kanban ({currentKanbanList.length})</span>
          </button>
        </nav>
      </div>

      {/* TAB CONTENT: DAILY ACTIVITIES IN SPREADSHEET VIEW */}
      {activeTab === 'daily' && (
        <div className="space-y-4 animate-fade-in-up">
          <SpreadsheetDailyTable
            activities={data.dailyActivities}
            editable={true}
            onEdit={openEditDaily}
            onDelete={(item) =>
              handleDeleteItem(
                String(item.No || item.Log_ID),
                'daily',
                `baris aktivitas #${getDailyNo(item)}`
              )
            }
            deletingId={deletingId}
            sheetTabs={[user.nama]}
            activeSheetTab={user.nama}
            onAddNew={openNewDaily}
            emptyMessage="Belum ada aktivitas tercatat di lembar Personal Daily Activities Anda."
          />
        </div>
      )}

      {/* TAB CONTENT: KANBAN BOARD & SPREADSHEET TABLE */}
      {activeTab === 'kanban' && (
        <div className="space-y-4 animate-fade-in-up">
          <KanbanBoard
            items={currentKanbanList}
            currentUser={user}
            editable={true}
            onEdit={openEditKanban}
            onDelete={(item) =>
              handleDeleteItem(
                String(item.Plan_ID || item.No),
                'kanban',
                `task "${getKanbanTask(item)}"`
              )
            }
            deletingId={deletingId}
            onStatusChange={handleQuickStatusChange}
            emptyMessage="Belum ada task di lembar Kanban Anda."
          />
        </div>
      )}

      {/* DAILY ACTIVITY MODAL */}
      <Modal
        isOpen={dailyModalOpen}
        onClose={() => setDailyModalOpen(false)}
        title={editingDaily ? 'Edit Baris Aktivitas Harian' : 'Catat Aktivitas Harian Baru'}
        subtitle="Sesuai kolom spreadsheet Personal Daily Activities PT. Shelter Indonesia Gemilang"
      >
        <form onSubmit={handleSaveDaily} className="space-y-4">
          {dailyError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-[#341b1d] border border-rose-200 dark:border-[#5c2427] text-xs text-rose-800 dark:text-[#f48771]">
              {dailyError}
            </div>
          )}

          {/* Date & Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dailyForm.date.includes('-') && dailyForm.date.length === 10 ? dailyForm.date : data.today}
                onChange={e => setDailyForm({ ...dailyForm, date: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-slate-50/50 dark:bg-[#1e1e1e] text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400 dark:text-[#858585] block mt-0.5 truncate">
                {formatIndonesianDate(dailyForm.date)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">
                Start Time
              </label>
              <input
                type="time"
                required
                value={dailyForm.start}
                onChange={e => handleTimeChange('start', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-slate-50/50 dark:bg-[#1e1e1e] text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">
                End Time
              </label>
              <input
                type="time"
                required
                value={dailyForm.end}
                onChange={e => handleTimeChange('end', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-slate-50/50 dark:bg-[#1e1e1e] text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          {/* Duration & Activities Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4]">
                  Duration (Menit)
                </label>
                <span className="text-[10px] text-slate-400 dark:text-[#858585]">
                  Otomatis terhitung
                </span>
              </div>
              <input
                type="number"
                min="0"
                value={dailyForm.duration}
                onChange={e => setDailyForm({ ...dailyForm, duration: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-slate-50/50 dark:bg-[#1e1e1e] text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">
                Activities Status
              </label>
              <select
                value={dailyForm.activitiesStatus}
                onChange={e => setDailyForm({ ...dailyForm, activitiesStatus: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-white dark:bg-[#1e1e1e] text-slate-900 dark:text-white"
              >
                {ACTIVITY_STATUS_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Activities Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">
              Activities <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Contoh: Koordinasi dg Bp GM mengenai arsip dokumen legal dan persiapan berkas onboarding."
              value={dailyForm.activities}
              onChange={e => setDailyForm({ ...dailyForm, activities: e.target.value })}
              className="w-full p-3 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-slate-50/30 dark:bg-[#1e1e1e] text-slate-900 dark:text-white leading-relaxed"
            />
          </div>

          {/* Target Desc & Target Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">
                Target Desc <span className="text-slate-400 dark:text-[#858585] font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                placeholder="Target keluaran kegiatan"
                value={dailyForm.targetDesc}
                onChange={e => setDailyForm({ ...dailyForm, targetDesc: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-slate-50/50 dark:bg-[#1e1e1e] text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">
                Target Status
              </label>
              <select
                value={dailyForm.targetStatus}
                onChange={e => setDailyForm({ ...dailyForm, targetStatus: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-white dark:bg-[#1e1e1e] text-slate-900 dark:text-white"
              >
                <option value="">- Pilih Status Target -</option>
                {TARGET_STATUS_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Note & Evidence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">
                Note <span className="text-slate-400 dark:text-[#858585] font-normal">(catatan / kendala)</span>
              </label>
              <input
                type="text"
                placeholder="Catatan tambahan"
                value={dailyForm.note}
                onChange={e => setDailyForm({ ...dailyForm, note: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-slate-50/50 dark:bg-[#1e1e1e] text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">
                Achieved Target Evidence
              </label>
              <input
                type="text"
                placeholder="Link file drive / dokumen / git"
                value={dailyForm.evidence}
                onChange={e => setDailyForm({ ...dailyForm, evidence: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-slate-50/50 dark:bg-[#1e1e1e] text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setDailyModalOpen(false)}
              className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-[#858585] hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={dailyLoading}
              className="px-4 py-2 bg-[#0b4e8c] hover:bg-[#083b6b] dark:bg-[#0e639c] dark:hover:bg-[#1177bb] disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {dailyLoading ? 'Menyimpan...' : editingDaily ? 'Simpan Perubahan' : 'Simpan Baris Aktivitas'}
            </button>
          </div>
        </form>
      </Modal>

      {/* KANBAN TASK MODAL */}
      <Modal
        isOpen={kanbanModalOpen}
        onClose={() => setKanbanModalOpen(false)}
        title={editingKanban ? 'Edit Task Kanban' : 'Buat Task Kanban Baru'}
        subtitle="Sesuai lembar Kanban PT. Shelter Indonesia Gemilang"
      >
        <form onSubmit={handleSaveKanban} className="space-y-4">
          {kanbanError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-[#341b1d] border border-rose-200 dark:border-[#5c2427] text-xs text-rose-800 dark:text-[#f48771]">
              {kanbanError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">
              Task <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Contoh: Menyelesaikan arsitektur dashboard peserta dan integrasi API login."
              value={kanbanForm.task}
              onChange={e => setKanbanForm({ ...kanbanForm, task: e.target.value })}
              className="w-full p-3 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-slate-50/30 dark:bg-[#1e1e1e] text-slate-900 dark:text-white leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">
                Priority
              </label>
              <select
                value={kanbanForm.priority}
                onChange={e => setKanbanForm({ ...kanbanForm, priority: e.target.value as KanbanPriority })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-white dark:bg-[#1e1e1e] text-slate-900 dark:text-white font-semibold"
              >
                {KANBAN_PRIORITY_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">
                Status
              </label>
              <select
                value={kanbanForm.status}
                onChange={e => {
                  const newStatus = e.target.value as KanbanStatus;
                  const updated = { ...kanbanForm, status: newStatus };
                  // Auto-fill End Date when status = Done
                  if (newStatus === 'Done' && !kanbanForm.end) {
                    updated.end = data.today;
                  }
                  setKanbanForm(updated);
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-white dark:bg-[#1e1e1e] text-slate-900 dark:text-white font-semibold"
              >
                {KANBAN_STATUS_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={kanbanForm.dueDate.includes('-') && kanbanForm.dueDate.length === 10 ? kanbanForm.dueDate : ''}
                onChange={e => setKanbanForm({ ...kanbanForm, dueDate: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-slate-50/50 dark:bg-[#1e1e1e] text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={kanbanForm.start.includes('-') && kanbanForm.start.length === 10 ? kanbanForm.start : ''}
                onChange={e => setKanbanForm({ ...kanbanForm, start: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-slate-50/50 dark:bg-[#1e1e1e] text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">
                End Date <span className="text-slate-400 dark:text-[#858585] font-normal">(otomatis saat Done)</span>
              </label>
              <input
                type="date"
                value={kanbanForm.end.includes('-') && kanbanForm.end.length === 10 ? kanbanForm.end : ''}
                onChange={e => setKanbanForm({ ...kanbanForm, end: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-slate-50/50 dark:bg-[#1e1e1e] text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">
              Evidence <span className="text-slate-400 dark:text-[#858585] font-normal">(tautan bukti / hasil)</span>
            </label>
            <input
              type="text"
              placeholder="https://drive.google.com/... atau link dokumen"
              value={kanbanForm.evidence}
              onChange={e => setKanbanForm({ ...kanbanForm, evidence: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-slate-50/50 dark:bg-[#1e1e1e] text-slate-900 dark:text-white font-mono"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setKanbanModalOpen(false)}
              className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-[#858585] hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={kanbanLoading}
              className="px-4 py-2 bg-[#0b4e8c] hover:bg-[#083b6b] dark:bg-[#0e639c] dark:hover:bg-[#1177bb] disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {kanbanLoading ? 'Menyimpan...' : editingKanban ? 'Simpan Perubahan' : 'Simpan Task Kanban'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
