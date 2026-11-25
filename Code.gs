const SHEETS = {
  USERS: "Users",
  WEEKLY: "Kanban",
  DAILY: "Daily_Activity",
};

const ACTIVITY_STATUS_OPTIONS = [
  "Done",
  "On Progress",
  "Cancelled",
  "Rescheduled",
];
const TARGET_STATUS_OPTIONS = [
  "Achieved",
  "In Progress",
  "Not Achieved",
  "Exceeded",
  "N/A",
];

const DAILY_REVIEW_OPTIONS = ["Menunggu", "Disetujui", "Revisi", "Ditolak"];

// Status yang dapat diinput oleh peserta: To Do, In Progress, Done, Canceled.
// Status review mentor (Menunggu, Disetujui, Revisi, Ditolak) terpisah di kolom Review.
const KANBAN_PRIORITY_OPTIONS = ["Low", "Medium", "High", "Urgent"];
const KANBAN_STATUS_OPTIONS = ["To Do", "In Progress", "Done", "Canceled"];
// Status review kanban: Ditugaskan = baru dibuat mentor, Menunggu = sudah diupdate peserta menunggu review mentor
const KANBAN_REVIEW_OPTIONS = ["Ditugaskan", "Menunggu", "Disetujui", "Revisi", "Ditolak"];

const DAILY_STATUS_ALL_OPTIONS =
  ACTIVITY_STATUS_OPTIONS.concat(DAILY_REVIEW_OPTIONS);

function getLastDataRow(sheet) {
  if (!sheet) return 0;
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return lastRow;
  var colA = sheet.getRange(1, 1, lastRow, 1).getValues();
  for (var i = colA.length - 1; i >= 0; i--) {
    if (colA[i][0] !== "" && colA[i][0] !== null && colA[i][0] !== undefined) {
      return i + 1;
    }
  }
  return 1;
}

function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const configs = [
    {
      name: SHEETS.USERS,
      headers: [
        "User_ID",
        "Nama",
        "Email",
        "PIN",
        "Role",
        "Divisi",
        "Mentor_ID",
      ],
    },
    {
      name: SHEETS.WEEKLY,
      headers: [
        "No",
        "Task",
        "Peserta",
        "User",
        "Priority",
        "Status",
        "Due Date",
        "Start Date",
        "End Date",
        "Evidence",
        "Review",
        "Notes",
        "User_ID",
        "Mentor_ID",
      ],
    },
    {
      name: SHEETS.DAILY,
      headers: [
        "No",
        "Date",
        "Start",
        "End",
        "Duration",
        "Activities",
        "Activities Status",
        "Target Desc",
        "Target Status",
        "Note",
        "Achieved Target Evidence",
        "User_ID",
        "Nama_Peserta",
        "Mentor_ID",
        "Status Review",
      ],
    },
  ];

  configs.forEach((cfg) => {
    let sheet = ss.getSheetByName(cfg.name);
    if (!sheet) {
      sheet = ss.insertSheet(cfg.name);
      sheet
        .getRange(1, 1, 1, cfg.headers.length)
        .setValues([cfg.headers])
        .setFontWeight("bold")
        .setBackground("#16325B")
        .setFontColor("#ffffff");
      sheet.setFrozenRows(1);

      if (cfg.name === SHEETS.USERS) {
        sheet.getRange("D:D").setNumberFormat("@");
      }

      if (cfg.name === SHEETS.WEEKLY) {
        applyKanbanDropdownRules_(sheet, 2, 500);
      }

      if (cfg.name === SHEETS.DAILY) {
        applyDailyDropdownRules_(sheet, 2, 500);
      }

      sheet.autoResizeColumns(1, cfg.headers.length);
    } else {
      if (cfg.name === SHEETS.WEEKLY) {
        ensureKanbanHeaders_(sheet);
        applyKanbanDropdownRules_(sheet, 2, Math.max(sheet.getLastRow(), 500));
      }

      if (cfg.name === SHEETS.DAILY) {
        if (sheet.getLastColumn() < 15) {
          var dailyHeaders = [
            "User_ID",
            "Nama_Peserta",
            "Mentor_ID",
            "Status Review",
          ];
          var startCol =
            sheet.getLastColumn() < 12 ? 12 : sheet.getLastColumn() + 1;
          var count = 15 - startCol + 1;
          var headerSlice = dailyHeaders.slice(dailyHeaders.length - count);
          if (count > 0) {
            sheet
              .getRange(1, startCol, 1, count)
              .setValues([headerSlice])
              .setFontWeight("bold")
              .setBackground("#16325B")
              .setFontColor("#ffffff");
          }
        }
        applyDailyDropdownRules_(sheet, 2, Math.max(sheet.getLastRow(), 500));
      }
    }
  });
}

function ensureKanbanHeaders_(sheet) {
  const required = [
    "No",
    "Task",
    "Peserta",
    "User",
    "Priority",
    "Status",
    "Due Date",
    "Start Date",
    "End Date",
    "Evidence",
    "Review",
    "Notes",
    "User_ID",
    "Mentor_ID",
  ];
  const lastCol = sheet.getLastColumn();
  if (lastCol < required.length) {
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    for (let i = 0; i < required.length; i++) {
      if (String(headers[i] || "").trim() !== required[i]) {
        sheet
          .getRange(1, i + 1)
          .setValue(required[i])
          .setFontWeight("bold")
          .setBackground("#16325B")
          .setFontColor("#ffffff");
      }
    }
  }
}

