/**
 * E2E Test: Logbook + Kanban → Google Apps Script → Spreadsheet
 *
 * Tests the full flow:
 *   1. Ping backend (doGet health check)
 *   2. Login as Peserta
 *   3. Save a Daily Activity
 *   4. Save a Kanban task
 *   5. getData and verify entries exist in spreadsheet
 *
 * Usage: node test-e2e.mjs [--email EMAIL] [--pin PIN]
 */

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzeR2siZ4_1BHbQIQ-z2OYAQTB6ZkU7eHK_bzM4Zb-KkkG4cvF3CIjOZ8BmJNDfkEpKGw/exec';

// Parse CLI args
const args = process.argv.slice(2);
function getArg(name, fallback) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
}

const EMAIL = getArg('email', 'andi@magang.com');
const PIN = getArg('pin', '1234');

// Unique marker to find our test entries
const TEST_ID = `TEST-${Date.now()}`;
const TODAY = new Date().toISOString().slice(0, 10);

function formatIndonesianDate(dateStr) {
  const d = new Date(dateStr);
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

async function post(payload) {
  const res = await fetch(SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error('Non-JSON response:', text.slice(0, 500));
    throw new Error('Response bukan JSON — cek izin deployment Apps Script');
  }
}

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log(' MagangHub Logbook — E2E Integration Test');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`URL   : ${SCRIPT_URL}`);
  console.log(`Email : ${EMAIL}`);
  console.log(`Date  : ${TODAY}`);
  console.log(`TestID: ${TEST_ID}`);
  console.log('');

  // ─── 1. Ping Backend (doGet) ───────────────────────────────
  console.log('1. PING BACKEND (doGet)');
  try {
    const pingRes = await fetch(SCRIPT_URL, { method: 'GET' });
    const pingText = await pingRes.text();
    let pingJson;
    try { pingJson = JSON.parse(pingText); } catch { pingJson = null; }

    assert(pingRes.ok, `HTTP status ${pingRes.status} OK`);
    assert(pingJson && pingJson.status === 'success', `Backend status: ${pingJson?.status}`);
    if (pingJson?.version) console.log(`  → Version: ${pingJson.version}`);
    if (pingJson?.message) console.log(`  → Message: ${pingJson.message}`);
  } catch (err) {
    assert(false, `Ping failed: ${err.message}`);
  }
  console.log('');

  // ─── 2. Login ──────────────────────────────────────────────
  console.log('2. LOGIN');
  let user = null;
  try {
    const loginRes = await post({ action: 'login', email: EMAIL, pin: PIN });
    assert(loginRes.status === 'success', `Login status: ${loginRes.status}`);
    user = loginRes.user;
    if (user) {
      assert(user.role === 'Peserta', `Role: ${user.role}`);
      console.log(`  → userId: ${user.userId}, nama: ${user.nama}, divisi: ${user.divisi}`);
    } else {
      assert(false, `Login gagal: ${loginRes.message}`);
    }
  } catch (err) {
    assert(false, `Login error: ${err.message}`);
  }
  console.log('');

  if (!user) {
    console.error('Login gagal, tidak bisa lanjut test.');
    process.exit(1);
  }

  // ─── 3. Save Daily Activity ────────────────────────────────
  console.log('3. SAVE DAILY ACTIVITY');
  const dailyPayload = {
    action: 'saveDailyActivity',
    email: EMAIL,
    pin: PIN,
    data: {
      date: formatIndonesianDate(TODAY),
      tanggal: TODAY,
      start: '09:00',
      end: '10:30',
      duration: 90,
      activities: `[E2E-TEST ${TEST_ID}] Testing input logbook harian via script`,
      deskripsi: `[E2E-TEST ${TEST_ID}] Testing input logbook harian via script`,
      activitiesStatus: 'Done',
      targetDesc: 'Verifikasi koneksi frontend-backend',
      targetStatus: 'Achieved',
      note: 'Automated test entry',
      evidence: 'https://github.com/DenisKai7/maganghub',
      userId: user.userId,
      namaPeserta: user.nama,
      mentorId: user.mentorId || '',
      kategori: 'Mengerjakan Tugas',
      outputLink: 'https://github.com/DenisKai7/maganghub',
      kendala: 'Automated test entry',
    }
  };

  try {
    const dailyRes = await post(dailyPayload);
    assert(dailyRes.status === 'success', `Daily save: ${dailyRes.status} — ${dailyRes.message || ''}`);
  } catch (err) {
    assert(false, `Daily save error: ${err.message}`);
  }
  console.log('');

  // ─── 4. Save Kanban Task ───────────────────────────────────
  console.log('4. SAVE KANBAN TASK');
  const kanbanPayload = {
    action: 'saveKanban',
    email: EMAIL,
    pin: PIN,
    data: {
      task: `[E2E-TEST ${TEST_ID}] Testing Kanban board task creation`,
      targetMingguan: `[E2E-TEST ${TEST_ID}] Testing Kanban board task creation`,
      priority: 'High',
      status: 'In Progress',
      dueDate: TODAY,
      mingguKe: TODAY,
      start: '08:00',
      end: '17:00',
      evidence: 'https://github.com/DenisKai7/maganghub',
      review: 'Menunggu',
      userId: user.userId,
      mentorId: user.mentorId || '',
    }
  };

  try {
    const kanbanRes = await post(kanbanPayload);
    assert(kanbanRes.status === 'success', `Kanban save: ${kanbanRes.status} — ${kanbanRes.message || ''}`);
  } catch (err) {
    assert(false, `Kanban save error: ${err.message}`);
  }
  console.log('');

  // ─── 5. Verify via getData ─────────────────────────────────
  console.log('5. VERIFY DATA (getData)');
  // Small delay to let Apps Script finish writing
  await new Promise(r => setTimeout(r, 2000));

  try {
    const dataRes = await post({ action: 'getData', email: EMAIL, pin: PIN });
    assert(dataRes.status === 'success', `getData status: ${dataRes.status}`);

    if (dataRes.data) {
      const d = dataRes.data;

      // Check dailyActivities
      const dailyList = d.dailyActivities || [];
      console.log(`  → dailyActivities count: ${dailyList.length}`);
      const foundDaily = dailyList.find(item => {
        const acts = item.Activities || item.Deskripsi_Aktivitas || '';
        return acts.includes(TEST_ID);
      });
      assert(!!foundDaily, `Daily activity with TEST_ID "${TEST_ID}" found in getData response`);
      if (foundDaily) {
        console.log(`    → No: ${foundDaily.No}, Date: ${foundDaily.Date || foundDaily.Tanggal}`);
        console.log(`    → Start: ${foundDaily.Start}, End: ${foundDaily.End}, Duration: ${foundDaily.Duration}`);
        console.log(`    → Activities: ${(foundDaily.Activities || foundDaily.Deskripsi_Aktivitas || '').slice(0, 60)}...`);
      }

      // Check weeklyPlans / kanbanItems
      const kanbanList = d.kanbanItems || d.weeklyPlans || [];
      console.log(`  → kanban/weeklyPlans count: ${kanbanList.length}`);
      const foundKanban = kanbanList.find(item => {
        const task = item.Task || item.Target_Mingguan || '';
        return task.includes(TEST_ID);
      });
      assert(!!foundKanban, `Kanban task with TEST_ID "${TEST_ID}" found in getData response`);
      if (foundKanban) {
        console.log(`    → No: ${foundKanban.No}, Task: ${(foundKanban.Task || foundKanban.Target_Mingguan || '').slice(0, 50)}...`);
        console.log(`    → Priority: ${foundKanban.Priority}, Status: ${foundKanban.Status}`);
        console.log(`    → Due Date: ${foundKanban['Due Date'] || foundKanban.dueDate || foundKanban.Minggu_Ke}`);
      }

      // Additional data checks
      if (d.mentorName) console.log(`  → Mentor: ${d.mentorName}`);
      if (d.currentWeek) console.log(`  → Current Week: ${d.currentWeek}`);
    } else {
      assert(false, `getData returned no data: ${dataRes.message || 'unknown error'}`);
    }
  } catch (err) {
    assert(false, `getData error: ${err.message}`);
  }
  console.log('');

  // ─── Summary ───────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════');
  console.log(` RESULTS: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════════════');

  if (failed > 0) {
    console.log('\n⚠ Beberapa test gagal. Periksa:');
    console.log('  - Apakah deployment Apps Script sudah di-deploy sebagai "New version"?');
    console.log('  - Apakah "Who has access" sudah diset ke "Anyone"?');
    console.log('  - Apakah URL /exec di .env cocok dengan deployment aktif?');
    console.log('  - Apakah akun test (email/pin) sudah terdaftar di sheet Users?');
    process.exit(1);
  } else {
    console.log('\n✓ Semua test berhasil!');
    console.log('  Frontend ↔ Google Apps Script ↔ Spreadsheet terintegrasi dengan baik.');
    console.log(`  Data test dengan marker "${TEST_ID}" sudah tersimpan di spreadsheet.`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
