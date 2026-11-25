import React, { useState, useMemo } from 'react';
import {
  User,
  MentorData,
  DailyActivity,
  WeeklyPlan,
  ItemStatus,
  KanbanItem,
  KANBAN_STATUS_OPTIONS,
  KANBAN_PRIORITY_OPTIONS,
  ACTIVITY_STATUS_OPTIONS,
  TARGET_STATUS_OPTIONS,
  KanbanStatus,
  KanbanPriority,
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
  getDailyStatusReview,
} from '../types';

import { api, getTodayStr } from '../api';
import { StatusBadge } from './StatusBadge';
import { Modal } from './Modal';
import { SpreadsheetDailyTable } from './SpreadsheetDailyTable';
import { KanbanBoard } from './KanbanBoard';
import {
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Calendar,
  Layers,
  Check,
  RotateCcw,
  BarChart3,
  PieChart,
  TrendingUp,
  Activity,
  AlertTriangle,
  Award,
  ArrowUpRight,
  Filter,
  Printer,
  ChevronDown,
  X
} from 'lucide-react';

interface Props {
  user: User;
  data: MentorData;
  pin: string;
  onRefresh: () => void;
}

type TabType = 'analytics' | 'daily' | 'weekly';

const CATEGORY_COLORS = [
  { name: 'Mengerjakan Tugas', color: '#0b4e8c', darkColor: '#3794ff' },
  { name: 'Diskusi / Rapat Tim', color: '#0284c7', darkColor: '#38bdf8' },
  { name: 'Riset & Belajar', color: '#10b981', darkColor: '#4ec9b0' },
  { name: 'Troubleshooting & Bugfix', color: '#f59e0b', darkColor: '#dcdcaa' },
  { name: 'Dokumentasi & Laporan', color: '#8b5cf6', darkColor: '#c586c0' },
  { name: 'Presentasi / Review', color: '#f43f5e', darkColor: '#f48771' },
];