function applyKanbanDropdownRules_(sheet, startRow, numRows) {
  const prioRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(KANBAN_PRIORITY_OPTIONS, true)
    .setAllowInvalid(false)
    .build();

  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(KANBAN_STATUS_OPTIONS, true)
    .setAllowInvalid(false)
    .build();

  const reviewRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(KANBAN_REVIEW_OPTIONS, true)
    .setAllowInvalid(false)
    .build();

  // Priority = E, Status = F, Review = K
  sheet.getRange(startRow, 5, numRows, 1).setDataValidation(prioRule);
  sheet.getRange(startRow, 6, numRows, 1).setDataValidation(statusRule);
  sheet.getRange(startRow, 11, numRows, 1).setDataValidation(reviewRule);
}

function ensureKanbanRowDropdown_(sheet, rowNum) {
  const prioRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(KANBAN_PRIORITY_OPTIONS, true)
    .setAllowInvalid(false)
    .build();

  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(KANBAN_STATUS_OPTIONS, true)
    .setAllowInvalid(false)
    .build();

  const reviewRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(KANBAN_REVIEW_OPTIONS, true)
    .setAllowInvalid(false)
    .build();

  sheet.getRange(rowNum, 5).setDataValidation(prioRule);
  sheet.getRange(rowNum, 6).setDataValidation(statusRule);
  sheet.getRange(rowNum, 11).setDataValidation(reviewRule);
}

// FIX: Dropdown Activities Status sekarang menerima semua status termasuk review
function applyDailyDropdownRules_(sheet, startRow, numRows) {
  var actRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(ACTIVITY_STATUS_OPTIONS, true)
    .setAllowInvalid(false)
    .build();

  var tgtRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(TARGET_STATUS_OPTIONS, true)
    .setAllowInvalid(false)
    .build();

  var reviewRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(DAILY_REVIEW_OPTIONS, true)
    .setAllowInvalid(false)
    .build();

  sheet.getRange(startRow, 7, numRows, 1).setDataValidation(actRule);
  sheet.getRange(startRow, 9, numRows, 1).setDataValidation(tgtRule);
  sheet.getRange(startRow, 15, numRows, 1).setDataValidation(reviewRule);
}

function ensureDailyRowDropdown_(sheet, rowNum) {
  var actRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(ACTIVITY_STATUS_OPTIONS, true)
    .setAllowInvalid(false)
    .build();

  var tgtRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(TARGET_STATUS_OPTIONS, true)
    .setAllowInvalid(false)
    .build();

  var reviewRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(DAILY_REVIEW_OPTIONS, true)
    .setAllowInvalid(false)
    .build();

  sheet.getRange(rowNum, 7).setDataValidation(actRule);
  sheet.getRange(rowNum, 9).setDataValidation(tgtRule);
  sheet.getRange(rowNum, 15).setDataValidation(reviewRule);
}

function doGet() {
  return jsonResponse({
    status: "success",
    message: "API Sistem Pemantauan Magang aktif.",
  });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ status: "error", message: "Payload kosong." });
    }

    const req = JSON.parse(e.postData.contents);
    const action = req.action;

    if (action === "login") {
      return handleLogin(req.email, req.pin);
    }

    const authUser = authenticateUser(req.email, req.pin);
    if (!authUser) {
      return jsonResponse({
        status: "error",
        message: "Sesi tidak valid atau PIN berubah. Silakan login ulang.",
      });
    }

    switch (action) {
      case "getData":
        return handleGetData(authUser);
      case "saveKanban":
      case "saveWeeklyPlan":
        return handleSaveKanban(authUser, req.data);
      case "saveDailyActivity":
      case "submitDailyActivity":
        return handleSaveDailyActivity(authUser, req.data);
      case "reviewItem":
        return handleReviewItem(authUser, req.data);
      case "deleteItem":
        return handleDeleteItem(authUser, req.data);
      case "resetPin":
        return handleResetPin(authUser, req.data);
      case "changePin":
        return handleChangePin(authUser, req.data);
      default:
        return jsonResponse({
          status: "error",
          message: "Action tidak dikenali: " + action,
        });
    }
  } catch (err) {
    return jsonResponse({
      status: "error",
      message: "Server Error: " + err.message,
    });
  }
}

function handleLogin(email, pin) {
  const user = authenticateUser(email, pin);
  if (!user) {
    return jsonResponse({ status: "error", message: "Email atau PIN salah." });
  }
  return jsonResponse({ status: "success", user: user });
}

