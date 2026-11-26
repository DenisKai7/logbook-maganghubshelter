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
  getDailyMenteeName,
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
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | 'all'>('7d');

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

  // Tab & review status filtered lists
  const filteredDaily = useMemo(() => {
    return menteeDaily.filter(d => {
      if (filterStatus !== 'all') {
        const rev = getDailyStatusReview(d);
        return rev.toLowerCase() === filterStatus.toLowerCase();
      }
      return true;
    });
  }, [menteeDaily, filterStatus]);

  const filteredWeekly = useMemo(() => {
    return menteeWeekly.filter(w => {
      if (filterStatus !== 'all') {
        const rev = getKanbanReview(w);
        return rev.toLowerCase() === filterStatus.toLowerCase();
      }
      return true;
    });
  }, [menteeWeekly, filterStatus]);

  // Key KPI numbers per dataset
  const dailyTotal = menteeDaily.length;
  const approvedDailyCount = useMemo(() => menteeDaily.filter(d => getDailyStatusReview(d) === 'Disetujui').length, [menteeDaily]);
  const pendingDailyCount = useMemo(() => menteeDaily.filter(d => getDailyStatusReview(d) === 'Menunggu').length, [menteeDaily]);
  const revisionDailyCount = useMemo(() => menteeDaily.filter(d => getDailyStatusReview(d) === 'Revisi').length, [menteeDaily]);
  const dailyRate = dailyTotal > 0 ? (approvedDailyCount / dailyTotal) * 100 : 0;
  const dailyRateStr = dailyRate % 1 === 0 ? dailyRate.toFixed(0) : dailyRate.toFixed(1).replace('.', ',');

  const kanbanTotal = menteeWeekly.length;
  const approvedWeeklyCount = useMemo(() => menteeWeekly.filter(w => getKanbanReview(w) === 'Disetujui').length, [menteeWeekly]);
  const pendingWeeklyCount = useMemo(() => menteeWeekly.filter(w => getKanbanReview(w) === 'Menunggu').length, [menteeWeekly]);
  const revisionWeeklyCount = useMemo(() => menteeWeekly.filter(w => getKanbanReview(w) === 'Revisi').length, [menteeWeekly]);
  const kanbanRate = kanbanTotal > 0 ? (approvedWeeklyCount / kanbanTotal) * 100 : 0;
  const kanbanRateStr = kanbanRate % 1 === 0 ? kanbanRate.toFixed(0) : kanbanRate.toFixed(1).replace('.', ',');

  const totalLogs = dailyTotal;
  const totalPending = pendingDailyCount + pendingWeeklyCount;
  const totalKanbanPending = pendingWeeklyCount;
  const approvalRate = Math.round(dailyRate);

  // Obstacle checks matching user specification:
  // "nilai di dalam ada kendala hanya akan muncul jika status pada log aktivitas peserta 'cancelled' atau 'rescheduled' dan status reviewnya masih 'menunggu', untuk kanban ketika statusnya 'canceled' dan reviewnya 'menunggu'."
  const isDailyObstacle = (d: DailyActivity) => {
    const rev = getDailyStatusReview(d);
    if (rev !== 'Menunggu') return false;
    const act = (getDailyActivitiesStatus(d) || '').trim().toLowerCase();
    return act === 'cancelled' || act === 'rescheduled' || act === 'reschedule' || act === 'canceled';
  };
  const dailyObstacleCount = useMemo(() => menteeDaily.filter(isDailyObstacle).length, [menteeDaily]);

  const isKanbanObstacle = (k: KanbanItem) => {
    const rev = getKanbanReview(k);
    if (rev !== 'Menunggu') return false;
    const st = (getKanbanStatus(k) || String(k.Status || '')).trim().toLowerCase();
    return st === 'canceled' || st === 'cancelled' || st === 'rescheduled' || st === 'reschedule';
  };
  const kanbanObstacleCount = useMemo(() => menteeWeekly.filter(isKanbanObstacle).length, [menteeWeekly]);

  // Combined obstacle list for Radar Kendala & Hambatan (Image 7)
  const obstacleList = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'daily' | 'kanban';
      peserta: string;
      date: string;
      status: string;
      title: string;
      note: string;
      item: DailyActivity | KanbanItem;
    }> = [];

    menteeDaily.forEach(d => {
      const act = (getDailyActivitiesStatus(d) || '').trim().toLowerCase();
      const isKendala = act === 'cancelled' || act === 'rescheduled' || act === 'reschedule' || act === 'canceled';
      if (isKendala) {
        list.push({
          id: d.Log_ID || String(d.No),
          type: 'daily',
          peserta: d.Nama_Peserta || getDailyMenteeName(d, data.mentees),
          date: getDailyDate(d),
          status: getDailyActivitiesStatus(d),
          title: getDailyActivities(d),
          note: getDailyNote(d) !== '-' ? getDailyNote(d) : (d.Kendala || `Status aktivitas diubah ke ${getDailyActivitiesStatus(d)}`),
          item: d,
        });
      }
    });

    menteeWeekly.forEach(k => {
      const st = (getKanbanStatus(k) || String(k.Status || '')).trim().toLowerCase();
      const isKendala = st === 'canceled' || st === 'cancelled' || st === 'rescheduled' || st === 'reschedule';
      if (isKendala) {
        list.push({
          id: String(k.Plan_ID || k.No),
          type: 'kanban',
          peserta: getKanbanPeserta(k, data.mentees),
          date: getKanbanDueDate(k),
          status: getKanbanStatus(k),
          title: getKanbanTask(k),
          note: getKanbanNotes(k) || `Status task kanban diubah ke ${getKanbanStatus(k)}`,
          item: k,
        });
      }
    });

    return list;
  }, [menteeDaily, menteeWeekly, data.mentees]);

  // Legacy alias for compatibility
  const logsWithObstacle = obstacleList;

  // Timeline / Trend Bar Chart Data with Daily + Kanban bars & Timeframe Filter (Requirement 4 / Image 5)
  const timelineChartData = useMemo(() => {
    const dateMap: Record<string, {
      date: string;
      dailyTotal: number;
      dailyApproved: number;
      dailyPending: number;
      dailyRevision: number;
      kanbanTotal: number;
      kanbanApproved: number;
      kanbanPending: number;
      kanbanRevision: number;
      total: number;
    }> = {};

    const now = new Date();
    const getLimitDate = () => {
      if (timeframe === '24h') {
        const d = new Date(now);
        d.setDate(d.getDate() - 1);
        return d;
      }
      if (timeframe === '7d') {
        const d = new Date(now);
        d.setDate(d.getDate() - 7);
        return d;
      }
      if (timeframe === '30d') {
        const d = new Date(now);
        d.setDate(d.getDate() - 30);
        return d;
      }
      return null;
    };
    const limitDate = getLimitDate();

    const isDateWithin = (rawDateStr?: string) => {
      if (!limitDate || !rawDateStr || rawDateStr === 'Tanpa Tanggal') return true;
      const parsed = new Date(rawDateStr);
      if (isNaN(parsed.getTime())) return true;
      return parsed >= limitDate;
    };

    // Aggregate Daily Activities
    menteeDaily.forEach(d => {
      const date = getDailyDate(d) || 'Tanpa Tanggal';
      if (!isDateWithin(date)) return;
      if (!dateMap[date]) {
        dateMap[date] = {
          date,
          dailyTotal: 0,
          dailyApproved: 0,
          dailyPending: 0,
          dailyRevision: 0,
          kanbanTotal: 0,
          kanbanApproved: 0,
          kanbanPending: 0,
          kanbanRevision: 0,
          total: 0
        };
      }
      dateMap[date].dailyTotal += 1;
      dateMap[date].total += 1;
      const rev = getDailyStatusReview(d);
      if (rev === 'Disetujui') dateMap[date].dailyApproved += 1;
      else if (rev === 'Revisi') dateMap[date].dailyRevision += 1;
      else dateMap[date].dailyPending += 1;
    });

    // Aggregate Kanban Items
    menteeWeekly.forEach(k => {
      let date = getKanbanStartDate(k);
      if (date === '-') date = getKanbanDueDate(k);
      if (date === '-') date = k.Tanggal_Input || 'Tanpa Tanggal';
      if (!isDateWithin(date)) return;
      if (!dateMap[date]) {
        dateMap[date] = {
          date,
          dailyTotal: 0,
          dailyApproved: 0,
          dailyPending: 0,
          dailyRevision: 0,
          kanbanTotal: 0,
          kanbanApproved: 0,
          kanbanPending: 0,
          kanbanRevision: 0,
          total: 0
        };
      }
      dateMap[date].kanbanTotal += 1;
      dateMap[date].total += 1;
      const rev = getKanbanReview(k);
      if (rev === 'Disetujui') dateMap[date].kanbanApproved += 1;
      else if (rev === 'Revisi') dateMap[date].kanbanRevision += 1;
      else dateMap[date].kanbanPending += 1;
    });

    const entries = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
    if (timeframe === '24h') return entries.slice(-2);
    if (timeframe === '7d') return entries.slice(-7);
    if (timeframe === '30d') return entries.slice(-30);
    return entries;
  }, [menteeDaily, menteeWeekly, timeframe]);

  const maxTimelineTotal = useMemo(() => {
    return Math.max(
      ...timelineChartData.map(d => Math.max(d.dailyTotal, d.kanbanTotal)),
      4
    );
  }, [timelineChartData]);

  // Division Distribution for Donut Chart (Requirement 5 / Image 6)
  const divisionChartData = useMemo(() => {
    const map: Record<string, { count: number; daily: number; kanban: number }> = {};
    
    // Group Daily Activities by Mentee's Divisi
    menteeDaily.forEach(d => {
      const mentee = data.mentees.find(m => m.userId === d.User_ID || (d.Nama_Peserta && m.nama.toLowerCase().includes(d.Nama_Peserta.toLowerCase())));
      const div = mentee?.divisi || user.divisi || 'Umum';
      if (!map[div]) map[div] = { count: 0, daily: 0, kanban: 0 };
      map[div].count += 1;
      map[div].daily += 1;
    });

    // Group Kanban items by Mentee's Divisi
    menteeWeekly.forEach(k => {
      const pName = getKanbanPeserta(k, data.mentees);
      const mentee = data.mentees.find(m => m.userId === k.User_ID || (pName && m.nama.toLowerCase().includes(pName.toLowerCase())));
      const div = mentee?.divisi || user.divisi || 'Umum';
      if (!map[div]) map[div] = { count: 0, daily: 0, kanban: 0 };
      map[div].count += 1;
      map[div].kanban += 1;
    });

    const totalActiveActions = Object.values(map).reduce((acc, v) => acc + v.count, 0);

    const PALETTE = ['#0b4e8c', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'];

    return Object.entries(map).map(([name, val], idx) => {
      const pct = totalActiveActions > 0 ? Math.round((val.count / totalActiveActions) * 100) : 0;
      return {
        name,
        count: val.count,
        daily: val.daily,
        kanban: val.kanban,
        pct,
        color: PALETTE[idx % PALETTE.length]
      };
    }).sort((a, b) => b.count - a.count);
  }, [menteeDaily, menteeWeekly, data.mentees, user.divisi]);

  const totalDivisionEntries = useMemo(() => {
    return divisionChartData.reduce((acc, c) => acc + c.count, 0);
  }, [divisionChartData]);

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

        {/* Quick Metrics Ribbon (Dynamically adjusts based on activeTab: Analytics = combined, Daily = Daily only, Kanban = Kanban only) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-100 dark:border-[#2d2d2d]">
          {/* Card 1: Total Log Masuk */}
          <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-[#1e2733] border border-blue-200/50 dark:border-[#264f78]">
            <span className="text-[11px] font-semibold text-[#0b4e8c] dark:text-[#9cdcfe] uppercase tracking-wider block">Total Log Masuk</span>
            {activeTab === 'analytics' ? (
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-mono mt-1 block">
                Log Aktivitas {dailyTotal} <span className="text-slate-400 dark:text-[#858585] font-normal">|</span> Kanban {kanbanTotal}
              </span>
            ) : activeTab === 'daily' ? (
              <span className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">{dailyTotal}</span>
            ) : (
              <span className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">{kanbanTotal}</span>
            )}
          </div>

          {/* Card 2: Disetujui */}
          <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-[#1b3424] border border-emerald-200/50 dark:border-[#2e6040]">
            <span className="text-[11px] font-semibold text-emerald-800 dark:text-[#4ec9b0] uppercase tracking-wider block">Disetujui</span>
            {activeTab === 'analytics' ? (
              <span className="text-xs sm:text-sm font-bold text-emerald-900 dark:text-[#4ec9b0] font-mono mt-1 block">
                Log Aktivitas {approvedDailyCount} ({dailyRateStr}%) <span className="text-emerald-700/60 dark:text-[#4ec9b0]/60 font-normal">|</span> Kanban {approvedWeeklyCount} ({kanbanRateStr}%)
              </span>
            ) : activeTab === 'daily' ? (
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-bold text-emerald-900 dark:text-[#4ec9b0] font-mono">{approvedDailyCount}</span>
                <span className="text-xs text-emerald-700 dark:text-[#4ec9b0]/80">({dailyRateStr}%)</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-bold text-emerald-900 dark:text-[#4ec9b0] font-mono">{approvedWeeklyCount}</span>
                <span className="text-xs text-emerald-700 dark:text-[#4ec9b0]/80">({kanbanRateStr}%)</span>
              </div>
            )}
          </div>

          {/* Card 3: Butuh Review */}
          <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-[#342c15] border border-amber-200/50 dark:border-[#5a4d22]">
            <span className="text-[11px] font-semibold text-amber-800 dark:text-[#dcdcaa] uppercase tracking-wider block">Butuh Review</span>
            {activeTab === 'analytics' ? (
              <span className="text-xs sm:text-sm font-bold text-amber-900 dark:text-[#dcdcaa] font-mono mt-1 block">
                Log Aktivitas {pendingDailyCount} <span className="text-amber-700/60 dark:text-[#dcdcaa]/60 font-normal">|</span> Kanban {pendingWeeklyCount}
              </span>
            ) : activeTab === 'daily' ? (
              <span className="text-xl font-bold text-amber-900 dark:text-[#dcdcaa] font-mono mt-0.5 block">{pendingDailyCount}</span>
            ) : (
              <span className="text-xl font-bold text-amber-900 dark:text-[#dcdcaa] font-mono mt-0.5 block">{pendingWeeklyCount}</span>
            )}
          </div>

          {/* Card 4: Ada Kendala */}
          <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-[#341b1d] border border-rose-200/50 dark:border-[#5c2427]">
            <span className="text-[11px] font-semibold text-rose-800 dark:text-[#f48771] uppercase tracking-wider block">Ada Kendala</span>
            {activeTab === 'analytics' ? (
              <span className="text-xs sm:text-sm font-bold text-rose-900 dark:text-[#f48771] font-mono mt-1 block">
                Log Aktivitas {dailyObstacleCount} <span className="text-rose-700/60 dark:text-[#f48771]/60 font-normal">|</span> Kanban {kanbanObstacleCount}
              </span>
            ) : activeTab === 'daily' ? (
              <span className="text-xl font-bold text-rose-900 dark:text-[#f48771] font-mono mt-0.5 block">{dailyObstacleCount}</span>
            ) : (
              <span className="text-xl font-bold text-rose-900 dark:text-[#f48771] font-mono mt-0.5 block">{kanbanObstacleCount}</span>
            )}
          </div>
        </div>
      </section>

      {/* Main Tabs Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#2d2d2d] pb-2">
        <nav className="flex space-x-6 sm:space-x-8">
          <button
            onClick={() => { setActiveTab('analytics'); setFilterStatus('all'); }}
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
            onClick={() => { setActiveTab('daily'); setFilterStatus('all'); }}
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
            onClick={() => { setActiveTab('weekly'); setFilterStatus('all'); }}
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

        {/* Filter Review for tables (Requirement 7 / Image 8) */}
        {activeTab !== 'analytics' && (
          <div className="flex items-center gap-1.5 self-start sm:self-center overflow-x-auto max-w-full pb-1 sm:pb-0">
            <span className="text-[11px] text-slate-400 dark:text-[#858585] font-medium flex items-center gap-1">
              <Filter className="w-3 h-3" /> Review:
            </span>
            {(activeTab === 'daily'
              ? ['all', 'Menunggu', 'Revisi', 'Ditolak', 'Disetujui']
              : ['all', 'Ditugaskan', 'Menunggu', 'Revisi', 'Ditolak', 'Disetujui']
            ).map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer whitespace-nowrap ${
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
            {/* Chart 1: SVG 2-Bar Activity & Kanban Trend (7 cols) (Requirement 4 / Image 5) */}
            <div className="lg:col-span-7 bg-white dark:bg-[#252526] rounded-3xl border border-slate-200/90 dark:border-[#2d2d2d] p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#0b4e8c] dark:text-[#3794ff]" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                        Tren Entri Logbook Aktivitas &amp; Kanban
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-[#858585] mt-0.5">
                      Perbandingan harian entri logbook aktivitas (biru) dan tugas kanban (ungu)
                    </p>
                  </div>
                  {/* Timeframe Filter Buttons */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#1e1e1e] p-1 rounded-xl border border-slate-200 dark:border-[#383838]">
                    {(['24h', '7d', '30d', 'all'] as const).map(tf => (
                      <button
                        key={tf}
                        type="button"
                        onClick={() => setTimeframe(tf)}
                        className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          timeframe === tf
                            ? 'bg-[#0b4e8c] dark:bg-[#0e639c] text-white shadow-xs'
                            : 'text-slate-600 dark:text-[#858585] hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {tf === '24h' ? '24 Jam' : tf === '7d' ? '7 Hari' : tf === '30d' ? '30 Hari' : 'Semua'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SVG 2-Bar Chart */}
                {timelineChartData.length === 0 ? (
                  <div className="py-16 text-center text-xs text-slate-400 dark:text-[#858585]">
                    Belum ada data aktivitas atau kanban pada rentang waktu ini.
                  </div>
                ) : (
                  <div className="relative pt-4 pb-2">
                    <div className="h-56 w-full flex items-end justify-between gap-2 sm:gap-3 px-2 border-b border-slate-200 dark:border-[#383838]">
                      {timelineChartData.map((item, idx) => {
                        const dailyHeightPct = item.dailyTotal > 0 ? Math.min(100, Math.max(8, (item.dailyTotal / maxTimelineTotal) * 100)) : 0;
                        const kanbanHeightPct = item.kanbanTotal > 0 ? Math.min(100, Math.max(8, (item.kanbanTotal / maxTimelineTotal) * 100)) : 0;
                        const isHovered = hoveredBarIndex === idx;

                        return (
                          <div
                            key={item.date}
                            onMouseEnter={() => setHoveredBarIndex(idx)}
                            onMouseLeave={() => setHoveredBarIndex(null)}
                            className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative min-w-[28px]"
                          >
                            {/* Floating Tooltip */}
                            {isHovered && (
                              <div className="absolute -top-14 z-20 bg-slate-900 dark:bg-[#181818] text-white text-[10px] rounded-lg py-1.5 px-3 shadow-lg pointer-events-none whitespace-nowrap border border-slate-700 dark:border-[#383838] animate-fade-in-up">
                                <span className="font-semibold block mb-0.5">{item.date}</span>
                                <span className="text-sky-300 block">Log Aktivitas: {item.dailyTotal} ({item.dailyApproved} acc, {item.dailyPending} wait, {item.dailyRevision} rev)</span>
                                <span className="text-purple-300 block">Kanban: {item.kanbanTotal} ({item.kanbanApproved} acc, {item.kanbanPending} wait, {item.kanbanRevision} rev)</span>
                              </div>
                            )}

                            {/* 2 Bars Side by Side */}
                            <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full">
                              {/* Bar 1: Daily Activity (Blue) */}
                              <div className="flex-1 max-w-[18px] flex flex-col items-center justify-end h-full">
                                {item.dailyTotal > 0 && (
                                  <span className="text-[9px] font-mono text-[#0b4e8c] dark:text-[#9cdcfe] mb-0.5 font-semibold">
                                    {item.dailyTotal}
                                  </span>
                                )}
                                <div
                                  style={{ height: `${dailyHeightPct}%` }}
                                  className="w-full rounded-t bg-[#0b4e8c] dark:bg-[#0e639c] transition-all duration-300 group-hover:brightness-110 shadow-xs"
                                  title={`Log Aktivitas: ${item.dailyTotal}`}
                                />
                              </div>

                              {/* Bar 2: Kanban (Purple) */}
                              <div className="flex-1 max-w-[18px] flex flex-col items-center justify-end h-full">
                                {item.kanbanTotal > 0 && (
                                  <span className="text-[9px] font-mono text-purple-600 dark:text-[#c586c0] mb-0.5 font-semibold">
                                    {item.kanbanTotal}
                                  </span>
                                )}
                                <div
                                  style={{ height: `${kanbanHeightPct}%` }}
                                  className="w-full rounded-t bg-purple-600 dark:bg-[#8b5cf6] transition-all duration-300 group-hover:brightness-110 shadow-xs"
                                  title={`Kanban: ${item.kanbanTotal}`}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* X-axis date labels */}
                    <div className="flex items-center justify-between gap-2 sm:gap-3 px-2 mt-2">
                      {timelineChartData.map((item) => (
                        <span
                          key={item.date}
                          className="flex-1 text-center text-[10px] font-mono text-slate-400 dark:text-[#858585] truncate"
                          title={item.date}
                        >
                          {item.date.includes('-') && item.date.length >= 10 ? item.date.slice(5) : item.date}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Chart Legend */}
              <div className="pt-4 mt-2 border-t border-slate-100 dark:border-[#2d2d2d] flex flex-wrap items-center justify-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[#0b4e8c] dark:bg-[#0e639c]" />
                  <span className="text-slate-700 dark:text-[#cccccc] text-[11px] font-medium">Log Aktivitas ({dailyTotal})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-purple-600 dark:bg-[#8b5cf6]" />
                  <span className="text-slate-700 dark:text-[#cccccc] text-[11px] font-medium">Kanban ({kanbanTotal})</span>
                </div>
              </div>
            </div>

            {/* Chart 2: SVG Donut Division Breakdown (Requirement 5 / Image 6) */}
            <div className="lg:col-span-5 bg-white dark:bg-[#252526] rounded-3xl border border-slate-200/90 dark:border-[#2d2d2d] p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-[#0b4e8c] dark:text-[#3794ff]" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                      Aktivitas Berdasarkan Divisi Peserta
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-[#858585] mb-3">
                  Peserta magang dari divisi mana yang aktif mengisi log aktivitas dan aktif melakukan report dari aktivitas dan tugas yang diberikan:
                </p>

                {divisionChartData.length === 0 ? (
                  <div className="py-16 text-center text-xs text-slate-400 dark:text-[#858585]">
                    Belum ada data aktivitas divisi.
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

                        {/* Division slices */}
                        {(() => {
                          let acc = 0;
                          return divisionChartData.map((slice) => {
                            const strokeLength = (slice.pct / 100) * circumference;
                            const offset = -(acc / 100) * circumference;
                            acc += slice.pct;

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
                          });
                        })()}
                      </svg>

                      {/* Center Info in Donut */}
                      <div className="absolute text-center">
                        <span className="text-lg font-bold text-slate-900 dark:text-white font-mono block leading-none">
                          {totalDivisionEntries}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-[#858585] mt-0.5 block">
                          Total Entri
                        </span>
                      </div>
                    </div>

                    {/* Donut Legend */}
                    <div className="flex-1 w-full space-y-2">
                      {divisionChartData.map((div) => (
                        <div key={div.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 truncate pr-2">
                            <span
                              style={{ backgroundColor: div.color }}
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                            />
                            <span className="font-medium text-slate-700 dark:text-[#cccccc] truncate text-[11px]">
                              {div.name}
                            </span>
                          </div>
                          <div className="text-right shrink-0 font-mono text-[11px]">
                            <span className="font-semibold text-slate-800 dark:text-white">{div.count}</span>
                            <span className="text-slate-400 dark:text-[#858585]"> ({div.pct}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#2d2d2d] text-center">
                <span className="text-[11px] text-slate-400 dark:text-[#858585]">
                  Menampilkan proporsi keaktifan peserta magang per divisi kerja
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

            {/* Obstacle Radar & Attention List (Requirement 6 / Image 7) */}
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
                    {obstacleList.length} Laporan
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-[#858585] mb-3">
                  Aktivitas dan task peserta dengan update status cancelled, rescheduled, atau canceled:
                </p>

                {obstacleList.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 dark:text-[#858585] bg-slate-50 dark:bg-[#1e1e1e] rounded-2xl p-4 border border-dashed border-slate-200 dark:border-[#2d2d2d]">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                    <span>Tidak ada kendala status (Cancelled / Rescheduled / Canceled) yang dilaporkan. Semua proses berjalan lancar!</span>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {obstacleList.slice(0, 10).map((item) => (
                      <div
                        key={`${item.type}-${item.id}`}
                        className="p-3 rounded-2xl bg-amber-50/60 dark:bg-[#342c15]/60 border border-amber-200/60 dark:border-[#5a4d22] text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                              item.type === 'daily'
                                ? 'bg-blue-100 text-[#0b4e8c] dark:bg-[#1e2733] dark:text-[#9cdcfe]'
                                : 'bg-purple-100 text-purple-800 dark:bg-[#2e1d38] dark:text-[#c586c0]'
                            }`}>
                              {item.type === 'daily' ? 'Daily' : 'Kanban'}
                            </span>
                            <strong className="text-slate-900 dark:text-white font-semibold truncate">
                              {item.peserta}
                            </strong>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 dark:text-[#858585] shrink-0">
                            {item.date}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <StatusBadge status={item.status} size="sm" />
                          <span className="text-slate-800 dark:text-[#d4d4d4] font-medium text-[11px] truncate">
                            {item.title}
                          </span>
                        </div>

                        {item.note && (
                          <p className="text-amber-950 dark:text-[#dcdcaa] italic leading-relaxed text-[11px] bg-white/60 dark:bg-[#1e1e1e]/60 p-1.5 rounded-lg border border-amber-200/40 dark:border-[#5a4d22]/40">
                            "{item.note}"
                          </p>
                        )}

                        <div className="pt-1 flex items-center justify-end">
                          <button
                            onClick={() => {
                              if (item.type === 'daily') {
                                const d = item.item as DailyActivity;
                                openReview(
                                  d.Log_ID || String(d.No),
                                  'daily',
                                  d.Nama_Peserta || getDailyMenteeName(d, data.mentees) || 'Peserta',
                                  `Aktivitas Tanggal ${getDailyDate(d)}`,
                                  getDailyActivities(d),
                                  (getDailyStatusReview(d) as ItemStatus) || 'Menunggu',
                                  getDailyNote(d),
                                  getDailyEvidence(d),
                                  d.Kendala || getDailyNote(d),
                                  {
                                    date: getDailyDate(d),
                                    start: getDailyStart(d),
                                    end: getDailyEnd(d),
                                    duration: getDailyDuration(d),
                                    activitiesStatus: getDailyActivitiesStatus(d),
                                    targetDesc: getDailyTargetDesc(d),
                                    targetStatus: getDailyTargetStatus(d),
                                    note: getDailyNote(d),
                                  }
                                );
                              } else {
                                const k = item.item as KanbanItem;
                                openReview(
                                  String(k.Plan_ID || k.No),
                                  'kanban',
                                  getKanbanPeserta(k, data.mentees),
                                  `Task Kanban: ${getKanbanTask(k)}`,
                                  getKanbanTask(k),
                                  (getKanbanReview(k) as ItemStatus) || 'Menunggu',
                                  getKanbanNotes(k),
                                  getKanbanEvidence(k),
                                  undefined,
                                  {
                                    priority: getKanbanPriority(k),
                                    kanbanStatus: getKanbanStatus(k),
                                    dueDate: getKanbanDueDate(k),
                                    kanbanStart: getKanbanStartDate(k),
                                    kanbanEnd: getKanbanEndDate(k),
                                    evidence: getKanbanEvidence(k),
                                    assignedTo: getKanbanPeserta(k, data.mentees),
                                    mentorName: user.nama
                                  }
                                );
                              }
                            }}
                            className="text-[11px] font-semibold text-[#0b4e8c] dark:text-[#9cdcfe] hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>Tinjau</span>
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
