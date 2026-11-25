import {
  User,
  WeeklyPlan,
  DailyActivity,
  ApiResponse,
  PesertaData,
  MentorData,
  HRData,
} from "./types";

const STORAGE_PREFIX = "maganghub_";
const MOCK_DB_KEY = `${STORAGE_PREFIX}mock_db_v1`;

// GANTI dengan URL /exec dari deployment Web App yang AKTIF (Deploy > Manage deployments).
// Bisa juga diatur lewat VITE_APPS_SCRIPT_URL di .env (nilai .env menimpa default ini).
const DEFAULT_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxhonQWiEiUkyLvGAHqhAl1-k5qVUWbfIDZmoLYfFep5ux9cYPBwGFe9d8xYJ8NoSH8TQ/exec";

// Set VITE_USE_MOCK=true di .env untuk tes offline memakai localStorage (tanpa Google Apps Script).
const USE_MOCK = String(import.meta.env.VITE_USE_MOCK || "") === "true";

export function getScriptUrl(): string {
  const envUrl = (import.meta.env.VITE_APPS_SCRIPT_URL as string) || "";
  return envUrl.trim() || DEFAULT_SCRIPT_URL;
}

export function getCurrentIsoWeek(d = new Date()): string {
  const target = new Date(d.valueOf());
  target.setHours(0, 0, 0, 0);
  target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7));
  const week1 = new Date(target.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(
      ((target.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7,
    );
  return `${target.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

// Memakai tanggal lokal (bukan toISOString yang UTC) supaya tidak mundur sehari sebelum pukul 07.00 WIB.
export function getTodayStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatIndonesianDate(d: Date | string): string {
  if (!d) return "";
  const dateObj = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) {
    return String(d);
  }
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const dayName = days[dateObj.getDay()];
  const dateNum = dateObj.getDate();
  const monthName = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  return `${dayName}, ${dateNum} ${monthName} ${year}`;
}

export function computeDurationMinutes(
  startStr: string,
  endStr: string,
): number | "" {
  if (!startStr || !endStr) return "";
  const parseHM = (s: string) => {
    const m = String(s)
      .trim()
      .match(/^(\d{1,2}):(\d{2})/);
    if (!m) return null;
    return Number(m[1]) * 60 + Number(m[2]);
  };
  const startMin = parseHM(startStr);
  const endMin = parseHM(endStr);
  if (startMin === null || endMin === null) return "";
  return endMin >= startMin ? endMin - startMin : endMin + 1440 - startMin;
}

// ---------------------------------------------------------------------------
// Mock database (hanya dipakai jika VITE_USE_MOCK=true)
// ---------------------------------------------------------------------------

interface MockDB {
  users: Array<User & { pin: string }>;
  weeklyPlans: WeeklyPlan[];
  dailyActivities: DailyActivity[];
}

function getInitialMockDB(): MockDB {
  return {
    users: [
      {
        userId: "HR001",
        nama: "Admin HR",
        email: "hr@perusahaan.com",
        pin: "1234",
        role: "HR",
        divisi: "HRD",
        mentorId: "",
      },
      {
        userId: "MNT01",
        nama: "Budi Santoso",
        email: "budi@perusahaan.com",
        pin: "1234",
        role: "Mentor",
        divisi: "IT & Digital",
        mentorId: "",
      },
      {
        userId: "MNT02",
        nama: "Siti Aminah",
        email: "siti@perusahaan.com",
        pin: "1234",
        role: "Mentor",
        divisi: "Operasional",
        mentorId: "",
      },
      {
        userId: "INT01",
        nama: "Andi Pratama",
        email: "andi@magang.com",
        pin: "1234",
        role: "Peserta",
        divisi: "IT & Digital",
        mentorId: "MNT01",
      },
      {
        userId: "INT02",
        nama: "Rina Wijaya",
        email: "rina@magang.com",
        pin: "1234",
        role: "Peserta",
        divisi: "Operasional",
        mentorId: "MNT02",
      },
    ],
    weeklyPlans: [
      {
        No: 1,
        Task: "Menyelesaikan desain antarmuka dashboard dan integrasi API autentikasi peserta.",
        Peserta: "Andi Pratama",
        User: "Budi Santoso",
        Priority: "High",
        Status: "In Progress",
        "Due Date": getCurrentIsoWeek(),
        Review: "Menunggu",
        Notes: "",
        Plan_ID: "WP-001",
        Tanggal_Input: getTodayStr(),
        Minggu_Ke: getCurrentIsoWeek(),
        User_ID: "INT01",
        Nama_Peserta: "Andi Pratama",
        Mentor_ID: "MNT01",
        Target_Mingguan:
          "Menyelesaikan desain antarmuka dashboard dan integrasi API autentikasi peserta.",
        Catatan_Mentor: "",
      },
    ],
    dailyActivities: [
      {
        No: 1,
        Date: "Selasa, 10 November 2026",
        Start: "08:00",
        End: "09:00",
        Duration: 60,
        Activities: "Koordinasi dg Bp GM mengenai arsip dokumen legal",
        "Activities Status": "Done",
        "Target Desc": "",
        "Target Status": "",
        Note: "",
        "Achieved Target Evidence": "",
        Log_ID: "DA-001",
        Tanggal: "2026-11-10",
        User_ID: "INT01",
        Nama_Peserta: "Andi Pratama",
        Mentor_ID: "MNT01",
        Kategori: "Diskusi / Rapat Tim",
        Deskripsi_Aktivitas: "Koordinasi dg Bp GM mengenai arsip dokumen legal",
        Output_Link: "",
        Kendala: "",
        Status: "Disetujui",
        Catatan_Mentor: "",
      },
      {
        No: 2,
        Date: "Selasa, 10 November 2026",
        Start: "09:00",
        End: "10:00",
        Duration: 60,
        Activities:
          "Menemui Bp Arum driver SHS yang resign & ada info akan melapor ke Wawali mengenai kelebihan jam kerja",
        "Activities Status": "Done",
        "Target Desc": "",
        "Target Status": "",
        Note: "",
        "Achieved Target Evidence": "",
        Log_ID: "DA-002",
        Tanggal: "2026-11-10",
        User_ID: "INT01",
        Nama_Peserta: "Andi Pratama",
        Mentor_ID: "MNT01",
        Kategori: "Mengerjakan Tugas",
        Deskripsi_Aktivitas:
          "Menemui Bp Arum driver SHS yang resign & ada info akan melapor ke Wawali mengenai kelebihan jam kerja",
        Output_Link: "",
        Kendala: "",
        Status: "Disetujui",
        Catatan_Mentor: "",
      },
      {
        No: 3,
        Date: "Selasa, 10 November 2026",
        Start: "10:00",
        End: "14:00",
        Duration: 240,
        Activities:
          "Ke Disnakertrans Jatim memenuhi panggilan FU laporan a.n Adnri KCI",
        "Activities Status": "Done",
        "Target Desc": "",
        "Target Status": "",
        Note: "",
        "Achieved Target Evidence": "",
        Log_ID: "DA-003",
        Tanggal: "2026-11-10",
        User_ID: "INT01",
        Nama_Peserta: "Andi Pratama",
        Mentor_ID: "MNT01",
        Kategori: "Mengerjakan Tugas",
        Deskripsi_Aktivitas:
          "Ke Disnakertrans Jatim memenuhi panggilan FU laporan a.n Adnri KCI",
        Output_Link: "",
        Kendala: "",
        Status: "Disetujui",
        Catatan_Mentor: "",
      },
      {
        No: 4,
        Date: "Selasa, 10 November 2026",
        Start: "14:00",
        End: "17:00",
        Duration: 180,
        Activities:
          "Mengawal pengusulan program magang semua cabang & Melakukan pengusulan untuk East 1 (SIG & GSU)",
        "Activities Status": "Done",
        "Target Desc": "",
        "Target Status": "",
        Note: "",
        "Achieved Target Evidence": "",
        Log_ID: "DA-004",
        Tanggal: "2026-11-10",
        User_ID: "INT01",
        Nama_Peserta: "Andi Pratama",
        Mentor_ID: "MNT01",
        Kategori: "Mengerjakan Tugas",
        Deskripsi_Aktivitas:
          "Mengawal pengusulan program magang semua cabang & Melakukan pengusulan untuk East 1 (SIG & GSU)",
        Output_Link: "",
        Kendala: "",
        Status: "Disetujui",
        Catatan_Mentor: "",
      },
      {
        No: 5,
        Date: "Selasa, 10 November 2026",
        Start: "18:00",
        End: "21:00",
        Duration: 180,
        Activities:
          "BC dan info terkait penerimaan magang dan persiapan onboarding ke peserta maganghub",
        "Activities Status": "Done",
        "Target Desc": "",
        "Target Status": "",
        Note: "",
        "Achieved Target Evidence": "",
        Log_ID: "DA-005",
        Tanggal: "2026-11-10",
        User_ID: "INT01",
        Nama_Peserta: "Andi Pratama",
        Mentor_ID: "MNT01",
        Kategori: "Dokumentasi & Laporan",
        Deskripsi_Aktivitas:
          "BC dan info terkait penerimaan magang dan persiapan onboarding ke peserta maganghub",
        Output_Link: "",
        Kendala: "",
        Status: "Disetujui",
        Catatan_Mentor: "",
      },
    ],
  };
}

function saveMockDB(db: MockDB): void {
  localStorage.setItem(MOCK_DB_KEY, JSON.stringify(db));
}

function loadMockDB(): MockDB {
  const raw = localStorage.getItem(MOCK_DB_KEY);
  if (!raw) {
    const seed = getInitialMockDB();
    saveMockDB(seed);
    return seed;
  }
  try {
    return JSON.parse(raw);
  } catch {
    const seed = getInitialMockDB();
    saveMockDB(seed);
    return seed;
  }
}

export function resetMockData(): void {
  saveMockDB(getInitialMockDB());
}

// ---------------------------------------------------------------------------
// Network
// ---------------------------------------------------------------------------

const STALE_DEPLOYMENT_HINT =
  " (Server Google Apps Script yang dipanggil belum memuat action ini. " +
  "Kemungkinan URL /exec di frontend mengarah ke deployment lama, atau deployment belum diperbarui ke New version. " +
  "Periksa VITE_APPS_SCRIPT_URL / DEFAULT_SCRIPT_URL dan restart dev server.)";

async function sendRequest<T>(
  payload: Record<string, any>,
): Promise<ApiResponse<T>> {
  if (USE_MOCK) {
    return mockExecute<T>(payload);
  }

  const url = getScriptUrl();

  if (import.meta.env.DEV) {
    console.log("[api] URL:", url, "| action:", payload.action);
  }

  if (!url) {
    return {
      status: "error",
      message:
        "URL Google Apps Script belum diatur. Isi VITE_APPS_SCRIPT_URL atau DEFAULT_SCRIPT_URL.",
    };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    const text = await res.text();
    let json: ApiResponse<T>;
    try {
      json = JSON.parse(text);
    } catch {
      if (
        text.includes("Halaman Tidak Ditemukan") ||
        text.includes("not found") ||
        text.includes("Error 404")
      ) {
        return {
          status: "error",
          message:
            'URL Google Apps Script mengembalikan 404 (Halaman Tidak Ditemukan). Pastikan deployment Web App aktif dan Who has access diset ke "Anyone".',
        };
      }
      if (text.includes("accounts.google.com") || text.includes("Sign in")) {
        return {
          status: "error",
          message:
            'Izin ditolak Google. Pastikan saat Deploy Web App, opsi "Who has access" dipilih "Anyone" (bukan "Only myself").',
        };
      }
      return {
        status: "error",
        message:
          "Respons dari server Google bukan format JSON. Periksa izin deployment Google Apps Script Anda.",
      };
    }

    // Beri petunjuk jelas jika deployment di server belum punya action tersebut.
    if (
      json.status === "error" &&
      typeof json.message === "string" &&
      json.message.startsWith("Action tidak dikenali")
    ) {
      return { ...json, message: json.message + STALE_DEPLOYMENT_HINT };
    }

    return json;
  } catch (err: any) {
    return {
      status: "error",
      message: `Gagal terhubung ke Google Apps Script: ${err.message || "CORS/Network Error"}. Periksa koneksi atau URL Web App.`,
    };
  }
}

// Cek deployment mana yang sedang dipanggil (membaca field "version" dari doGet).
export async function pingBackend(): Promise<{
  url: string;
  ok: boolean;
  version?: string;
  message?: string;
}> {
  const url = getScriptUrl();
  try {
    const res = await fetch(url, { method: "GET" });
    const json = JSON.parse(await res.text());
    return {
      url,
      ok: json.status === "success",
      version: json.version,
      message: json.message,
    };
  } catch (err: any) {
    return { url, ok: false, message: err.message || "Gagal terhubung." };
  }
}

// ---------------------------------------------------------------------------
// Mock executor (mencerminkan perilaku Apps Script)
// ---------------------------------------------------------------------------

function mockExecute<T>(req: Record<string, any>): ApiResponse<T> {
  const db = loadMockDB();
  const action = req.action;

  const cleanEmail = String(req.email || "")
    .trim()
    .toLowerCase();
  const cleanPin = String(req.pin || "").trim();
  const user = db.users.find(
    (u) => u.email.toLowerCase() === cleanEmail && u.pin === cleanPin,
  );

  if (action === "login") {
    if (!user) {
      return { status: "error", message: "Email atau PIN salah." };
    }
    const safeUser: User = {
      userId: user.userId,
      nama: user.nama,
      email: user.email,
      role: user.role,
      divisi: user.divisi,
      mentorId: user.mentorId,
    };
    return { status: "success", user: safeUser };
  }

  if (!user) {
    return {
      status: "error",
      message: "Sesi tidak valid atau PIN berubah. Silakan login ulang.",
    };
  }

  if (action === "getData") {
    if (user.role === "Peserta") {
      const mentor = db.users.find((u) => u.userId === user.mentorId);
      const data: PesertaData = {
        mentorName: mentor ? mentor.nama : "-",
        currentWeek: getCurrentIsoWeek(),
        today: getTodayStr(),
        weeklyPlans: db.weeklyPlans
          .filter((w) => w.User_ID === user.userId)
          .slice()
          .reverse(),
        dailyActivities: db.dailyActivities
          .filter((d) => d.User_ID === user.userId)
          .slice()
          .reverse(),
      };
      return { status: "success", data: data as unknown as T };
    }

    if (user.role === "Mentor") {
      const mentees = db.users
        .filter((u) => u.role === "Peserta" && u.mentorId === user.userId)
        .map((u) => ({ userId: u.userId, nama: u.nama, divisi: u.divisi }));
      const mentors = db.users
        .filter((u) => u.role === "Mentor")
        .map((u) => ({ userId: u.userId, nama: u.nama, divisi: u.divisi }));

      const data: MentorData = {
        mentees,
        mentors,
        weeklyPlans: db.weeklyPlans
          .filter((w) => w.Mentor_ID === user.userId)
          .slice()
          .reverse(),
        dailyActivities: db.dailyActivities
          .filter((d) => d.Mentor_ID === user.userId)
          .slice()
          .reverse(),
      };
      return { status: "success", data: data as unknown as T };
    }

    if (user.role === "HR") {
      const safeUsers: User[] = db.users.map((u) => ({
        userId: u.userId,
        nama: u.nama,
        email: u.email,
        role: u.role,
        divisi: u.divisi,
        mentorId: u.mentorId,
      }));

      const data: HRData = {
        today: getTodayStr(),
        users: safeUsers,
        weeklyPlans: db.weeklyPlans.slice().reverse(),
        dailyActivities: db.dailyActivities.slice().reverse(),
      };
      return { status: "success", data: data as unknown as T };
    }

    return { status: "error", message: "Role tidak valid." };
  }

  if (action === "saveKanban" || action === "saveWeeklyPlan") {
    const payload = req.data || {};
    const taskVal = String(payload.task || payload.targetMingguan || "").trim();
    if (!taskVal) {
      return {
        status: "error",
        message: "Task wajib diisi.",
      };
    }

    const priorityVal = String(payload.priority || "Medium").trim();
    const statusVal = String(payload.status || "To Do").trim();
    const dueDateVal = String(payload.dueDate || payload.mingguKe || "").trim();
    const startVal = String(payload.start || "").trim();
    const endVal = String(payload.end || "").trim();
    const evidenceVal = String(
      payload.evidence || payload.outputLink || "",
    ).trim();
    const reviewVal = String(
      payload.review || payload.catatan || "Menunggu",
    ).trim();

    // Mentor multi-assign mock support
    if (
      user.role === "Mentor" &&
      payload.assignedTo &&
      Array.isArray(payload.assignedTo) &&
      payload.assignedTo.length > 0
    ) {
      const created: any[] = [];
      payload.assignedTo.forEach((assignee: any) => {
        const existingNos = db.weeklyPlans
          .map((w) => Number(w.No))
          .filter((n) => !isNaN(n));
        const nextNo =
          existingNos.length > 0 ? Math.max(...existingNos) + 1 : 1;
        db.weeklyPlans.push({
          No: nextNo,
          Task: taskVal,
          Peserta: String(assignee.nama || "").trim(),
          User: user.nama,
          Priority: priorityVal,
          Status: statusVal,
          "Due Date": dueDateVal,
          dueDate: dueDateVal,
          Start: startVal,
          End: endVal,
          Evidence: evidenceVal,
          Review: reviewVal,
          Notes: "",
          User_ID: String(assignee.userId || "").trim(),
          Mentor_ID: user.userId,
          Plan_ID: "WP-" + String(nextNo).padStart(3, "0"),
          Tanggal_Input: getTodayStr(),
          Minggu_Ke: dueDateVal,
          Nama_Peserta: String(assignee.nama || "").trim(),
          Target_Mingguan: taskVal,
          Catatan_Mentor: "",
        });
        created.push({ no: nextNo, userId: assignee.userId });
      });
      saveMockDB(db);
      return {
        status: "success",
        message: `${created.length} task berhasil ditugaskan.`,
        data: { items: created } as unknown as T,
      };
    }

    const targetId = String(
      payload.no || payload.planId || payload.id || "",
    ).trim();
    if (targetId) {
      const target = db.weeklyPlans.find(
        (w) => String(w.No) === targetId || w.Plan_ID === targetId,
      );
      if (target) {
        if (
          target.User_ID &&
          target.User_ID !== user.userId &&
          user.role !== "HR"
        ) {
          return { status: "error", message: "Akses ditolak." };
        }
        target.Task = taskVal;
        target.Target_Mingguan = taskVal;
        target.Priority = priorityVal;
        target.Status = statusVal;
        target["Due Date"] = dueDateVal;
        target.dueDate = dueDateVal;
        target.Start = startVal;
        target.End = endVal;
        target.Evidence = evidenceVal;
        // Jika peserta magang mengupdate kanban, reset Review ke Menunggu
        target.Review = user.role === "Peserta" ? "Menunggu" : reviewVal;
        saveMockDB(db);
        return { status: "success", message: "Kanban berhasil diperbarui." };
      }
    }

    const existingNos = db.weeklyPlans
      .map((w) => Number(w.No))
      .filter((n) => !isNaN(n));
    const nextNo = existingNos.length > 0 ? Math.max(...existingNos) + 1 : 1;

    const newKanban: any = {
      No: nextNo,
      Task: taskVal,
      Peserta: user.nama,
      User: user.nama,
      Priority: priorityVal,
      Status: statusVal,
      "Due Date": dueDateVal,
      dueDate: dueDateVal,
      Start: startVal,
      End: endVal,
      Evidence: evidenceVal,
      Review: reviewVal,
      Notes: "",
      User_ID: user.userId,
      Mentor_ID: user.mentorId || "",

      // Compatibility
      Plan_ID: "WP-" + String(nextNo).padStart(3, "0"),
      Tanggal_Input: getTodayStr(),
      Minggu_Ke: dueDateVal,
      Nama_Peserta: user.nama,
      Target_Mingguan: taskVal,
      Catatan_Mentor: "",
    };
    db.weeklyPlans.push(newKanban);
    saveMockDB(db);
    return { status: "success", message: "Kanban berhasil disimpan." };
  }

  if (action === "saveDailyActivity") {
    if (user.role !== "Peserta") {
      return {
        status: "error",
        message: "Hanya Peserta yang dapat mengisi Daily Activity.",
      };
    }
    const payload = req.data || {};
    const dateVal = String(
      payload.date || payload.tanggal || getTodayStr(),
    ).trim();
    const startVal = String(payload.start || "").trim();
    const endVal = String(payload.end || "").trim();
    const activitiesVal = String(
      payload.activities || payload.deskripsi || "",
    ).trim();

    if (!dateVal || !activitiesVal) {
      return {
        status: "error",
        message: "Date dan Activities wajib diisi.",
      };
    }

    const durationVal =
      payload.duration !== undefined && payload.duration !== ""
        ? Number(payload.duration)
        : computeDurationMinutes(startVal, endVal);

    const actStatusVal = String(
      payload.activitiesStatus || payload.status || "Done",
    ).trim();
    const tgtStatusVal = String(payload.targetStatus || "").trim();
    const tgtDescVal = String(payload.targetDesc || "").trim();
    const noteVal = String(
      payload.note || payload.catatan || payload.kendala || "",
    ).trim();
    const evidenceVal = String(
      payload.evidence || payload.outputLink || "",
    ).trim();

    // Check if updating existing
    const searchNo = payload.no ? String(payload.no).trim() : "";
    const searchId = payload.logId ? String(payload.logId).trim() : "";

    const target = db.dailyActivities.find(
      (d) =>
        (searchNo && String(d.No).trim() === searchNo) ||
        (searchId && (d.Log_ID === searchId || String(d.No) === searchId)),
    );

    if (target) {
      if (target.User_ID && target.User_ID !== user.userId) {
        return { status: "error", message: "Akses ditolak." };
      }
      if (
        target.Status === "Disetujui" ||
        target["Activities Status"] === "Done"
      ) {
        // Allow updating if not strictly locked
      }

      target.Date = dateVal;
      target.Start = startVal;
      target.End = endVal;
      target.Duration = durationVal;
      target.Activities = activitiesVal;
      target["Activities Status"] = actStatusVal;
      target["Target Desc"] = tgtDescVal;
      target["Target Status"] = tgtStatusVal;
      target.Note = noteVal;
      target["Achieved Target Evidence"] = evidenceVal;
      target.User_ID = target.User_ID || user.userId;
      target.Nama_Peserta = target.Nama_Peserta || user.nama;
      target.Mentor_ID = target.Mentor_ID || user.mentorId || "";

      // Legacy synchronization
      target.Tanggal = dateVal;
      target.Deskripsi_Aktivitas = activitiesVal;
      target.Output_Link = evidenceVal;
      target.Kendala = noteVal;
      target.Status = "Menunggu";

      saveMockDB(db);
      return {
        status: "success",
        message: "Daily Activity berhasil diperbarui.",
      };
    }

    // Insert new item
    const existingNos = db.dailyActivities
      .map((d) => Number(d.No))
      .filter((n) => !isNaN(n));
    const nextNo = existingNos.length > 0 ? Math.max(...existingNos) + 1 : 1;

    const newAct: DailyActivity = {
      No: nextNo,
      Date: dateVal,
      Start: startVal,
      End: endVal,
      Duration: durationVal,
      Activities: activitiesVal,
      "Activities Status": actStatusVal,
      "Target Desc": tgtDescVal,
      "Target Status": tgtStatusVal,
      Note: noteVal,
      "Achieved Target Evidence": evidenceVal,

      Log_ID: "DA-" + String(nextNo).padStart(3, "0"),
      Tanggal: dateVal,
      User_ID: user.userId,
      Nama_Peserta: user.nama,
      Mentor_ID: user.mentorId || "",
      Kategori: "Mengerjakan Tugas",
      Deskripsi_Aktivitas: activitiesVal,
      Output_Link: evidenceVal,
      Kendala: noteVal,
      Status: "Menunggu",
      Catatan_Mentor: "",
    };
    db.dailyActivities.push(newAct);
    saveMockDB(db);
    return { status: "success", message: "Daily Activity berhasil dicatat." };
  }

  if (action === "reviewItem") {
    if (user.role !== "Mentor") {
      return {
        status: "error",
        message: "Hanya Mentor yang dapat melakukan review.",
      };
    }
    const payload = req.data || {};
    if (
      !payload.id ||
      !["Menunggu", "Disetujui", "Revisi", "Ditolak"].includes(payload.status)
    ) {
      return { status: "error", message: "Payload review tidak valid." };
    }

    const target =
      payload.type === "weekly"
        ? db.weeklyPlans.find(
            (w) =>
              w.Plan_ID === payload.id || String(w.No) === String(payload.id),
          )
        : db.dailyActivities.find(
            (d) =>
              d.Log_ID === payload.id || String(d.No) === String(payload.id),
          );

    if (!target) return { status: "error", message: "Item tidak ditemukan." };
    if (target.Mentor_ID !== user.userId)
      return {
        status: "error",
        message: "Anda bukan mentor dari peserta ini.",
      };

    target.Status = payload.status;
    target.Catatan_Mentor = String(payload.catatan || "").trim();
    if (payload.type !== "weekly") {
      const dailyTarget = target as DailyActivity;
      // Status Review tidak mengoverride Activities Status secara otomatis.
      // Hanya override jika mentor kirim activitiesStatus yang valid.
      if (payload.activitiesStatus) {
        dailyTarget["Activities Status"] = payload.activitiesStatus;
      }
      if (payload.targetStatus) {
        dailyTarget["Target Status"] = payload.targetStatus;
      }
    }
    saveMockDB(db);
    return {
      status: "success",
      message: `Status berhasil diubah menjadi ${payload.status}.`,
    };
  }

  if (action === "deleteItem") {
    const payload = req.data || {};
    if (!payload.id || !["weekly", "daily"].includes(payload.type)) {
      return { status: "error", message: "Payload hapus tidak valid." };
    }
    if (user.role !== "Peserta" && user.role !== "HR") {
      return {
        status: "error",
        message: "Role tidak memiliki izin menghapus item.",
      };
    }

    const isWeekly = payload.type === "weekly";
    const list: Array<WeeklyPlan | DailyActivity> = isWeekly
      ? db.weeklyPlans
      : db.dailyActivities;
    const idx = list.findIndex((item) =>
      isWeekly
        ? (item as WeeklyPlan).Plan_ID === payload.id
        : (item as DailyActivity).Log_ID === payload.id ||
          String((item as DailyActivity).No) === String(payload.id),
    );
    if (idx === -1)
      return { status: "error", message: "Item tidak ditemukan." };

    const item = list[idx];
    if (user.role === "Peserta") {
      if ((item as any).User_ID && (item as any).User_ID !== user.userId)
        return { status: "error", message: "Akses ditolak." };
      if ((item as any).Status === "Disetujui") {
        return {
          status: "error",
          message: "Item yang sudah disetujui tidak bisa dihapus.",
        };
      }
    }

    list.splice(idx, 1);
    saveMockDB(db);
    return { status: "success", message: "Data berhasil dihapus." };
  }

  if (action === "resetPin") {
    if (user.role !== "HR") {
      return {
        status: "error",
        message: "Hanya HR yang dapat mereset PIN pengguna.",
      };
    }
    const payload = req.data || {};
    if (!payload.userId && !payload.email) {
      return {
        status: "error",
        message: "Target userId atau email wajib diisi.",
      };
    }
    const nextPin = String(payload.newPin || "1234").trim();
    if (!/^\d{4,8}$/.test(nextPin)) {
      return {
        status: "error",
        message: "PIN harus terdiri dari 4 sampai 8 digit angka.",
      };
    }
    const target = db.users.find(
      (u) =>
        (payload.userId && u.userId === String(payload.userId).trim()) ||
        (payload.email &&
          u.email.toLowerCase() === String(payload.email).trim().toLowerCase()),
    );
    if (!target)
      return { status: "error", message: "Pengguna tidak ditemukan." };
    target.pin = nextPin;
    saveMockDB(db);
    return {
      status: "success",
      message: "PIN berhasil direset.",
      data: {
        userId: target.userId,
        email: target.email,
        resetPin: nextPin,
      } as unknown as T,
    };
  }

  if (action === "changePin") {
    const payload = req.data || {};
    if (!payload.currentPin || !payload.newPin) {
      return { status: "error", message: "PIN lama dan PIN baru wajib diisi." };
    }
    const currentPin = String(payload.currentPin).trim();
    const newPin = String(payload.newPin).trim();
    if (!/^\d{4,8}$/.test(newPin)) {
      return {
        status: "error",
        message: "PIN baru harus terdiri dari 4 sampai 8 digit angka.",
      };
    }
    const target = db.users.find((u) => u.userId === user.userId);
    if (!target)
      return { status: "error", message: "Akun pengguna tidak ditemukan." };
    if (target.pin !== currentPin) {
      return { status: "error", message: "PIN lama tidak sesuai." };
    }
    target.pin = newPin;
    saveMockDB(db);
    return {
      status: "success",
      message:
        "PIN berhasil diubah. Silakan gunakan PIN baru saat login berikutnya.",
    };
  }

  return { status: "error", message: "Action tidak dikenali: " + action };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const api = {
  login: (email: string, pin: string) =>
    sendRequest<{ user: User }>({ action: "login", email, pin }),
  getData: <T>(email: string, pin: string) =>
    sendRequest<T>({ action: "getData", email, pin }),
  saveKanban: (
    email: string,
    pin: string,
    data: {
      no?: string | number;
      task: string;
      user?: string;
      peserta?: string | string[];
      priority?: string;
      status?: string;
      dueDate?: string;
      start?: string;
      end?: string;
      evidence?: string;
      review?: string;
      notes?: string;
      userId?: string;
      mentorId?: string;
      assignedTo?: Array<{ userId: string; nama: string }>;
      assigners?: string[];
      id?: string;
      planId?: string;
      targetMingguan?: string;
      mingguKe?: string;
    },
  ) => sendRequest({ action: "saveKanban", email, pin, data }),
  saveWeeklyPlan: (email: string, pin: string, data: any) =>
    sendRequest({ action: "saveKanban", email, pin, data }),
  saveDailyActivity: (
    email: string,
    pin: string,
    data: {
      no?: string | number;
      rowIndex?: number;
      date?: string;
      tanggal?: string;
      start?: string;
      end?: string;
      duration?: number | string;
      activities?: string;
      deskripsi?: string;
      activitiesStatus?: string;
      status?: string;
      targetDesc?: string;
      targetStatus?: string;
      note?: string;
      catatan?: string;
      evidence?: string;
      outputLink?: string;
      userId?: string;
      namaPeserta?: string;
      mentorId?: string;
      kendala?: string;
      logId?: string;
      kategori?: string;
    },
  ) => sendRequest({ action: "saveDailyActivity", email, pin, data }),
  reviewItem: (
    email: string,
    pin: string,
    data: {
      id: string;
      type: "weekly" | "daily";
      status: "Menunggu" | "Disetujui" | "Revisi" | "Ditolak";
      catatan: string;
      activitiesStatus?: string;
      targetStatus?: string;
    },
  ) => sendRequest({ action: "reviewItem", email, pin, data }),
  deleteItem: (
    email: string,
    pin: string,
    data: { id: string; type: "weekly" | "daily" },
  ) => sendRequest({ action: "deleteItem", email, pin, data }),
  resetPin: (
    email: string,
    pin: string,
    data: { userId?: string; email?: string; newPin?: string },
  ) =>
    sendRequest<{ userId: string; email: string; resetPin: string }>({
      action: "resetPin",
      email,
      pin,
      data,
    }),
  changePin: (
    email: string,
    pin: string,
    data: { currentPin: string; newPin: string },
  ) => sendRequest({ action: "changePin", email, pin, data }),
};