function handleGetData(user) {
  const allUsers = getSheetObjects(SHEETS.USERS);
  const rawKanban = getSheetObjects(SHEETS.WEEKLY);
  const rawDaily = getSheetObjects(SHEETS.DAILY);

  const usersMap = {};
  allUsers.forEach((u) => {
    usersMap[String(u.User_ID).trim()] = u;
  });

  const allKanban = rawKanban.map((k) => {
    let uId = String(k.User_ID || "").trim();
    let pesertaName = String(k.Peserta || "").trim();
    let assignerName = String(k.User || "").trim();
    if (!uId && user.role === "Peserta") {
      uId = user.userId;
    }
    if (!pesertaName && uId && usersMap[uId]) {
      pesertaName = usersMap[uId].Nama;
    } else if (!pesertaName && user.role === "Peserta") {
      pesertaName = user.nama;
    }
    // Backward compatibility: jika lama hanya punya kolom User, anggap sebagai Peserta
    if (!pesertaName && assignerName) {
      pesertaName = assignerName;
      assignerName = "";
    }
    k.Peserta = pesertaName;
    k.User = assignerName;
    k.User_ID = uId;
    return k;
  });

  const allDaily = rawDaily
    .filter((d) => {
      const noStr = String(d.No || "").toUpperCase();
      const actStr = String(d.Activities || "").toLowerCase();
      return (
        !noStr.includes("TOTAL") &&
        !actStr.includes("0 aktivitas") &&
        !actStr.includes("total aktivitas")
      );
    })
    .map((d) => {
      let uId = String(d.User_ID || "").trim();
      let uName = String(d.Nama_Peserta || "").trim();

      if (!uId && user.role === "Peserta") {
        uId = user.userId;
        uName = user.nama;
      } else if (uId && !uName && usersMap[uId]) {
        uName = usersMap[uId].Nama;
      }

      d.User_ID = uId;
      d.Nama_Peserta = uName;

      // Map Status Review (kolom 15) ke legacy Status field untuk frontend
      var reviewStatus = String(d["Status Review"] || "").trim();
      if (
        ["Disetujui", "Revisi", "Menunggu", "Ditolak"].includes(reviewStatus)
      ) {
        d.Status = reviewStatus;
      } else {
        d.Status = "Menunggu";
      }

      return d;
    });

  if (user.role === "Peserta") {
    const mentor = allUsers.find(
      (u) => String(u.User_ID) === String(user.mentorId),
    );
    const userKanban = allKanban.filter(
      (k) =>
        (!k.User_ID && !k.Peserta) ||
        String(k.User_ID) === String(user.userId) ||
        String(k.Peserta).trim().toLowerCase() ===
          String(user.nama).trim().toLowerCase(),
    );
    const userDaily = allDaily.filter(
      (d) => !d.User_ID || String(d.User_ID) === String(user.userId),
    );

    return jsonResponse({
      status: "success",
      data: {
        mentorName: mentor ? mentor.Nama : "-",
        currentWeek: getCurrentIsoWeek(),
        today: getTodayStr(),
        kanbanItems: userKanban.slice().reverse(),
        weeklyPlans: userKanban.slice().reverse(),
        dailyActivities: userDaily.slice().reverse(),
      },
    });
  }

  if (user.role === "Mentor") {
    const mentees = allUsers
      .filter(
        (u) =>
          String(u.Role) === "Peserta" &&
          String(u.Mentor_ID) === String(user.userId),
      )
      .map((u) => ({ userId: u.User_ID, nama: u.Nama, divisi: u.Divisi }));
    const menteeIds = mentees.map((m) => String(m.userId));
    const menteeNames = mentees.map((m) => String(m.nama).trim().toLowerCase());

    const mentorKanban = allKanban.filter((k) => {
      if (!k.User_ID && !k.Peserta) return true;
      return (
        menteeIds.includes(String(k.User_ID)) ||
        menteeNames.includes(String(k.Peserta).trim().toLowerCase())
      );
    });

    const mentorDaily = allDaily.filter((d) => {
      if (!d.User_ID) return true;
      return menteeIds.includes(String(d.User_ID));
    });

    const mentors = allUsers
      .filter((u) => String(u.Role) === "Mentor")
      .map((u) => ({ userId: u.User_ID, nama: u.Nama, divisi: u.Divisi }));

    return jsonResponse({
      status: "success",
      data: {
        mentees: mentees,
        mentors: mentors,
        kanbanItems: mentorKanban.slice().reverse(),
        weeklyPlans: mentorKanban.slice().reverse(),
        dailyActivities: mentorDaily.slice().reverse(),
      },
    });
  }

  if (user.role === "HR") {
    const safeUsers = allUsers.map((u) => ({
      userId: u.User_ID,
      nama: u.Nama,
      email: u.Email,
      role: u.Role,
      divisi: u.Divisi,
      mentorId: u.Mentor_ID,
    }));

    return jsonResponse({
      status: "success",
      data: {
        today: getTodayStr(),
        users: safeUsers,
        kanbanItems: allKanban.slice().reverse(),
        weeklyPlans: allKanban.slice().reverse(),
        dailyActivities: allDaily.slice().reverse(),
      },
    });
  }

  return jsonResponse({ status: "error", message: "Role tidak valid." });
}