export const MentorView: React.FC<Props> = ({ user, data, pin, onRefresh }) => {
  const [selectedMentee, setSelectedMentee] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<TabType>('analytics');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // Review Modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{
    id: string;
    type: 'weekly' | 'daily' | 'kanban';
    title: string;
    peserta: string;
    content: string;
    outputLink?: string;
    kendala?: string;
    currentStatus: ItemStatus;
    catatan: string;
    // Daily-specific fields for mentor to view/edit
    date?: string;
    start?: string;
    end?: string;
    duration?: string;
    activitiesStatus?: string;
    targetDesc?: string;
    targetStatus?: string;
    note?: string;
    // Kanban-specific fields for print view
    priority?: string;
    kanbanStatus?: string;
    dueDate?: string;
    kanbanStart?: string;
    kanbanEnd?: string;
    evidence?: string;
    assignedTo?: string;
    mentorName?: string;
  } | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  // Review-with-note inline modal state
  const [reviewNoteModalOpen, setReviewNoteModalOpen] = useState(false);
  const [reviewNoteTarget, setReviewNoteTarget] = useState<DailyActivity | KanbanItem | null>(null);
  const [reviewNoteStatus, setReviewNoteStatus] = useState<'Menunggu' | 'Disetujui' | 'Revisi' | 'Ditolak'>('Menunggu');
  const [reviewNoteText, setReviewNoteText] = useState('');
  const [reviewNoteLoading, setReviewNoteLoading] = useState(false);

  // Mentor add task modal state
  const [kanbanModalOpen, setKanbanModalOpen] = useState(false);
  const [kanbanForm, setKanbanForm] = useState({
    task: '',
    priority: 'Medium' as KanbanPriority,
    status: 'To Do' as KanbanStatus,
    dueDate: '',
    start: getTodayStr(),
    end: '',
    evidence: '',
  });
  const [assignedTo, setAssignedTo] = useState<Set<string>>(new Set());
  const [assignedBy, setAssignedBy] = useState<Set<string>>(new Set([user.nama]));
  const [customAssigner, setCustomAssigner] = useState('');
  const [pesertaOpen, setPesertaOpen] = useState(false);
  const [assignerOpen, setAssignerOpen] = useState(false);
  const pesertaRef = React.useRef<HTMLDivElement>(null);
  const assignerRef = React.useRef<HTMLDivElement>(null);
  const [kanbanLoading, setKanbanLoading] = useState(false);
  const [kanbanError, setKanbanError] = useState('');

  // Mentee filtered dataset
  const menteeDaily = useMemo(() => {
    return data.dailyActivities.filter(d => {
      if (selectedMentee !== 'all') {
        const targetMentee = data.mentees.find(m => m.userId === selectedMentee);
        if (d.User_ID && String(d.User_ID).trim() === selectedMentee) return true;
        if (d.Nama_Peserta && targetMentee && d.Nama_Peserta.toLowerCase().includes(targetMentee.nama.toLowerCase())) return true;
        // Fallback for legacy row without User_ID / Nama_Peserta
        if (!d.User_ID && !d.Nama_Peserta) return true;
        return false;
      }
      return true;
    });
  }, [data.dailyActivities, selectedMentee, data.mentees]);

  const menteeWeekly = useMemo(() => {
    const list = data.kanbanItems || data.weeklyPlans || [];
    return list.filter(w => {
      if (selectedMentee !== 'all') {
        const targetMentee = data.mentees.find(m => m.userId === selectedMentee);
        if (w.User_ID && String(w.User_ID).trim() === selectedMentee) return true;
        const resolvedPeserta = getKanbanPeserta(w, data.mentees).toLowerCase();
        if (targetMentee && resolvedPeserta.includes(targetMentee.nama.toLowerCase())) return true;
        return false;
      }
      return true;
    });
  }, [data.kanbanItems, data.weeklyPlans, selectedMentee, data.mentees]);

  // Tab & status filtered lists
  const filteredDaily = useMemo(() => {
    return menteeDaily.filter(d => {
      if (filterStatus !== 'all' && d.Status !== filterStatus) return false;
      return true;
    });
  }, [menteeDaily, filterStatus]);

  const filteredWeekly = useMemo(() => {
    return menteeWeekly.filter(w => {
      if (filterStatus !== 'all' && w.Status !== filterStatus) return false;
      return true;
    });
  }, [menteeWeekly, filterStatus]);

  // Key KPI numbers
  const totalLogs = menteeDaily.length;
  const approvedDailyCount = useMemo(() => menteeDaily.filter(d => d.Status === 'Disetujui').length, [menteeDaily]);
  const pendingDailyCount = useMemo(() => menteeDaily.filter(d => d.Status === 'Menunggu').length, [menteeDaily]);
  const revisionDailyCount = useMemo(() => menteeDaily.filter(d => d.Status === 'Revisi').length, [menteeDaily]);
  const pendingWeeklyCount = useMemo(() => menteeWeekly.filter(w => w.Status === 'Menunggu').length, [menteeWeekly]);
  const pendingKanbanReviewCount = useMemo(() => menteeWeekly.filter(w => getKanbanReview(w) === 'Menunggu').length, [menteeWeekly]);
  const totalPending = pendingDailyCount + pendingWeeklyCount;
  const totalKanbanPending = pendingKanbanReviewCount;
  const approvalRate = totalLogs > 0 ? Math.round((approvedDailyCount / totalLogs) * 100) : 0;

  // Obstacle counts
  const logsWithObstacle = useMemo(() => {
    return menteeDaily.filter(d => d.Kendala && d.Kendala.trim() !== '' && d.Kendala !== 'Tidak ada kendala.');
  }, [menteeDaily]);

  // Timeline / Trend Bar Chart Data (grouped by date)
  const timelineChartData = useMemo(() => {
    const dateMap: Record<string, { date: string; approved: number; pending: number; revision: number; total: number }> = {};
    
    menteeDaily.forEach(d => {
      const date = d.Tanggal || 'Tanpa Tanggal';
      if (!dateMap[date]) {
        dateMap[date] = { date, approved: 0, pending: 0, revision: 0, total: 0 };
      }
      dateMap[date].total += 1;
      if (d.Status === 'Disetujui') dateMap[date].approved += 1;
      else if (d.Status === 'Revisi') dateMap[date].revision += 1;
      else dateMap[date].pending += 1;
    });

    // Sort ascending by date string and take the last 8 dates
    return Object.values(dateMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-8);
  }, [menteeDaily]);

  const maxTimelineTotal = useMemo(() => {
    return Math.max(...timelineChartData.map(d => d.total), 4);
  }, [timelineChartData]);

  // Category Distribution for Donut Chart
  const categoryChartData = useMemo(() => {
    const map: Record<string, number> = {};
    menteeDaily.forEach(d => {
      const cat = d.Kategori || 'Lainnya';
      map[cat] = (map[cat] || 0) + 1;
    });

    const entries = Object.entries(map).map(([name, count]) => {
      const meta = CATEGORY_COLORS.find(c => c.name === name) || {
        name,
        color: '#64748b',
        darkColor: '#94a3b8'
      };
      const pct = totalLogs > 0 ? (count / totalLogs) * 100 : 0;
      return {
        name,
        count,
        pct: Math.round(pct),
        color: meta.color,
        darkColor: meta.darkColor
      };
    });

    return entries.sort((a, b) => b.count - a.count);
  }, [menteeDaily, totalLogs]);

  // Mentee Performance Leaderboard / Progress
  const menteePerformance = useMemo(() => {
    return data.mentees.map(m => {
      const logs = data.dailyActivities.filter(d => d.User_ID === m.userId);
      const weekly = data.weeklyPlans.filter(w => w.User_ID === m.userId);
      const approved = logs.filter(d => d.Status === 'Disetujui').length;
      const pending = logs.filter(d => d.Status === 'Menunggu').length + weekly.filter(w => w.Status === 'Menunggu').length;
      const rate = logs.length > 0 ? Math.round((approved / logs.length) * 100) : 0;
      const lastActive = logs[0]?.Tanggal || '-';

      return {
        ...m,
        totalLogs: logs.length,
        approvedLogs: approved,
        totalWeekly: weekly.length,
        pendingReview: pending,
        rate,
        lastActive
      };
    }).sort((a, b) => b.totalLogs - a.totalLogs);
  }, [data.mentees, data.dailyActivities, data.weeklyPlans]);

  // Quick Review trigger
  const openReview = (
    id: string,
    type: 'weekly' | 'daily' | 'kanban',
    peserta: string,
    title: string,
    content: string,
    currentStatus: ItemStatus,
    catatan = '',
    outputLink?: string,
    kendala?: string,
    extraFields?: {
      date?: string;
      start?: string;
      end?: string;
      duration?: string;
      activitiesStatus?: string;
      targetDesc?: string;
      targetStatus?: string;
      note?: string;
      // Kanban print fields
      priority?: string;
      kanbanStatus?: string;
      dueDate?: string;
      kanbanStart?: string;
      kanbanEnd?: string;
      evidence?: string;
      assignedTo?: string;
      mentorName?: string;
    }
  ) => {
    setReviewTarget({
      id,
      type,
      peserta,
      title,
      content,
      outputLink,
      kendala,
      currentStatus,
      catatan,
      ...extraFields
    });
    setReviewNote(catatan || '');
    setReviewModalOpen(true);
  };

  const handleQuickApprove = async (id: string, type: 'weekly' | 'daily' | 'kanban') => {
    try {
      const res = await api.reviewItem(user.email, pin, {
        id,
        type: type === 'kanban' ? 'weekly' : type,
        status: 'Disetujui',
        catatan: 'Disetujui oleh mentor.'
      });
      if (res.status === 'success') {
        onRefresh();
      } else {
        alert(res.message || 'Gagal mengubah status.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    }
  };

  const isKanbanItem = (item: DailyActivity | KanbanItem): item is KanbanItem => {
    return !('Log_ID' in item) && !('Activities' in item);
  };

  const openReviewWithNote = (item: DailyActivity | KanbanItem) => {
    setReviewNoteTarget(item);
    if (isKanbanItem(item)) {
      // Kanban item
      setReviewNoteStatus((getKanbanReview(item) as any) || 'Menunggu');
      setReviewNoteText(item.Catatan_Mentor || '');
    } else {
      // Daily activity
      const dailyItem = item as DailyActivity;
      setReviewNoteStatus((getDailyStatusReview(dailyItem) as any) || 'Menunggu');
      setReviewNoteText(dailyItem.Note || dailyItem.Catatan_Mentor || '');
    }
    setReviewNoteModalOpen(true);
  };

  const handleSubmitReviewWithNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewNoteTarget) return;
    setReviewNoteLoading(true);
    try {
      const isKanban = isKanbanItem(reviewNoteTarget);
      const kanbanTarget = reviewNoteTarget as KanbanItem;
      const dailyTarget = reviewNoteTarget as DailyActivity;
      const id = isKanban
        ? String(kanbanTarget.Plan_ID || kanbanTarget.No)
        : dailyTarget.Log_ID || String(dailyTarget.No);
      const res = await api.reviewItem(user.email, pin, {
        id,
        type: isKanban ? 'weekly' : 'daily',
        status: reviewNoteStatus,
        catatan: reviewNoteText.trim(),
      });
      if (res.status === 'success') {
        setReviewNoteModalOpen(false);
        onRefresh();
      } else {
        alert(res.message || 'Gagal menyimpan review.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setReviewNoteLoading(false);
    }
  };

  // Mentor add kanban task handlers
  const openNewKanban = () => {
    setKanbanForm({
      task: '',
      priority: 'Medium',
      status: 'To Do',
      dueDate: '',
      start: getTodayStr(),
      end: '',
      evidence: '',
    });
    setAssignedTo(new Set());
    setAssignedBy(new Set([user.nama]));
    setCustomAssigner('');
    setKanbanError('');
    setKanbanModalOpen(true);
  };

  const toggleAssignee = (userId: string) => {
    const next = new Set(assignedTo);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    setAssignedTo(next);
  };

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pesertaRef.current && !pesertaRef.current.contains(event.target as Node)) {
        setPesertaOpen(false);
      }
      if (assignerRef.current && !assignerRef.current.contains(event.target as Node)) {
        setAssignerOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleAllAssignees = () => {
    if (assignedTo.size === data.mentees.length) {
      setAssignedTo(new Set());
    } else {
      setAssignedTo(new Set(data.mentees.map(m => m.userId)));
    }
  };

  const toggleAssigner = (name: string) => {
    const next = new Set(assignedBy);
    const trimmed = name.trim();
    if (next.has(trimmed)) next.delete(trimmed);
    else next.add(trimmed);
    setAssignedBy(next);
  };

  const assignerOptions = useMemo(() => {
    const mentors = data.mentors || [];
    const base = mentors.length > 0 ? mentors : [{ userId: user.userId, nama: user.nama, divisi: user.divisi }];
    return base;
  }, [data.mentors, user]);

  const selectedAssignerLabels = useMemo(() => {
    const labels: string[] = [];
    assignerOptions.forEach(m => {
      if (assignedBy.has(m.nama)) labels.push(`${m.nama} ${m.nama === user.nama ? '(saya)' : ''}`.trim());
    });
    // Tampilkan juga custom assigner yang sudah masuk ke assignedBy
    assignedBy.forEach(name => {
      const isKnown = assignerOptions.some(m => m.nama === name);
      if (!isKnown) labels.push(name);
    });
    return labels;
  }, [assignedBy, assignerOptions, user.nama]);

  const selectedPesertaLabels = useMemo(() => {
    return data.mentees
      .filter(m => assignedTo.has(m.userId))
      .map(m => m.nama);
  }, [assignedTo, data.mentees]);

  const handleSaveKanban = async (e: React.FormEvent) => {
    e.preventDefault();
    setKanbanError('');
    if (!kanbanForm.task.trim()) {
      setKanbanError('Task wajib diisi.');
      return;
    }
    if (assignedTo.size === 0) {
      setKanbanError('Pilih minimal satu peserta yang ditugaskan.');
      return;
    }
    if (assignedBy.size === 0 && !customAssigner.trim()) {
      setKanbanError('Pilih minimal satu user yang menugaskan.');
      return;
    }

    setKanbanLoading(true);
    try {
      const assignedList = data.mentees
        .filter(m => assignedTo.has(m.userId))
        .map(m => ({ userId: m.userId, nama: m.nama }));

      const assignerList = Array.from(assignedBy);
      if (customAssigner.trim() && !assignedBy.has(customAssigner.trim())) {
        assignerList.push(customAssigner.trim());
      }

      const res = await api.saveKanban(user.email, pin, {
        task: kanbanForm.task.trim(),
        priority: kanbanForm.priority,
        status: kanbanForm.status,
        dueDate: kanbanForm.dueDate,
        start: kanbanForm.start,
        end: kanbanForm.end,
        evidence: kanbanForm.evidence.trim(),
        assignedTo: assignedList,
        assigners: assignerList,
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

  // SVG Donut calculation helpers
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  return (
    <div className="space-y-6">
      {/* Mentor Hero Card */}
      <section className="bg-white dark:bg-[#252526] rounded-2xl border border-slate-200/90 dark:border-[#2d2d2d] p-5 sm:p-7 shadow-xs transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-500 dark:text-[#858585] text-xs font-semibold uppercase tracking-wider">
              <span>PT. Shelter Indonesia Gemilang</span>
              <span>•</span>
              <span>{user.divisi}</span>
              <span>•</span>
              <span>{data.mentees.length} Peserta Bimbingan</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
              Portal Pembimbing Magang
            </h1>
            <p className="text-slate-500 dark:text-[#858585] text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
              Pantau laporan harian, grafik perkembangan, dan berikan arahan konstruktif untuk peserta bimbingan Anda.
            </p>
          </div>

          {totalPending > 0 && (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-50 dark:bg-[#342c15] border border-amber-200/80 dark:border-[#5a4d22] rounded-xl text-amber-900 dark:text-[#dcdcaa] text-xs font-medium self-start sm:self-center shadow-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>{totalPending} item menunggu tinjauan Anda</span>
            </div>
          )}
          {totalKanbanPending > 0 && (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-50 dark:bg-[#1e2733] border border-blue-200/80 dark:border-[#264f78] rounded-xl text-blue-900 dark:text-[#9cdcfe] text-xs font-medium self-start sm:self-center shadow-xs">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span>{totalKanbanPending} kanban menunggu review</span>
            </div>
          )}
        </div>

        {/* Mentee Selector Buttons */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-[#2d2d2d] flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-[#858585] mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter Peserta:
          </span>
          <button
            onClick={() => setSelectedMentee('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedMentee === 'all'
                ? 'bg-[#0b4e8c] dark:bg-[#0e639c] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-[#1e1e1e] hover:bg-slate-200/80 dark:hover:bg-[#2d2d2d] text-slate-700 dark:text-[#cccccc]'
            }`}
          >
            Semua ({data.mentees.length})
          </button>
          {data.mentees.map(m => (
            <button
              key={m.userId}
              onClick={() => setSelectedMentee(m.userId)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedMentee === m.userId
                  ? 'bg-[#0b4e8c] dark:bg-[#0e639c] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-[#1e1e1e] hover:bg-slate-200/80 dark:hover:bg-[#2d2d2d] text-slate-700 dark:text-[#cccccc]'
              }`}
            >
              {m.nama}
            </button>
          ))}
        </div>

        {/* Quiet Quick Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-100 dark:border-[#2d2d2d]">
          <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-[#1e2733] border border-blue-200/50 dark:border-[#264f78]">
            <span className="text-[11px] font-semibold text-[#0b4e8c] dark:text-[#9cdcfe] uppercase tracking-wider block">Total Log Masuk</span>
            <span className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">{totalLogs}</span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-[#1b3424] border border-emerald-200/50 dark:border-[#2e6040]">
            <span className="text-[11px] font-semibold text-emerald-800 dark:text-[#4ec9b0] uppercase tracking-wider block">Disetujui</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold text-emerald-900 dark:text-[#4ec9b0] font-mono">{approvedDailyCount}</span>
              <span className="text-xs text-emerald-700 dark:text-[#4ec9b0]/80">({approvalRate}%)</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-[#342c15] border border-amber-200/50 dark:border-[#5a4d22]">
            <span className="text-[11px] font-semibold text-amber-800 dark:text-[#dcdcaa] uppercase tracking-wider block">Butuh Review</span>
            <span className="text-xl font-bold text-amber-900 dark:text-[#dcdcaa] font-mono mt-0.5 block">{totalPending}</span>
          </div>

          <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-[#341b1d] border border-rose-200/50 dark:border-[#5c2427]">
            <span className="text-[11px] font-semibold text-rose-800 dark:text-[#f48771] uppercase tracking-wider block">Ada Kendala</span>
            <span className="text-xl font-bold text-rose-900 dark:text-[#f48771] font-mono mt-0.5 block">{logsWithObstacle.length}</span>
          </div>
        </div>
      </section>

      {/* Main Tabs Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#2d2d2d] pb-2">
        <nav className="flex space-x-6 sm:space-x-8">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-2.5 text-sm font-semibold transition-colors relative cursor-pointer flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'text-[#0b4e8c] dark:text-[#3794ff] border-b-2 border-[#0b4e8c] dark:border-[#3794ff]'
                : 'text-slate-500 dark:text-[#858585] hover:text-slate-800 dark:hover:text-[#cccccc]'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Grafik &amp; Analitik Laporan</span>
          </button>

          <button
            onClick={() => setActiveTab('daily')}
            className={`pb-2.5 text-sm font-semibold transition-colors relative cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'daily'
                ? 'text-[#0b4e8c] dark:text-[#3794ff] border-b-2 border-[#0b4e8c] dark:border-[#3794ff]'
                : 'text-slate-500 dark:text-[#858585] hover:text-slate-800 dark:hover:text-[#cccccc]'
            }`}
          >
            <span>Log Aktivitas ({filteredDaily.length})</span>
            {pendingDailyCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 dark:bg-[#342c15] text-amber-800 dark:text-[#dcdcaa] font-bold">
                {pendingDailyCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('weekly')}
            className={`pb-2.5 text-sm font-semibold transition-colors relative cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'weekly'
                ? 'text-[#0b4e8c] dark:text-[#3794ff] border-b-2 border-[#0b4e8c] dark:border-[#3794ff]'
                : 'text-slate-500 dark:text-[#858585] hover:text-slate-800 dark:hover:text-[#cccccc]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Kanban ({filteredWeekly.length})</span>
            {pendingWeeklyCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 dark:bg-[#342c15] text-amber-800 dark:text-[#dcdcaa] font-bold">
                {pendingWeeklyCount}
              </span>
            )}
          </button>
        </nav>

        {/* Filter status for tables */}
        {activeTab !== 'analytics' && (
          <div className="flex items-center gap-1.5 self-start sm:self-center">
            <span className="text-[11px] text-slate-400 dark:text-[#858585] font-medium">Status:</span>
            {['all', 'Menunggu', 'Disetujui', 'Revisi'].map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer ${
                  filterStatus === st
                    ? 'bg-[#0b4e8c] dark:bg-[#0e639c] text-white font-medium shadow-xs'
                    : 'text-slate-600 dark:text-[#858585] hover:bg-slate-100 dark:hover:bg-[#252526]'
                }`}
              >
                {st === 'all' ? 'Semua' : st}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: EYE-CATCHING CHARTS & ANALYTICS SECTION */}
      {/* ========================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Row 1: Activity Timeline Chart & Category Donut Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart 1: SVG Activity Trend Bar Chart (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-[#252526] rounded-3xl border border-slate-200/90 dark:border-[#2d2d2d] p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#0b4e8c] dark:text-[#3794ff]" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                        Tren Entri Logbook Aktivitas
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-[#858585] mt-0.5">
                      Distribusi harian logbook yang masuk (Disetujui, Menunggu, dan Revisi)
                    </p>
                  </div>
                  <span className="text-xs font-mono font-semibold text-[#0b4e8c] dark:text-[#9cdcfe] bg-blue-50 dark:bg-[#1e2733] border border-blue-200/60 dark:border-[#264f78] px-2.5 py-1 rounded-lg">
                    {timelineChartData.length} Tanggal Terakhir
                  </span>
                </div>

                {/* SVG Stacked Bar Chart */}
                {timelineChartData.length === 0 ? (
                  <div className="py-16 text-center text-xs text-slate-400 dark:text-[#858585]">
                    Belum ada data logbook untuk ditampilkan.
                  </div>
                ) : (
                  <div className="relative pt-4 pb-2">
                    {/* SVG Canvas */}
                    <div className="h-56 w-full flex items-end justify-between gap-2 sm:gap-4 px-2 border-b border-slate-200 dark:border-[#383838]">
                      {timelineChartData.map((item, idx) => {
                        const totalHeightPct = Math.min(100, Math.max(12, (item.total / maxTimelineTotal) * 100));
                        const approvedPct = item.total > 0 ? (item.approved / item.total) * 100 : 0;
                        const pendingPct = item.total > 0 ? (item.pending / item.total) * 100 : 0;
                        const revisionPct = item.total > 0 ? (item.revision / item.total) * 100 : 0;
                        const isHovered = hoveredBarIndex === idx;

                        return (
                          <div
                            key={item.date}
                            onMouseEnter={() => setHoveredBarIndex(idx)}
                            onMouseLeave={() => setHoveredBarIndex(null)}
                            className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                          >
                            {/* Floating Tooltip */}
                            {isHovered && (
                              <div className="absolute -top-12 z-20 bg-slate-900 dark:bg-[#181818] text-white text-[10px] rounded-lg py-1 px-2.5 shadow-lg pointer-events-none whitespace-nowrap border border-slate-700 dark:border-[#383838] animate-fade-in-up">
                                <span className="font-semibold">{item.date}</span>: {item.total} log ({item.approved} acc, {item.pending} wait, {item.revision} rev)
                              </div>
                            )}

                            {/* Number label on top of bar */}
                            <span className="text-[10px] font-mono text-slate-400 dark:text-[#858585] mb-1 font-semibold">
                              {item.total}
                            </span>

                            {/* Stacked Vertical Bar */}
                            <div
                              style={{ height: `${totalHeightPct}%` }}
                              className="w-full max-w-[36px] rounded-t-lg overflow-hidden flex flex-col justify-end transition-all duration-300 group-hover:scale-105 shadow-xs"
                            >
                              {/* Revision (top segment) */}
                              {revisionPct > 0 && (
                                <div
                                  style={{ height: `${revisionPct}%` }}
                                  className="bg-amber-400 dark:bg-[#cca700] w-full"
                                  title={`Revisi: ${item.revision}`}
                                />
                              )}
                              {/* Pending (middle segment) */}
                              {pendingPct > 0 && (
                                <div
                                  style={{ height: `${pendingPct}%` }}
                                  className="bg-[#0b4e8c] dark:bg-[#3794ff] w-full"
                                  title={`Menunggu: ${item.pending}`}
                                />
                              )}
                              {/* Approved (bottom segment) */}
                              {approvedPct > 0 && (
                                <div
                                  style={{ height: `${approvedPct}%` }}
                                  className="bg-emerald-500 dark:bg-[#4ec9b0] w-full"
                                  title={`Disetujui: ${item.approved}`}
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* X-axis labels */}
                    <div className="flex items-center justify-between gap-2 sm:gap-4 px-2 mt-2">
                      {timelineChartData.map((item) => (
                        <span
                          key={item.date}
                          className="flex-1 text-center text-[10px] font-mono text-slate-400 dark:text-[#858585] truncate"
                          title={item.date}
                        >
                          {item.date.slice(5)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Chart Legend */}
              <div className="pt-4 mt-2 border-t border-slate-100 dark:border-[#2d2d2d] flex flex-wrap items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 dark:bg-[#4ec9b0]" />
                  <span className="text-slate-600 dark:text-[#cccccc] text-[11px]">Disetujui ({approvedDailyCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#0b4e8c] dark:bg-[#3794ff]" />
                  <span className="text-slate-600 dark:text-[#cccccc] text-[11px]">Menunggu ({pendingDailyCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 dark:bg-[#cca700]" />
                  <span className="text-slate-600 dark:text-[#cccccc] text-[11px]">Revisi ({revisionDailyCount})</span>
                </div>
              </div>
            </div>

            {/* Chart 2: SVG Donut Category Breakdown (5 cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-[#252526] rounded-3xl border border-slate-200/90 dark:border-[#2d2d2d] p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-[#0b4e8c] dark:text-[#3794ff]" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                      Komposisi Kategori Aktivitas
                    </h3>
                  </div>
                </div>

                {categoryChartData.length === 0 ? (
                  <div className="py-16 text-center text-xs text-slate-400 dark:text-[#858585]">
                    Belum ada kategori tercatat.
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
                    {/* SVG Donut Graphic */}
                    <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r={radius}
                          fill="transparent"
                          stroke="currentColor"
                          strokeWidth="12"
                          className="text-slate-100 dark:text-[#1e1e1e]"
                        />

                        {/* Category slices */}
                        {categoryChartData.map((slice) => {
                          const strokeLength = (slice.pct / 100) * circumference;
                          const offset = -(accumulatedPercent / 100) * circumference;
                          accumulatedPercent += slice.pct;

                          return (
                            <circle
                              key={slice.name}
                              cx="50"
                              cy="50"
                              r={radius}
                              fill="transparent"
                              stroke={slice.color}
                              strokeWidth="12"
                              strokeDasharray={`${strokeLength} ${circumference}`}
                              strokeDashoffset={offset}
                              className="transition-all duration-500 hover:opacity-80"
                            />
                          );
                        })}
                      </svg>

                      {/* Center Info in Donut */}
                      <div className="absolute text-center">
                        <span className="text-lg font-bold text-slate-900 dark:text-white font-mono block leading-none">
                          {totalLogs}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-[#858585] mt-0.5 block">
                          Total Log
                        </span>
                      </div>
                    </div>

                    {/* Donut Legend */}
                    <div className="flex-1 w-full space-y-2">
                      {categoryChartData.map((cat) => (
                        <div key={cat.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 truncate pr-2">
                            <span
                              style={{ backgroundColor: cat.color }}
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                            />
                            <span className="font-medium text-slate-700 dark:text-[#cccccc] truncate text-[11px]">
                              {cat.name}
                            </span>
                          </div>
                          <span className="font-mono text-slate-500 dark:text-[#858585] font-semibold text-[11px] shrink-0">
                            {cat.count} ({cat.pct}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#2d2d2d] text-center">
                <span className="text-[11px] text-slate-400 dark:text-[#858585]">
                  Proporsi tugas mencerminkan ragam kompetensi peserta magang
                </span>
              </div>
            </div>
          </div>

          {/* Row 2: Mentee Performance Matrix & Obstacle Watchlist */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Mentee Performance Matrix (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-[#252526] rounded-3xl border border-slate-200/90 dark:border-[#2d2d2d] p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#0b4e8c] dark:text-[#3794ff]" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                      Matriks Kepatuhan &amp; Progres Peserta Bimbingan
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-[#858585] mt-0.5">
                    Tingkat persetujuan logbook dan aktivitas terbaru masing-masing peserta
                  </p>
                </div>
                <span className="text-xs text-slate-400 dark:text-[#858585] font-mono">
                  {menteePerformance.length} Peserta
                </span>
              </div>

              <div className="space-y-3.5">
                {menteePerformance.map((m) => (
                  <div
                    key={m.userId}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200/60 dark:border-[#2d2d2d] hover:border-[#0b4e8c]/30 dark:hover:border-[#383838] transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-xs font-semibold text-slate-900 dark:text-white">
                            {m.nama}
                          </strong>
                          <span className="text-[10px] font-mono text-slate-400 dark:text-[#858585] bg-white dark:bg-[#252526] px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-[#383838]">
                            {m.divisi}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-[#858585] block mt-0.5">
                          Aktif Terakhir: {m.lastActive} • {m.totalLogs} Log Harian • {m.totalWeekly} Target Mingguan
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {m.pendingReview > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-amber-800 dark:text-[#dcdcaa] bg-amber-50 dark:bg-[#342c15] border border-amber-200 dark:border-[#5a4d22] px-2 py-0.5 rounded">
                            <Clock className="w-3 h-3 text-amber-600 dark:text-[#cca700]" />
                            {m.pendingReview} Butuh Review
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-800 dark:text-[#4ec9b0] bg-emerald-50 dark:bg-[#1b3424] border border-emerald-200 dark:border-[#2e6040] px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-[#4ec9b0]" />
                            Lengkap
                          </span>
                        )}
                        <span className="text-xs font-mono font-bold text-slate-800 dark:text-white">
                          {m.rate}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar for Mentee */}
                    <div className="w-full h-2 bg-slate-200 dark:bg-[#2d2d2d] rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${m.rate}%` }}
                        className="h-full bg-emerald-500 dark:bg-[#4ec9b0] transition-all duration-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Obstacle Radar & Attention List (5 cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-[#252526] rounded-3xl border border-slate-200/90 dark:border-[#2d2d2d] p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-[#cca700]" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                      Radar Kendala &amp; Hambatan
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-semibold text-rose-800 dark:text-[#f48771] bg-rose-50 dark:bg-[#341b1d] border border-rose-200/60 dark:border-[#5c2427] px-2 py-0.5 rounded">
                    {logsWithObstacle.length} Laporan
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-[#858585] mb-3">
                  Aktivitas peserta yang mencatat adanya hambatan teknis dan memerlukan bimbingan mentor:
                </p>

                {logsWithObstacle.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 dark:text-[#858585] bg-slate-50 dark:bg-[#1e1e1e] rounded-2xl p-4 border border-dashed border-slate-200 dark:border-[#2d2d2d]">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                    <span>Tidak ada kendala yang dilaporkan. Semua proses berjalan lancar!</span>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {logsWithObstacle.slice(0, 4).map((item) => (
                      <div
                        key={item.Log_ID}
                        className="p-3 rounded-2xl bg-amber-50/60 dark:bg-[#342c15]/60 border border-amber-200/60 dark:border-[#5a4d22] text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-900 dark:text-white font-semibold">
                            {item.Nama_Peserta}
                          </strong>
                          <span className="text-[10px] font-mono text-slate-500 dark:text-[#858585]">
                            {item.Tanggal}
                          </span>
                        </div>
                        <p className="text-amber-950 dark:text-[#dcdcaa] italic leading-relaxed text-[11px]">
                          "{item.Kendala}"
                        </p>
                        <div className="pt-1 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 dark:text-[#858585]">
                            {item.Kategori}
                          </span>
                          <button
                            onClick={() =>
                              openReview(
                                item.Log_ID || String(item.No),
                                'daily',
                                item.Nama_Peserta || 'Peserta',
                                `Aktivitas Tanggal ${item.Date || item.Tanggal || ''}`,
                                item.Activities || item.Deskripsi_Aktivitas || '',
                                (item.Status as ItemStatus) || 'Menunggu',
                                item.Note || item.Catatan_Mentor || '',
                                item['Achieved Target Evidence'] || item.Output_Link,
                                item.Note || item.Kendala,
                                {
                                  date: getDailyDate(item),
                                  start: getDailyStart(item),
                                  end: getDailyEnd(item),
                                  duration: getDailyDuration(item),
                                  activitiesStatus: getDailyActivitiesStatus(item),
                                  targetDesc: getDailyTargetDesc(item),
                                  targetStatus: getDailyTargetStatus(item),
                                  note: getDailyNote(item),
                                }
                              )
                            }
                            className="text-[11px] font-semibold text-[#0b4e8c] dark:text-[#9cdcfe] hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>Beri Solusi</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#2d2d2d] flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 dark:text-[#858585]">
                  Pendampingan cepat mengurangi risiko keterlambatan proyek magang.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: DAILY ACTIVITIES SPREADSHEET VIEW */}
      {/* ========================================================= */}
      {activeTab === 'daily' && (
        <div className="space-y-4 animate-fade-in-up">
          <SpreadsheetDailyTable
            activities={filteredDaily}
            users={data.mentees}
            mentorMode={true}
            onReview={(item) =>
              openReview(
                item.Log_ID || String(item.No),
                'daily',
                item.Nama_Peserta || 'Peserta',
                `Aktivitas Tanggal ${item.Date || item.Tanggal}`,
                item.Activities || item.Deskripsi_Aktivitas || '',
                (item.Status as ItemStatus) || 'Menunggu',
                item.Note || item.Catatan_Mentor,
                item['Achieved Target Evidence'] || item.Output_Link,
                item.Note || item.Kendala,
                {
                  date: getDailyDate(item),
                  start: getDailyStart(item),
                  end: getDailyEnd(item),
                  duration: getDailyDuration(item),
                  activitiesStatus: getDailyActivitiesStatus(item),
                  targetDesc: getDailyTargetDesc(item),
                  targetStatus: getDailyTargetStatus(item),
                  note: getDailyNote(item),
                }
              )
            }
            sheetTabs={['Semua', ...data.mentees.map(m => m.nama)]}
            activeSheetTab={
              selectedMentee === 'all'
                ? 'Semua'
                : (data.mentees.find(m => m.userId === selectedMentee)?.nama || 'Semua')
            }
            onSelectSheetTab={(tab) => {
              if (tab === 'Semua') {
                setSelectedMentee('all');
              } else {
                const found = data.mentees.find(m => m.nama === tab);
                if (found) setSelectedMentee(found.userId);
              }
            }}
            showMenteeColumn={selectedMentee === 'all'}
            emptyMessage="Tidak ada baris aktivitas logbook yang sesuai dengan filter."
            onReviewWithNote={openReviewWithNote}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: KANBAN TABLE */}
      {/* ========================================================= */}
      {activeTab === 'weekly' && (
        <div className="space-y-4 animate-fade-in-up">
          <KanbanBoard
            items={filteredWeekly}
            users={data.mentees}
            currentUser={user}
            mentorMode={true}
            onAddNew={openNewKanban}
            onReview={(item) =>
              openReview(
                String(item.No || item.Plan_ID),
                'kanban',
                getKanbanPeserta(item, data.mentees),
                `Task: ${getKanbanTask(item)}`,
                getKanbanTask(item),
                (getKanbanReview(item) as ItemStatus) || 'Menunggu',
                getKanbanNotes(item),
                getKanbanEvidence(item),
                '',
                {
                  priority: getKanbanPriority(item),
                  kanbanStatus: getKanbanStatus(item),
                  dueDate: getKanbanDueDate(item),
                  kanbanStart: getKanbanStartDate(item),
                  kanbanEnd: getKanbanEndDate(item),
                  evidence: getKanbanEvidence(item),
                  assignedTo: getKanbanPeserta(item, data.mentees),
                  mentorName: user.nama,
                }
              )
            }
            onReviewWithNote={openReviewWithNote}
            sheetTabs={['Semua', ...data.mentees.map(m => m.nama)]}
            activeSheetTab={
              selectedMentee === 'all'
                ? 'Semua'
                : (data.mentees.find(m => m.userId === selectedMentee)?.nama || 'Semua')
            }
            onSelectSheetTab={(tab) => {
              if (tab === 'Semua') {
                setSelectedMentee('all');
              } else {
                const found = data.mentees.find(m => m.nama === tab);
                if (found) setSelectedMentee(found.userId);
              }
            }}
          />
        </div>
      )}

      {/* REVIEW MODAL — Print View Only */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Laporan Entri Peserta"
        subtitle={reviewTarget ? `${reviewTarget.peserta} — ${reviewTarget.title}` : ''}
      >
        {reviewTarget && (
          <div className="space-y-4 print:space-y-3" id="review-print-area">
            {/* Print Header */}
            <div className="hidden print:block mb-4 pb-3 border-b border-slate-200 dark:border-[#2d2d2d]">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Laporan {reviewTarget.type === 'kanban' ? 'Kanban Task' : 'Aktivitas Harian'}</h2>
              <p className="text-xs text-slate-500 dark:text-[#858585] mt-1">Dicetak pada {new Date().toLocaleString('id-ID')}</p>
              {reviewTarget.mentorName && (
                <p className="text-xs text-slate-500 dark:text-[#858585]">Mentor: {reviewTarget.mentorName}</p>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#383838] text-xs space-y-2">
              <span className="font-semibold text-slate-500 dark:text-[#858585] uppercase tracking-wider block text-[10px]">
                {reviewTarget.type === 'kanban' ? 'Deskripsi Task:' : 'Deskripsi Peserta:'}
              </span>
              <p className="text-slate-800 dark:text-[#cccccc] whitespace-pre-line leading-relaxed">{reviewTarget.content}</p>

              {reviewTarget.outputLink && (
                <div className="pt-2 border-t border-slate-200 dark:border-[#2d2d2d] flex items-center gap-1">
                  <span className="text-slate-500 dark:text-[#858585]">{reviewTarget.type === 'kanban' ? 'Evidence:' : 'Output:'}</span>
                  <a
                    href={
                      reviewTarget.outputLink.startsWith('http')
                        ? reviewTarget.outputLink
                        : `https://${reviewTarget.outputLink}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#0b4e8c] dark:text-[#9cdcfe] hover:underline font-mono break-all"
                  >
                    {reviewTarget.outputLink}
                  </a>
                </div>
              )}

              {reviewTarget.kendala && (
                <div className="pt-2 border-t border-slate-200 dark:border-[#2d2d2d] text-amber-900 dark:text-[#dcdcaa]">
                  <span className="font-semibold text-amber-950 dark:text-[#e3b341]">Kendala:</span> {reviewTarget.kendala}
                </div>
              )}
            </div>

            {reviewTarget.type === 'daily' && reviewTarget.date && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs print:grid-cols-4">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#383838]">
                  <span className="text-[10px] text-slate-400 dark:text-[#858585] block">Date</span>
                  <span className="font-medium text-slate-800 dark:text-[#cccccc]">{reviewTarget.date}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#383838]">
                  <span className="text-[10px] text-slate-400 dark:text-[#858585] block">Start</span>
                  <span className="font-mono text-slate-700 dark:text-[#cccccc]">{reviewTarget.start || '-'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#383838]">
                  <span className="text-[10px] text-slate-400 dark:text-[#858585] block">End</span>
                  <span className="font-mono text-slate-700 dark:text-[#cccccc]">{reviewTarget.end || '-'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#383838]">
                  <span className="text-[10px] text-slate-400 dark:text-[#858585] block">Duration</span>
                  <span className="font-mono text-slate-700 dark:text-[#cccccc]">{reviewTarget.duration !== '-' ? `${reviewTarget.duration} m` : '-'}</span>
                </div>
              </div>
            )}

            {reviewTarget.type === 'kanban' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs print:grid-cols-3">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#383838]">
                  <span className="text-[10px] text-slate-400 dark:text-[#858585] block">Priority</span>
                  <span className="font-medium text-slate-800 dark:text-[#cccccc]">{reviewTarget.priority || '-'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#383838]">
                  <span className="text-[10px] text-slate-400 dark:text-[#858585] block">Task Status</span>
                  <span className="font-medium text-slate-800 dark:text-[#cccccc]">{reviewTarget.kanbanStatus || '-'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#383838]">
                  <span className="text-[10px] text-slate-400 dark:text-[#858585] block">Due Date</span>
                  <span className="font-mono text-slate-700 dark:text-[#cccccc]">{reviewTarget.dueDate || '-'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#383838]">
                  <span className="text-[10px] text-slate-400 dark:text-[#858585] block">Start</span>
                  <span className="font-mono text-slate-700 dark:text-[#cccccc]">{reviewTarget.kanbanStart || '-'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#383838]">
                  <span className="text-[10px] text-slate-400 dark:text-[#858585] block">End</span>
                  <span className="font-mono text-slate-700 dark:text-[#cccccc]">{reviewTarget.kanbanEnd || '-'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#383838]">
                  <span className="text-[10px] text-slate-400 dark:text-[#858585] block">Assigned To</span>
                  <span className="font-medium text-slate-800 dark:text-[#cccccc]">{reviewTarget.assignedTo || '-'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#383838]">
                  <span className="text-[10px] text-slate-400 dark:text-[#858585] block">Notes Review</span>
                  <span className="font-medium text-slate-800 dark:text-[#cccccc]">{reviewNote || reviewTarget.catatan || '-'}</span>
                </div>
              </div>
            )}

            {reviewTarget.type === 'daily' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#383838]">
                  <span className="text-[10px] text-slate-400 dark:text-[#858585] block">Activities Status</span>
                  <span className="font-medium text-slate-800 dark:text-[#cccccc]">{reviewTarget.activitiesStatus || '-'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#383838]">
                  <span className="text-[10px] text-slate-400 dark:text-[#858585] block">Target Status</span>
                  <span className="font-medium text-slate-800 dark:text-[#cccccc]">{reviewTarget.targetStatus || '-'}</span>
                </div>
              </div>
            )}

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#383838] text-xs">
              <span className="text-[10px] text-slate-400 dark:text-[#858585] block mb-1">Status Review</span>
              <StatusBadge status={reviewTarget.currentStatus} size="sm" />
            </div>

            {(reviewTarget.note || reviewNote || reviewTarget.catatan) && (
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#383838] text-xs">
                <span className="text-[10px] text-slate-400 dark:text-[#858585] block mb-1">Catatan Mentor</span>
                <p className="text-slate-800 dark:text-[#cccccc] whitespace-pre-line">{reviewNote || reviewTarget.note || reviewTarget.catatan}</p>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2 print:hidden">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-[#858585] hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#0b4e8c] hover:bg-[#083b6b] dark:bg-[#0e639c] dark:hover:bg-[#1177bb] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak / PDF
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* REVIEW WITH NOTE MODAL */}
      <Modal
        isOpen={reviewNoteModalOpen}
        onClose={() => setReviewNoteModalOpen(false)}
        title="Review & Catatan"
        subtitle={reviewNoteTarget ? (
          'Log_ID' in reviewNoteTarget || 'No' in reviewNoteTarget
            ? `${(reviewNoteTarget as DailyActivity).Nama_Peserta || 'Peserta'} — Aktivitas ${getDailyDate(reviewNoteTarget as DailyActivity)}`
            : `Task: ${getKanbanTask(reviewNoteTarget as KanbanItem)}`
        ) : ''}
      >
        {reviewNoteTarget && (
          <form onSubmit={handleSubmitReviewWithNote} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1.5">Status Review</label>
              <select
                value={reviewNoteStatus}
                onChange={e => setReviewNoteStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-white dark:bg-[#1e1e1e] text-slate-900 dark:text-white"
              >
                {['Menunggu', 'Disetujui', 'Revisi', 'Ditolak'].map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">
                Catatan / Feedback <span className="text-slate-400 dark:text-[#858585] font-normal">(opsional)</span>
              </label>
              <textarea
                rows={4}
                placeholder={
                  reviewNoteStatus === 'Revisi'
                    ? 'Jelaskan apa yang perlu diperbaiki...'
                    : reviewNoteStatus === 'Ditolak'
                    ? 'Jelaskan alasan penolakan...'
                    : 'Tulis apresiasi, saran, atau catatan untuk peserta...'
                }
                value={reviewNoteText}
                onChange={e => setReviewNoteText(e.target.value)}
                className="w-full p-3 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-white dark:bg-[#1e1e1e] text-slate-900 dark:text-white leading-relaxed"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReviewNoteModalOpen(false)}
                className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-[#858585] hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={reviewNoteLoading}
                className="px-4 py-2 bg-[#0b4e8c] hover:bg-[#083b6b] dark:bg-[#0e639c] dark:hover:bg-[#1177bb] disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                {reviewNoteLoading ? 'Menyimpan...' : 'Simpan Review'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* MENTOR ADD KANBAN TASK MODAL */}
      <Modal
        isOpen={kanbanModalOpen}
        onClose={() => setKanbanModalOpen(false)}
        title="Tambah Task Kanban"
        subtitle="Tugaskan ke satu atau beberapa peserta bimbingan"
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">Priority</label>
              <select
                value={kanbanForm.priority}
                onChange={e => setKanbanForm({ ...kanbanForm, priority: e.target.value as KanbanPriority })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-white dark:bg-[#1e1e1e] text-slate-900 dark:text-white font-semibold"
              >
                {KANBAN_PRIORITY_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">Status</label>
              <select
                value={kanbanForm.status}
                onChange={e => {
                  const newStatus = e.target.value as KanbanStatus;
                  const updated = { ...kanbanForm, status: newStatus };
                  if (newStatus === 'Done' && !kanbanForm.end) {
                    updated.end = getTodayStr();
                  }
                  setKanbanForm(updated);
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-white dark:bg-[#1e1e1e] text-slate-900 dark:text-white font-semibold"
              >
                {KANBAN_STATUS_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">Due Date</label>
              <input
                type="date"
                value={kanbanForm.dueDate.includes('-') && kanbanForm.dueDate.length === 10 ? kanbanForm.dueDate : ''}
                onChange={e => setKanbanForm({ ...kanbanForm, dueDate: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-slate-50/50 dark:bg-[#1e1e1e] text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">Start Date</label>
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
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">Evidence</label>
            <input
              type="text"
              placeholder="https://drive.google.com/... atau link dokumen"
              value={kanbanForm.evidence}
              onChange={e => setKanbanForm({ ...kanbanForm, evidence: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-slate-50/50 dark:bg-[#1e1e1e] text-slate-900 dark:text-white font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Dropdown Peserta */}
            <div className="relative" ref={pesertaRef}>
              <label className="block text-sm font-semibold text-slate-700 dark:text-[#d4d4d4] mb-2">
                Ditugaskan Ke (Peserta) <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setPesertaOpen(o => !o)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-[#383838] bg-white dark:bg-[#1e1e1e] text-slate-700 dark:text-[#cccccc] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc]"
              >
                <span className="truncate">
                  {selectedPesertaLabels.length > 0
                    ? `${selectedPesertaLabels.length} peserta dipilih`
                    : 'Pilih peserta...'}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${pesertaOpen ? 'rotate-180' : ''}`} />
              </button>
              {pesertaOpen && (
                <div className="absolute z-30 mt-1.5 w-full border border-slate-200 dark:border-[#383838] rounded-xl bg-white dark:bg-[#1e1e1e] shadow-xl max-h-[min(24rem,60vh)] overflow-y-auto" style={{ maxHeight: 'min(24rem, 60vh)' }}>
                  <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 dark:text-[#d4d4d4] px-3.5 py-2.5 border-b border-slate-200 dark:border-[#383838] cursor-pointer sticky top-0 bg-white dark:bg-[#1e1e1e]">
                    <input
                      type="checkbox"
                      checked={assignedTo.size === data.mentees.length && data.mentees.length > 0}
                      onChange={toggleAllAssignees}
                      className="rounded border-slate-300 text-[#0b4e8c] focus:ring-[#0b4e8c] w-4 h-4"
                    />
                    Pilih Semua ({data.mentees.length} Peserta)
                  </label>
                  {data.mentees.map(m => (
                    <label key={m.userId} className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-[#cccccc] px-3.5 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#252526]">
                      <input
                        type="checkbox"
                        checked={assignedTo.has(m.userId)}
                        onChange={() => toggleAssignee(m.userId)}
                        className="rounded border-slate-300 text-[#0b4e8c] focus:ring-[#0b4e8c] w-4 h-4"
                      />
                      <span>{m.nama}</span>
                      <span className="text-xs text-slate-400 dark:text-[#858585]">({m.divisi})</span>
                    </label>
                  ))}
                  {/* Sentinel agar item paling bawah tidak terpotong oleh padding modal */}
                  <div className="h-4" />
                </div>
              )}
              {selectedPesertaLabels.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedPesertaLabels.map(name => (
                    <span key={name} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-[#1e2733] text-xs text-[#0b4e8c] dark:text-[#9cdcfe] border border-blue-200 dark:border-[#264f78]">
                      {name}
                      <button
                        type="button"
                        onClick={() => {
                          const m = data.mentees.find(x => x.nama === name);
                          if (m) toggleAssignee(m.userId);
                        }}
                        className="hover:text-rose-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Dropdown User yang Menugaskan */}
            <div className="relative" ref={assignerRef}>
              <label className="block text-sm font-semibold text-slate-700 dark:text-[#d4d4d4] mb-2">
                User yang Menugaskan <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setAssignerOpen(o => !o)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-[#383838] bg-white dark:bg-[#1e1e1e] text-slate-700 dark:text-[#cccccc] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc]"
              >
                <span className="truncate">
                  {selectedAssignerLabels.length > 0
                    ? selectedAssignerLabels.join(', ')
                    : 'Pilih user...'}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${assignerOpen ? 'rotate-180' : ''}`} />
              </button>
              {assignerOpen && (
                <div className="absolute z-30 mt-1.5 w-full border border-slate-200 dark:border-[#383838] rounded-xl bg-white dark:bg-[#1e1e1e] shadow-xl max-h-[min(24rem,60vh)] overflow-y-auto" style={{ maxHeight: 'min(24rem, 60vh)' }}>
                  {assignerOptions.map(m => (
                    <label key={`assigner-${m.userId}`} className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-[#cccccc] px-3.5 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#252526]">
                      <input
                        type="checkbox"
                        checked={assignedBy.has(m.nama)}
                        onChange={() => toggleAssigner(m.nama)}
                        className="rounded border-slate-300 text-[#0b4e8c] focus:ring-[#0b4e8c] w-4 h-4"
                      />
                      <span>{m.nama}</span>
                      {m.nama === user.nama && <span className="text-xs text-slate-400 dark:text-[#858585]">(saya)</span>}
                      {m.nama !== user.nama && <span className="text-xs text-slate-400 dark:text-[#858585]">({m.divisi})</span>}
                    </label>
                  ))}
                  <div className="px-3.5 py-3 border-t border-slate-200 dark:border-[#383838]">
                    <label className="block text-xs font-medium text-slate-500 dark:text-[#858585] mb-1.5">Atau isi manual</label>
                    <input
                      type="text"
                      placeholder="Nama user lain..."
                      value={customAssigner}
                      onChange={e => setCustomAssigner(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && customAssigner.trim()) {
                          e.preventDefault();
                          toggleAssigner(customAssigner.trim());
                          setCustomAssigner('');
                        }
                      }}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#383838] bg-slate-50 dark:bg-[#252526] text-slate-700 dark:text-[#cccccc] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c]"
                    />
                      <button
                        type="button"
                        onClick={() => {
                          const trimmed = customAssigner.trim();
                          if (trimmed) {
                            toggleAssigner(trimmed);
                            setCustomAssigner('');
                          }
                        }}
                        disabled={!customAssigner.trim()}
                        className="mt-2 w-full px-3 py-1.5 text-xs font-medium rounded-lg bg-[#0b4e8c] disabled:bg-slate-300 dark:disabled:bg-[#383838] text-white cursor-pointer"
                      >
                        Tambah User Manual
                      </button>
                  </div>
                  {/* Sentinel agar item paling bawah tidak terpotong oleh padding modal */}
                  <div className="h-4" />
                </div>
              )}
              {selectedAssignerLabels.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedAssignerLabels.map(name => (
                    <span key={name} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-[#1b3424] text-xs text-emerald-800 dark:text-[#4ec9b0] border border-emerald-200 dark:border-[#2e6040]">
                      {name}
                      <button
                        type="button"
                        onClick={() => {
                          if (assignedBy.has(name)) toggleAssigner(name);
                          else if (customAssigner.trim() === name) setCustomAssigner('');
                        }}
                        className="hover:text-rose-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
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
              {kanbanLoading ? 'Menyimpan...' : 'Tambah Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
