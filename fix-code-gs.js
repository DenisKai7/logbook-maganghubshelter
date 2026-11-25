// ═══════════════════════════════════════════════════════════════════
// FIX: getLastRow() pada sheet dengan formatting kosong
// ═══════════════════════════════════════════════════════════════════
//
// MASALAH:
//   sheet.getLastRow() mengembalikan baris terakhir yang punya
//   formatting ATAU data. Jika sheet punya formatting (border, warna,
//   conditional formatting, dll) sampai baris 200 tapi data hanya
//   sampai baris 1 (header), getLastRow() return 200 → data baru
//   ditulis di baris 201.
//
// SOLUSI:
//   Ganti getLastRow() dengan fungsi helper yang menghitung
//   baris terakhir berdasarkan ISI DATA (kolom A / kolom pertama),
//   bukan formatting.
//
// ═══════════════════════════════════════════════════════════════════

// ─── PASTE FUNGSI INI DI BAGIAN ATAS Code.gs ─────────────────────

/**
 * Mengembalikan baris terakhir yang BENAR-BENAR berisi data di suatu sheet.
 * Berbeda dengan sheet.getLastRow() yang ikut menghitung baris kosong
 * yang punya formatting/border/conditional formatting.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @returns {number} Nomor baris terakhir yang berisi data (1-based).
 *                   Return 0 jika sheet benar-benar kosong (tidak ada header).
 *                   Return 1 jika hanya ada header.
 */
function getLastDataRow(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return lastRow; // kosong atau hanya header

  // Ambil semua nilai kolom A dari baris 1 sampai lastRow
  var colA = sheet.getRange(1, 1, lastRow, 1).getValues();

  // Cari dari bawah ke atas: baris pertama yang ada isinya
  for (var i = colA.length - 1; i >= 0; i--) {
    if (colA[i][0] !== '' && colA[i][0] !== null && colA[i][0] !== undefined) {
      return i + 1; // convert 0-based index ke 1-based row number
    }
  }

  return 0; // semua baris kosong
}


// ─── CARA PAKAI ──────────────────────────────────────────────────
//
// Di dalam handler saveDailyActivity (dan handler lain yang append
// baris baru), GANTI:
//
//   SEBELUM:
//     var lastRow = sheet.getLastRow();
//     sheet.getRange(lastRow + 1, 1, 1, headers.length).setValues([[...]]);
//
//   SESUDAH:
//     var lastRow = getLastDataRow(sheet);
//     sheet.getRange(lastRow + 1, 1, 1, headers.length).setValues([[...]]);
//
// Lakukan hal yang sama untuk SEMUA tempat yang append baris baru
// (saveDailyActivity, saveKanban, dll).
//
// ═══════════════════════════════════════════════════════════════════


// ─── CONTOH: Jika handler saveDailyActivity kamu seperti ini ─────
//
// function handleSaveDailyActivity(data, user) {
//   var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
//   var sheet = ss.getSheetByName('Daily_Activity');
//   var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
//
//   // ⬇️ GANTI BARIS INI:
//   // var lastRow = sheet.getLastRow();
//   // ⬇️ MENJADI:
//   var lastRow = getLastDataRow(sheet);
//
//   var newRow = [];
//   headers.forEach(function(h) {
//     newRow.push(data[h] || '');
//   });
//
//   sheet.getRange(lastRow + 1, 1, 1, headers.length).setValues([newRow]);
//
//   return { status: 'success', message: 'Daily_Activity berhasil disimpan.' };
// }


// ─── ALTERNATIF CEPAT (1 baris, tanpa fungsi helper) ─────────────
//
// Jika kamu tidak mau tambah fungsi baru, bisa ganti langsung:
//
//   SEBELUM:
//     var lastRow = sheet.getLastRow();
//
//   SESUDAH:
//     var lastRow = sheet.getRange("A:A").getValues().filter(String).length;
//
// Ini menghitung jumlah sel di kolom A yang ada isinya.
// Catatan: cara ini sedikit lebih lambat untuk sheet besar,
// tapi untuk ratusan baris tidak terasa.