function handleSaveKanban(user, payload) {
  if (!payload) {
    return jsonResponse({ status: "error", message: "Payload Kanban kosong." });
  }

  const taskVal = String(payload.task || payload.targetMingguan || "").trim();
  if (!taskVal) {
    return jsonResponse({ status: "error", message: "Task wajib diisi." });
  }

  // Kolom C = Peserta (pelaksana task), Kolom D = User (pihak yang menugaskan)
  const rawPeserta =
    Array.isArray(payload.peserta) && payload.peserta.length > 0
      ? payload.peserta
      : [String(payload.peserta || payload.user || "").trim()];
  const pesertaVal = rawPeserta.filter(Boolean).join(", ");

  const rawAssigner =
    Array.isArray(payload.assigners) && payload.assigners.length > 0
      ? payload.assigners
      : [
          String(
            payload.assigner || payload.user || user.nama || "",
          ).trim(),
        ];
  const assignerVal = rawAssigner.filter(Boolean).join(", ");

  const rawPriority = String(payload.priority || "Medium").trim();
  const priorityVal = KANBAN_PRIORITY_OPTIONS.includes(rawPriority)
    ? rawPriority
    : "Medium";

  const rawStatus = String(payload.status || "To Do").trim();
  // Status kerja kanban yang valid: To Do, In Progress, Done, Canceled
  const statusVal = KANBAN_STATUS_OPTIONS.includes(rawStatus)
    ? rawStatus
    : "To Do";

  const dueDateVal = String(payload.dueDate || payload.mingguKe || "").trim();
  const startVal = String(payload.start || "").trim();
  // Auto-fill End Date saat status Done
  const endVal =
    statusVal === "Done" && !String(payload.end || "").trim()
      ? getTodayStr()
      : String(payload.end || "").trim();
  const evidenceVal = String(
    payload.evidence || payload.outputLink || "",
  ).trim();

  const rawReview = String(
    payload.review || payload.catatan || "",
  ).trim();
  const reviewVal = KANBAN_REVIEW_OPTIONS.includes(rawReview)
    ? rawReview
    : (user.role === "Mentor" ? "Ditugaskan" : "Menunggu");

  const notesVal = String(
    payload.notes || payload.note || "",
  ).trim();

  const userIdVal = String(payload.userId || user.userId || "").trim();
  const mentorIdVal = String(
    payload.mentorId ||
      (user.role === "Mentor" ? user.userId : user.mentorId) ||
      "",
  ).trim();

  // Mentor multi-assign: satu task per peserta yang dipilih
  if (
    user.role === "Mentor" &&
    payload.assignedTo &&
    Array.isArray(payload.assignedTo) &&
    payload.assignedTo.length > 0
  ) {
    var lockM = LockService.getScriptLock();
    lockM.waitLock(10000);
    try {
      var ssM = SpreadsheetApp.getActiveSpreadsheet();
      var sheetM = ssM.getSheetByName(SHEETS.WEEKLY);
      if (!sheetM) {
        setupDatabase();
        sheetM = ssM.getSheetByName(SHEETS.WEEKLY);
      }
      ensureKanbanHeaders_(sheetM);
      var lastRowM = getLastDataRow(sheetM);
      var nextNoM = 1;
      if (lastRowM >= 2) {
        var noColM = sheetM
          .getRange(2, 1, lastRowM - 1, 1)
          .getValues()
          .flat()
          .map(Number)
          .filter(function (n) {
            return !isNaN(n);
          });
        if (noColM.length > 0) nextNoM = Math.max.apply(null, noColM) + 1;
      }
      var created = [];
      payload.assignedTo.forEach(function (assignee) {
        var aUserId = String(assignee.userId || "").trim();
        var aPesertaName = String(assignee.nama || "").trim();
        var newRowM = getLastDataRow(sheetM) + 1;
        // Kolom: A=No, B=Task, C=Peserta, D=User, E=Priority, F=Status, G=Due Date,
        //        H=Start Date, I=End Date, J=Evidence, K=Review, L=Notes, M=User_ID, N=Mentor_ID
        sheetM
          .getRange(newRowM, 1, 1, 14)
          .setValues([
            [
              nextNoM,
              taskVal,
              aPesertaName,
              assignerVal,
              priorityVal,
              statusVal,
              dueDateVal,
              startVal,
              endVal,
              evidenceVal,
              reviewVal,
              notesVal,
              aUserId,
              String(user.userId || "").trim(),
            ],
          ]);
        ensureKanbanRowDropdown_(sheetM, newRowM);
        created.push({ rowIndex: newRowM, no: nextNoM, userId: aUserId });
        nextNoM++;
      });
      return jsonResponse({
        status: "success",
        message: created.length + " task berhasil ditugaskan.",
        data: { items: created },
      });
    } finally {
      lockM.releaseLock();
    }
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEETS.WEEKLY);
    if (!sheet) {
      setupDatabase();
      sheet = ss.getSheetByName(SHEETS.WEEKLY);
    }

    ensureKanbanHeaders_(sheet);

    const lastRow = getLastDataRow(sheet);
    let targetRow = -1;

    if (
      payload.rowIndex &&
      Number(payload.rowIndex) >= 2 &&
      Number(payload.rowIndex) <= lastRow
    ) {
      targetRow = Number(payload.rowIndex);
    } else if ((payload.no || payload.planId || payload.id) && lastRow >= 2) {
      const targetNo = String(
        payload.no || payload.planId || payload.id,
      ).trim();
      const noValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < noValues.length; i++) {
        if (String(noValues[i][0]).trim() === targetNo) {
          targetRow = i + 2;
          break;
        }
      }
    }

    if (targetRow !== -1) {
      const existingNo =
        sheet.getRange(targetRow, 1).getValue() || targetRow - 1;
      const existingUserId =
        sheet.getLastColumn() >= 13
          ? String(sheet.getRange(targetRow, 13).getValue()).trim()
          : "";
      const existingMentorId =
        sheet.getLastColumn() >= 14
          ? String(sheet.getRange(targetRow, 14).getValue()).trim()
          : "";
      const existingReview =
        sheet.getLastColumn() >= 11
          ? String(
              sheet.getRange(targetRow, 11).getValue() || "Menunggu",
            ).trim()
          : "Menunggu";
      const existingNotes =
        sheet.getLastColumn() >= 12
          ? String(sheet.getRange(targetRow, 12).getValue() || "").trim()
          : "";

      if (
        user.role === "Peserta" &&
        existingUserId &&
        existingUserId !== String(user.userId).trim()
      ) {
        return jsonResponse({ status: "error", message: "Akses ditolak." });
      }

      // Jika task sudah disetujui/ditolak, tidak boleh lagi diedit (kecuali oleh HR).
      if (
        user.role === "Peserta" &&
        (existingReview === "Disetujui" || existingReview === "Ditolak")
      ) {
        return jsonResponse({
          status: "error",
          message: "Task yang sudah disetujui atau ditolak tidak dapat diedit.",
        });
      }

      // Jika peserta magang mengupdate kanban yang sudah ada, ubah Review ke Menunggu
      // agar mentor meninjau ulang perubahan tersebut.
      // Jika sebelumnya Ditugaskan, peserta pertama kali update -> Menunggu review.
      const finalReviewVal = user.role === "Peserta" ? "Menunggu" : reviewVal;
      // Notes hanya boleh diubah oleh mentor/HR; peserta tidak menimpa notes mentor.
      const finalNotesVal = user.role === "Peserta" ? existingNotes : notesVal;

      sheet
        .getRange(targetRow, 1, 1, 14)
        .setValues([
          [
            existingNo,
            taskVal,
            pesertaVal || "",
            assignerVal,
            priorityVal,
            statusVal,
            dueDateVal,
            startVal,
            endVal,
            evidenceVal,
            finalReviewVal,
            finalNotesVal,
            userIdVal || existingUserId,
            mentorIdVal || existingMentorId,
          ],
        ]);
      ensureKanbanRowDropdown_(sheet, targetRow);

      return jsonResponse({
        status: "success",
        message: "Kanban baris ke-" + targetRow + " berhasil diperbarui.",
        data: { rowIndex: targetRow, no: existingNo },
      });
    }

    let nextNo = 1;
    if (lastRow >= 2) {
      const noCol = sheet
        .getRange(2, 1, lastRow - 1, 1)
        .getValues()
        .flat()
        .map(Number)
        .filter((n) => !isNaN(n));
      if (noCol.length > 0) {
        nextNo = Math.max.apply(null, noCol) + 1;
      }
    }

    const newRow = lastRow + 1;
    sheet
      .getRange(newRow, 1, 1, 14)
      .setValues([
        [
          nextNo,
          taskVal,
          pesertaVal,
          assignerVal,
          priorityVal,
          statusVal,
          dueDateVal,
          startVal,
          endVal,
          evidenceVal,
          reviewVal,
          notesVal,
          userIdVal,
          mentorIdVal,
        ],
      ]);
    ensureKanbanRowDropdown_(sheet, newRow);

    return jsonResponse({
      status: "success",
      message: "Kanban berhasil disimpan ke database spreadsheet.",
      data: { rowIndex: newRow, no: nextNo },
    });
  } finally {
    lock.releaseLock();
  }
}

