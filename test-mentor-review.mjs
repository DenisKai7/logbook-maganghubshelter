const URL_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzeR2siZ4_1BHbQIQ-z2OYAQTB6ZkU7eHK_bzM4Zb-KkkG4cvF3CIjOZ8BmJNDfkEpKGw/exec';

async function post(payload) {
  const r = await fetch(URL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
  return JSON.parse(await r.text());
}

async function run() {
  // 1. Login mentor
  console.log('=== LOGIN MENTOR ===');
  const login = await post({ action: 'login', email: 'hirumangun@gmail.com', pin: '123456' });
  console.log('Login:', login.status, login.user ? `→ ${login.user.nama} (${login.user.role})` : login.message);
  if (login.status !== 'success') return;

  const user = login.user;

  // 2. Test reviewItem - Disetujui on daily activity No 1
  console.log('\n=== REVIEW DAILY (Disetujui) ===');
  const review1 = await post({
    action: 'reviewItem',
    email: 'hirumangun@gmail.com',
    pin: '123456',
    data: { id: '1', type: 'daily', status: 'Disetujui', catatan: 'Test approve dari script' }
  });
  console.log('Review daily:', review1.status, review1.message);

  // 3. Test reviewItem - Revisi on kanban No 4
  console.log('\n=== REVIEW KANBAN (Revisi) ===');
  const review2 = await post({
    action: 'reviewItem',
    email: 'hirumangun@gmail.com',
    pin: '123456',
    data: { id: '4', type: 'weekly', status: 'Revisi', catatan: 'Perlu perbaikan evidence' }
  });
  console.log('Review kanban:', review2.status, review2.message);

  // 4. Verify
  console.log('\n=== VERIFY getData ===');
  const data = await post({ action: 'getData', email: 'hirumangun@gmail.com', pin: '123456' });
  if (data.data) {
    const da = data.data.dailyActivities || [];
    da.forEach(d => console.log(`Daily #${d.No}: Activities Status="${d['Activities Status']}" | Mentor_ID=${d.Mentor_ID}`));
    const k = data.data.kanbanItems || data.data.weeklyPlans || [];
    k.forEach(item => console.log(`Kanban #${item.No}: Review="${item.Review}"`));
  }
}
run();
