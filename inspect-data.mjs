const URL_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzeR2siZ4_1BHbQIQ-z2OYAQTB6ZkU7eHK_bzM4Zb-KkkG4cvF3CIjOZ8BmJNDfkEpKGw/exec';

async function run() {
  const r = await fetch(URL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'getData', email: 'hirumangun@gmail.com', pin: '123456' }),
  });
  const j = JSON.parse(await r.text());
  console.log('Status:', j.status);
  if (j.data) {
    console.log('\n=== DAILY ACTIVITIES ===');
    const da = j.data.dailyActivities || [];
    console.log('Count:', da.length);
    da.forEach((d, i) => console.log(`[${i}]`, JSON.stringify(d)));

    console.log('\n=== KANBAN ===');
    const k = j.data.kanbanItems || j.data.weeklyPlans || [];
    console.log('Count:', k.length);
    k.forEach((item, i) => console.log(`[${i}]`, JSON.stringify(item)));
  }
}
run();