function handleSaveDailyActivity(user, payload) {
  if (!payload) {
    return jsonResponse({
      status: "error",
      message: "Payload Daily Activity kosong.",
    });
  }

  const dateVal = String(
    payload.date || payload.tanggal || getTodayStr(),
  ).trim();
  const startVal = String(payload.start || "").trim();
  const endVal = String(payload.end || "").trim();
  const activitiesVal = String(
    payload.activities || payload.deskripsi || "",
  ).trim();

  if (!dateVal || !activitiesVal) {
    return jsonResponse({
      status: "error",
      message: "Date dan Activities wajib diisi.",
    });
  }

  const durationVal =
    payload.duration !== undefined && payload.duration !== ""
      ? Number(payload.duration)
      : computeDurationMinutes_(startVal, endVal);

  const rawActStatus = String(
    payload.activitiesStatus || payload.status || "Done",
  ).trim();
  const activitiesStatusVal = DAILY_STATUS_ALL_OPTIONS.includes(rawActStatus)
    ? rawActStatus
    : "Done";

  const rawTgtStatus = String(payload.targetStatus || "").trim();
  const targetStatusVal = TARGET_STATUS_OPTIONS.includes(rawTgtStatus)
    ? rawTgtStatus
    : "";

  const targetDescVal = String(payload.targetDesc || "").trim();
  const noteVal = String(payload.note || payload.catatan || "").trim();
  const evidenceVal = String(
    payload.evidence || payload.outputLink || "",
  ).trim();

  const userIdVal = String(user.userId || payload.userId || "").trim();
  const userNameVal = String(user.nama || payload.namaPeserta || "").trim();
  const mentorIdVal = String(user.mentorId || payload.mentorId || "").trim();

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEETS.DAILY);
    if (!sheet) {
      setupDatabase();
      sheet = ss.getSheetByName(SHEETS.DAILY);
    }

    if (sheet.getLastColumn() < 15) {
      // Ensure all 15 columns exist
      var missingStart = sheet.getLastColumn() + 1;
      var allDailyHeaders = [
        "No",
        "Date",
        "Start",
        "End",
        "Duration",
        "Activities",
        "Activities Status",
        "Target Desc",
        "Target Status",
        "Note",
        "Achieved Target Evidence",
        "User_ID",
        "Nama_Peserta",
        "Mentor_ID",
        "Status Review",
      ];
      if (missingStart <= 15) {
        var missing = allDailyHeaders.slice(missingStart - 1);
        sheet
          .getRange(1, missingStart, 1, missing.length)
          .setValues([missing])
          .setFontWeight("bold")
          .setBackground("#16325B")
          .setFontColor("#ffffff");
      }
    }

    const lastRow = getLastDataRow(sheet);
    let targetRow = -1;

    if (
      payload.rowIndex &&
      Number(payload.rowIndex) >= 2 &&
      Number(payload.rowIndex) <= lastRow
    ) {
      targetRow = Number(payload.rowIndex);
    } else if (payload.no && lastRow >= 2) {
      const noValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < noValues.length; i++) {
        if (String(noValues[i][0]).trim() === String(payload.no).trim()) {
          targetRow = i + 2;
          break;
        }
      }
    }

    if (targetRow !== -1) {
      var rowMentorId =
        sheet.getLastColumn() >= 14
          ? String(sheet.getRange(targetRow, 14).getValue() || "").trim()
          : "";
      var rowUserId =
        sheet.getLastColumn() >= 12
          ? String(sheet.getRange(targetRow, 12).getValue() || "").trim()
          : "";
      var existingNo = sheet.getRange(targetRow, 1).getValue() || targetRow - 1;
      var existingReview =
        sheet.getLastColumn() >= 15
          ? String(
              sheet.getRange(targetRow, 15).getValue() || "Menunggu",
            ).trim()
          : "Menunggu";

      // Peserta hanya boleh edit/hapus daily activity saat status review masih Menunggu
      if (user.role === "Peserta" && existingReview !== "Menunggu") {
        return jsonResponse({
          status: "error",
          message:
            "Aktivitas yang sudah disetujui, revisi, atau ditolak tidak dapat diedit. Silakan buat aktivitas baru.",
        });
      }

      // Mentor boleh edit status aktivitas dan status target milik anak bimbingannya
      if (user.role === "Mentor") {
        if (rowMentorId && rowMentorId !== String(user.userId).trim()) {
          return jsonResponse({
            status: "error",
            message: "Anda bukan mentor dari peserta ini.",
          });
        }
        var mentorActivitiesStatusVal = activitiesStatusVal;
        if (
          payload.activitiesStatus &&
          ACTIVITY_STATUS_OPTIONS.includes(payload.activitiesStatus)
        ) {
          mentorActivitiesStatusVal = payload.activitiesStatus;
        }
        var mentorTargetStatusVal = targetStatusVal;
        if (
          payload.targetStatus &&
          TARGET_STATUS_OPTIONS.includes(payload.targetStatus)
        ) {
          mentorTargetStatusVal = payload.targetStatus;
        }
        sheet
          .getRange(targetRow, 1, 1, 15)
          .setValues([
            [
              existingNo,
              dateVal,
              startVal,
              endVal,
              durationVal,
              activitiesVal,
              mentorActivitiesStatusVal,
              targetDescVal,
              mentorTargetStatusVal,
              noteVal,
              evidenceVal,
              rowUserId || userIdVal,
              userNameVal,
              rowMentorId || mentorIdVal,
              existingReview,
            ],
          ]);
        sheet.getRange(targetRow, 3, 1, 2).setNumberFormat("@");
        ensureDailyRowDropdown_(sheet, targetRow);

        return jsonResponse({
          status: "success",
          message:
            "Daily_Activity baris ke-" + targetRow + " berhasil diperbarui.",
          data: { rowIndex: targetRow, no: existingNo },
        });
      }

      // Peserta mengupdate: pertahankan Status Review yang ada,
      // dan pastikan Activities Status tidak tertimpa oleh Status Review
      var pesertaActivitiesStatusVal = activitiesStatusVal;
      if (!ACTIVITY_STATUS_OPTIONS.includes(pesertaActivitiesStatusVal)) {
        pesertaActivitiesStatusVal = String(
          sheet.getRange(targetRow, 7).getValue() || "Done",
        ).trim();
      }
      if (!ACTIVITY_STATUS_OPTIONS.includes(pesertaActivitiesStatusVal)) {
        pesertaActivitiesStatusVal = "Done";
      }
      sheet
        .getRange(targetRow, 1, 1, 15)
        .setValues([
          [
            existingNo,
            dateVal,
            startVal,
            endVal,
            durationVal,
            activitiesVal,
            pesertaActivitiesStatusVal,
            targetDescVal,
            targetStatusVal,
            noteVal,
            evidenceVal,
            userIdVal,
            userNameVal,
            mentorIdVal,
            existingReview,
          ],
        ]);
      sheet.getRange(targetRow, 3, 1, 2).setNumberFormat("@");
      ensureDailyRowDropdown_(sheet, targetRow);

      return jsonResponse({
        status: "success",
        message:
          "Daily_Activity baris ke-" + targetRow + " berhasil diperbarui.",
        data: { rowIndex: targetRow, no: existingNo },
      });
    }

    let nextNo = 1;
    if (lastRow >= 2) {
      const noCol = sheet
        .getRange(2, 1, lastRow - 1, 1)
        .getValues()
        .flat()
        .map(Number)
        .filter((n) => !isNaN(n));
      if (noCol.length > 0) {
        nextNo = Math.max.apply(null, noCol) + 1;
      }
    }

    const newRow = lastRow + 1;
    sheet
      .getRange(newRow, 1, 1, 15)
      .setValues([
        [
          nextNo,
          dateVal,
          startVal,
          endVal,
          durationVal,
          activitiesVal,
          activitiesStatusVal,
          targetDescVal,
          targetStatusVal,
          noteVal,
          evidenceVal,
          userIdVal,
          userNameVal,
          mentorIdVal,
          "Menunggu",
        ],
      ]);
    sheet.getRange(newRow, 3, 1, 2).setNumberFormat("@");
    ensureDailyRowDropdown_(sheet, newRow);

    return jsonResponse({
      status: "success",
      message: "Daily_Activity berhasil disimpan ke database spreadsheet.",
      data: { rowIndex: newRow, no: nextNo },
    });
  } finally {
    lock.releaseLock();
  }
}

