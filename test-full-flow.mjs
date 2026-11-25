const URL_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwYMaDvt2dDvwG--qqR5dZTSmPdKI631x7JMDTXQyOUfmh0q1vwmGmvczSL8E9l0cEVPw/exec';

async function post(payload) {
  const r = await fetch(URL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
  const text = await r.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error('Response bukan JSON:', text.substring(0, 200));
    return { status: 'error', message: 'HTML response (Apps Script crash)' };
  }
}

async function run() {
  // ========== STEP 1: LOGIN PESERTA ==========
  console.log('=== 1. LOGIN PESERTA ===');
  const loginPeserta = await post({ action: 'login', email: 'aldidajofanzadenis@gmail.com', pin: '123456' });
  console.log('Status:', loginPeserta.status, loginPeserta.user ? `→ ${loginPeserta.user.nama} (${loginPeserta.user.role})` : loginPeserta.message);
  if (loginPeserta.status !== 'success') { console.error('LOGIN GAGAL'); return; }

  // ========== STEP 2: INPUT DAILY ACTIVITY ==========
  console.log('\n=== 2. INPUT DAILY ACTIVITY ===');
  const saveDaily = await post({
    action: 'saveDailyActivity',
    email: 'aldidajofanzadenis@gmail.com',
    pin: '123456',
    data: {
      date: '2026-11-22',
      start: '08:00',
      end: '12:00',
      duration: 240,
      activities: 'Membuat dokumentasi API endpoint untuk modul autentikasi',
      activitiesStatus: 'Done',
      targetDesc: 'Dokumentasi API selesai 100%',
      targetStatus: 'Achieved',
      note: 'Berjalan lancar',
      evidence: 'https://docs.google.com/document/d/example123'
    }
  });
  console.log('Save Daily:', saveDaily.status, saveDaily.message);
  if (saveDaily.data) console.log('  rowIndex:', saveDaily.data.rowIndex, 'no:', saveDaily.data.no);

  // ========== STEP 3: INPUT KANBAN TASK ==========
  console.log('\n=== 3. INPUT KANBAN TASK ===');
  const saveKanban = await post({
    action: 'saveKanban',
    email: 'aldidajofanzadenis@gmail.com',
    pin: '123456',
    data: {
      task: 'Implementasi fitur export PDF laporan magang',
      priority: 'High',
      status: 'In Progress',
      dueDate: '2026-11-28',
      start: '2026-11-22',
      end: '',
      evidence: '',
      review: 'Menunggu'
    }
  });
  console.log('Save Kanban:', saveKanban.status, saveKanban.message);
  if (saveKanban.data) console.log('  rowIndex:', saveKanban.data.rowIndex, 'no:', saveKanban.data.no);

  const dailyNo = saveDaily.data ? String(saveDaily.data.no) : null;
  const kanbanNo = saveKanban.data ? String(saveKanban.data.no) : null;

  if (!dailyNo || !kanbanNo) {
    console.error('Input gagal, tidak bisa lanjut ke review');
    return;
  }

  // ========== STEP 4: LOGIN MENTOR ==========
  console.log('\n=== 4. LOGIN MENTOR ===');
  const loginMentor = await post({ action: 'login', email: 'hirumangun@gmail.com', pin: '123456' });
  console.log('Status:', loginMentor.status, loginMentor.user ? `→ ${loginMentor.user.nama} (${loginMentor.user.role})` : loginMentor.message);
  if (loginMentor.status !== 'success') { console.error('LOGIN MENTOR GAGAL'); return; }

  // ========== STEP 5: MENTOR VALIDASI DAILY (Disetujui) ==========
  console.log('\n=== 5. MENTOR VALIDASI DAILY → Disetujui (No: ' + dailyNo + ') ===');
  const reviewDaily = await post({
    action: 'reviewItem',
    email: 'hirumangun@gmail.com',
    pin: '123456',
    data: { id: dailyNo, type: 'daily', status: 'Disetujui', catatan: 'Bagus, dokumentasi sudah lengkap.' }
  });
  console.log('Review Daily:', reviewDaily.status, reviewDaily.message);

  // ========== STEP 6: MENTOR REVISI KANBAN ==========
  console.log('\n=== 6. MENTOR REVISI KANBAN → Revisi (No: ' + kanbanNo + ') ===');
  const reviewKanban = await post({
    action: 'reviewItem',
    email: 'hirumangun@gmail.com',
    pin: '123456',
    data: { id: kanbanNo, type: 'weekly', status: 'Revisi', catatan: 'Tambahkan fitur watermark pada PDF export.' }
  });
  console.log('Review Kanban:', reviewKanban.status, reviewKanban.message);

  // ========== STEP 7: VERIFY DATA ==========
  console.log('\n=== 7. VERIFIKASI DATA (dari sisi mentor) ===');
  const getData = await post({ action: 'getData', email: 'hirumangun@gmail.com', pin: '123456' });
  if (getData.status === 'success' && getData.data) {
    const da = getData.data.dailyActivities || [];
    console.log('Daily Activities (' + da.length + '):');
    da.forEach(d => {
      if (String(d.No) === dailyNo) {
        console.log(`  ✓ Daily #${d.No}: Activities Status="${d['Activities Status']}" | Status="${d.Status || '-'}" | Note="${d.Note || '-'}" | Peserta=${d.Nama_Peserta}`);
      }
    });

    const k = getData.data.kanbanItems || getData.data.weeklyPlans || [];
    console.log('Kanban Items (' + k.length + '):');
    k.forEach(item => {
      if (String(item.No) === kanbanNo) {
        console.log(`  ✓ Kanban #${item.No}: Review="${item.Review}" | Task="${item.Task}" | User=${item.User}`);
      }
    });
  } else {
    console.log('getData gagal:', getData.message);
  }

  // ========== SUMMARY ==========
  console.log('\n========== SUMMARY ==========');
  console.log('Login Peserta:', loginPeserta.status === 'success' ? '✓' : '✗');
  console.log('Save Daily:', saveDaily.status === 'success' ? '✓' : '✗');
  console.log('Save Kanban:', saveKanban.status === 'success' ? '✓' : '✗');
  console.log('Login Mentor:', loginMentor.status === 'success' ? '✓' : '✗');
  console.log('Review Daily (Disetujui):', reviewDaily.status === 'success' ? '✓' : '✗', reviewDaily.message);
  console.log('Review Kanban (Revisi):', reviewKanban.status === 'success' ? '✓' : '✗', reviewKanban.message);
}

run();
