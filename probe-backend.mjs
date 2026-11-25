// Probe the Apps Script backend to understand the saveDailyActivity write behavior
const URL_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwVzXrP77PyVmFK441cErXcefjxfkogqZC9pAIN4QcX3oIRhZ50bjH2vp-GM-xnMRL4oQ/exec';

async function post(payload) {
  const r = await fetch(URL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
  return JSON.parse(await r.text());
}

async function run() {
  // 1. Check GET response for version info
  const ping = await fetch(URL_ENDPOINT);
  const pingJ = JSON.parse(await ping.text());
  console.log('GET response:', JSON.stringify(pingJ, null, 2));

  // 2. Try to get the sheet structure info (if backend exposes it)
  const infoRes = await post({ action: 'getSheetInfo', email: 'aldidajofanzadenis@gmail.com', pin: '123456' });
  console.log('\ngetSheetInfo:', JSON.stringify(infoRes));

  // 3. Try debug action
  const debugRes = await post({ action: 'debug', email: 'aldidajofanzadenis@gmail.com', pin: '123456' });
  console.log('\ndebug:', JSON.stringify(debugRes));
}
run();