function handleReviewItem(user, payload) {
  if (user.role !== "Mentor") {
    return jsonResponse({
      status: "error",
      message: "Hanya Mentor yang dapat melakukan review.",
    });
  }
  if (
    !payload ||
    !payload.id ||
    !["Ditugaskan", "Disetujui", "Revisi", "Menunggu", "Ditolak"].includes(payload.status)
  ) {
    return jsonResponse({
      status: "error",
      message: "Payload review tidak valid.",
    });
  }

  const isKanban = payload.type === "weekly" || payload.type === "kanban";
  const sheetName = isKanban ? SHEETS.WEEKLY : SHEETS.DAILY;

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) {
      return jsonResponse({
        status: "error",
        message: "Sheet tidak ditemukan.",
      });
    }

    const lastRow = getLastDataRow(sheet);
    if (lastRow < 2) {
      return jsonResponse({
        status: "error",
        message: "Item tidak ditemukan.",
      });
    }

    const noValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

    for (var i = 0; i < noValues.length; i++) {
      if (String(noValues[i][0]).trim() === String(payload.id).trim()) {
        var rowNum = i + 2;

        if (isKanban) {
          var rowMentorId =
            sheet.getLastColumn() >= 14
              ? String(sheet.getRange(rowNum, 14).getValue() || "").trim()
              : "";
          if (rowMentorId && rowMentorId !== String(user.userId).trim()) {
            return jsonResponse({
              status: "error",
              message: "Anda bukan mentor dari peserta ini.",
            });
          }
          ensureKanbanRowDropdown_(sheet, rowNum);
          sheet.getRange(rowNum, 11).setValue(payload.status);
          // Catatan review mentor masuk ke kolom Notes (L)
          if (payload.catatan) {
            sheet.getRange(rowNum, 12).setValue(String(payload.catatan).trim());
          }
        } else {
          // Daily: Status Review di kolom 15, Mentor_ID di kolom 14
          var dailyMentorId =
            sheet.getLastColumn() >= 14
              ? String(sheet.getRange(rowNum, 14).getValue() || "").trim()
              : "";
          if (dailyMentorId && dailyMentorId !== String(user.userId).trim()) {
            return jsonResponse({
              status: "error",
              message: "Anda bukan mentor dari peserta ini.",
            });
          }
          ensureDailyRowDropdown_(sheet, rowNum);
          // Status Review → kolom 15
          sheet.getRange(rowNum, 15).setValue(payload.status);

          // Activities Status (kolom 7) hanya diubah jika mentor kirim override valid.
          // Status Review = Ditolak/Disetujui/Revisi/Menunggu TIDAK mengoverride
          // Activities Status secara otomatis, agar tidak melanggar data validation
          // spreadsheet (Done, On Progress, Cancelled, Rescheduled).
          if (
            payload.activitiesStatus &&
            ACTIVITY_STATUS_OPTIONS.includes(payload.activitiesStatus)
          ) {
            sheet.getRange(rowNum, 7).setValue(payload.activitiesStatus);
          }

          // Target Status (kolom 9) hanya diubah jika mentor kirim override
          if (
            payload.targetStatus &&
            TARGET_STATUS_OPTIONS.includes(payload.targetStatus)
          ) {
            sheet.getRange(rowNum, 9).setValue(payload.targetStatus);
          }

          // Catatan mentor di kolom Note (kolom 10)
          if (payload.catatan) {
            sheet.getRange(rowNum, 10).setValue(String(payload.catatan).trim());
          }
        }

        return jsonResponse({
          status: "success",
          message: "Review berhasil diubah menjadi " + payload.status + ".",
        });
      }
    }
    return jsonResponse({ status: "error", message: "Item tidak ditemukan." });
  } finally {
    lock.releaseLock();
  }
}

function handleDeleteItem(user, payload) {
  if (!payload || !["weekly", "kanban", "daily"].includes(payload.type)) {
    return jsonResponse({
      status: "error",
      message: "Payload hapus tidak valid.",
    });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (payload.type === "weekly" || payload.type === "kanban") {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
        SHEETS.WEEKLY,
      );
      if (!sheet) {
        return jsonResponse({
          status: "error",
          message: "Sheet Kanban tidak ditemukan.",
        });
      }

      const lastRow = getLastDataRow(sheet);
      let targetRow = -1;

      if (
        payload.rowIndex &&
        Number(payload.rowIndex) >= 2 &&
        Number(payload.rowIndex) <= lastRow
      ) {
        targetRow = Number(payload.rowIndex);
      } else if ((payload.id || payload.no) && lastRow >= 2) {
        const targetNo = String(payload.no || payload.id).trim();
        const noValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (let i = 0; i < noValues.length; i++) {
          if (String(noValues[i][0]).trim() === targetNo) {
            targetRow = i + 2;
            break;
          }
        }
      }

      if (targetRow === -1) {
        return jsonResponse({
          status: "error",
          message: "Item Kanban tidak ditemukan.",
        });
      }

      const currentReview = String(
        sheet.getRange(targetRow, 11).getValue() || "",
      ).trim();
      const rowOwnerId =
        sheet.getLastColumn() >= 13
          ? String(sheet.getRange(targetRow, 13).getValue() || "").trim()
          : "";

      if (user.role === "Peserta") {
        if (rowOwnerId && rowOwnerId !== String(user.userId).trim()) {
          return jsonResponse({ status: "error", message: "Akses ditolak." });
        }
        if (currentReview === "Disetujui" || currentReview === "Ditolak") {
          return jsonResponse({
            status: "error",
            message:
              "Item yang sudah disetujui atau ditolak tidak bisa dihapus.",
          });
        }
      } else if (user.role !== "HR") {
        return jsonResponse({
          status: "error",
          message: "Role tidak memiliki izin menghapus item.",
        });
      }

      sheet.deleteRow(targetRow);
      return jsonResponse({
        status: "success",
        message: "Data Kanban berhasil dihapus.",
      });
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
      SHEETS.DAILY,
    );
    if (!sheet) {
      return jsonResponse({
        status: "error",
        message: "Sheet Daily_Activity tidak ditemukan.",
      });
    }

    const lastRow = getLastDataRow(sheet);
    let targetRow = -1;

    if (
      payload.rowIndex &&
      Number(payload.rowIndex) >= 2 &&
      Number(payload.rowIndex) <= lastRow
    ) {
      targetRow = Number(payload.rowIndex);
    } else if ((payload.id || payload.no) && lastRow >= 2) {
      const targetNo = String(payload.no || payload.id).trim();
      const noValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < noValues.length; i++) {
        if (String(noValues[i][0]).trim() === targetNo) {
          targetRow = i + 2;
          break;
        }
      }
    }

    if (targetRow === -1) {
      return jsonResponse({
        status: "error",
        message: "Data Daily Activity tidak ditemukan.",
      });
    }

    if (user.role === "Peserta") {
      const rowOwnerId =
        sheet.getLastColumn() >= 12
          ? String(sheet.getRange(targetRow, 12).getValue()).trim()
          : "";
      if (rowOwnerId && rowOwnerId !== String(user.userId).trim()) {
        return jsonResponse({ status: "error", message: "Akses ditolak." });
      }
      const currentReview =
        sheet.getLastColumn() >= 15
          ? String(
              sheet.getRange(targetRow, 15).getValue() || "Menunggu",
            ).trim()
          : "Menunggu";
      if (currentReview !== "Menunggu") {
        return jsonResponse({
          status: "error",
          message:
            "Aktivitas yang sudah disetujui, revisi, atau ditolak tidak dapat dihapus.",
        });
      }
    } else if (user.role !== "HR") {
      return jsonResponse({
        status: "error",
        message: "Role tidak memiliki izin menghapus item.",
      });
    }

    sheet.deleteRow(targetRow);
    return jsonResponse({
      status: "success",
      message: "Data Daily Activity berhasil dihapus.",
    });
  } finally {
    lock.releaseLock();
  }
}

function handleResetPin(adminUser, payload) {
  if (adminUser.role !== "HR") {
    return jsonResponse({
      status: "error",
      message: "Hanya HR yang dapat mereset PIN pengguna.",
    });
  }
  if (!payload || (!payload.userId && !payload.email)) {
    return jsonResponse({
      status: "error",
      message: "Target userId atau email wajib diisi.",
    });
  }

  const nextPin = String(payload.newPin || "1234").trim();
  if (!/^\d{4,8}$/.test(nextPin)) {
    return jsonResponse({
      status: "error",
      message: "PIN harus terdiri dari 4 sampai 8 digit angka.",
    });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
      SHEETS.USERS,
    );
    if (!sheet) {
      return jsonResponse({
        status: "error",
        message: "Sheet Users tidak ditemukan.",
      });
    }

    const values = sheet.getDataRange().getValues();
    const targetId = payload.userId ? String(payload.userId).trim() : "";
    const targetEmail = payload.email
      ? String(payload.email).trim().toLowerCase()
      : "";

    for (let i = 1; i < values.length; i++) {
      const rowUserId = String(values[i][0]).trim();
      const rowEmail = String(values[i][2]).trim().toLowerCase();

      if (
        (targetId && rowUserId === targetId) ||
        (targetEmail && rowEmail === targetEmail)
      ) {
        const rowNum = i + 1;
        const pinCell = sheet.getRange(rowNum, 4);
        pinCell.setNumberFormat("@");
        pinCell.setValue(nextPin);

        return jsonResponse({
          status: "success",
          message: "PIN berhasil direset.",
          data: {
            userId: rowUserId,
            email: rowEmail,
            resetPin: nextPin,
          },
        });
      }
    }

    return jsonResponse({
      status: "error",
      message: "Pengguna tidak ditemukan.",
    });
  } finally {
    lock.releaseLock();
  }
}

function handleChangePin(user, payload) {
  if (!payload || !payload.currentPin || !payload.newPin) {
    return jsonResponse({
      status: "error",
      message: "PIN lama dan PIN baru wajib diisi.",
    });
  }

  const currentPin = String(payload.currentPin).trim();
  const newPin = String(payload.newPin).trim();

  if (!/^\d{4,8}$/.test(newPin)) {
    return jsonResponse({
      status: "error",
      message: "PIN baru harus terdiri dari 4 sampai 8 digit angka.",
    });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
      SHEETS.USERS,
    );
    if (!sheet) {
      return jsonResponse({
        status: "error",
        message: "Sheet Users tidak ditemukan.",
      });
    }

    const values = sheet.getDataRange().getValues();

    for (let i = 1; i < values.length; i++) {
      const rowUserId = String(values[i][0]).trim();
      const rowPin = String(values[i][3]).trim();

      if (rowUserId === String(user.userId).trim()) {
        if (rowPin !== currentPin) {
          return jsonResponse({
            status: "error",
            message: "PIN lama tidak sesuai.",
          });
        }

        const rowNum = i + 1;
        const pinCell = sheet.getRange(rowNum, 4);
        pinCell.setNumberFormat("@");
        pinCell.setValue(newPin);

        return jsonResponse({
          status: "success",
          message:
            "PIN berhasil diubah. Silakan gunakan PIN baru saat login berikutnya.",
        });
      }
    }

    return jsonResponse({
      status: "error",
      message: "Akun pengguna tidak ditemukan.",
    });
  } finally {
    lock.releaseLock();
  }
}

function authenticateUser(email, pin) {
  if (!email || !pin) return null;
  const users = getSheetObjects(SHEETS.USERS);
  const cleanEmail = String(email).trim().toLowerCase();
  const cleanPin = String(pin).trim();

  const found = users.find(
    (u) =>
      String(u.Email).trim().toLowerCase() === cleanEmail &&
      String(u.PIN).trim() === cleanPin,
  );

  if (!found) return null;
  return {
    userId: String(found.User_ID),
    nama: String(found.Nama),
    email: String(found.Email),
    role: String(found.Role),
    divisi: String(found.Divisi),
    mentorId: String(found.Mentor_ID || ""),
  };
}

function getSheetObjects(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];
  const lastDataRow = getLastDataRow(sheet);
  if (lastDataRow <= 1) return [];

  const lastCol = sheet.getLastColumn();
  const data = sheet.getRange(1, 1, lastDataRow, lastCol).getValues();
  const headers = data[0];
  const tz = Session.getScriptTimeZone();

  return data
    .slice(1)
    .map((row, idx) => ({ row, rowIndex: idx + 2 }))
    .filter((item) => item.row[0] !== "")
    .map(({ row, rowIndex }) => {
      const obj = { _rowIndex: rowIndex };
      headers.forEach((h, idx) => {
        let val = row[idx];
        if (val instanceof Date) {
          val = Utilities.formatDate(val, tz, "yyyy-MM-dd");
        }
        obj[h] = val !== undefined && val !== null ? String(val) : "";
      });
      return obj;
    });
}

function computeDurationMinutes_(startStr, endStr) {
  if (!startStr || !endStr) return "";
  const parseHM = (s) => {
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

function getTodayStr() {
  return Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "yyyy-MM-dd",
  );
}

function getCurrentIsoWeek() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return d.getFullYear() + "-W" + ("0" + weekNum).slice(-2);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
