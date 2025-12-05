
// --- GOOGLE APPS SCRIPT CODE (Paste into Code.gs) ---

const SPREADSHEET_ID = ""; // Leave empty to use the active spreadsheet if bound.
const SHEET_NAME = "Transactions";
const SECURE_PIN = "239535"; // PIN for sensitive actions

function doGet(e) {
  const userId = e.parameter.userId;
  const action = e.parameter.action;

  if (!userId) {
    return ContentService.createTextOutput(JSON.stringify({ error: "User ID required" })).setMimeType(ContentService.MimeType.JSON);
  }

  return handleFetchData(userId);
}

function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    const action = contents.action;
    const userId = contents.userId;

    if (!userId) throw new Error("User ID required");

    if (action === "addTransaction") {
      return handleAddTransaction(userId, contents.data);
    } else if (action === "updateStatus") {
      // STRICT PIN CHECK
      if (String(contents.pin) !== String(SECURE_PIN)) {
        throw new Error("Incorrect PIN");
      }
      return handleUpdateTransaction(userId, contents.transactionId, contents.updates);
    } else {
      throw new Error("Invalid Action");
    }

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      message: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// --- Helpers ---

function getSheet() {
  let ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Setup Headers
    sheet.appendRow([
      "id", "date", "userId", "type", "amount", "original_amount", 
      "bank_account", "reason", "is_paid", "customer_name", 
      "phone_name", "fault", "price_status"
    ]);
  }
  return sheet;
}

function handleFetchData(userId) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);

  const transactions = rows
    .filter(row => row[2] === userId) // Filter by UserID
    .map(row => {
      let obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });

  return ContentService.createTextOutput(JSON.stringify(transactions)).setMimeType(ContentService.MimeType.JSON);
}

function handleAddTransaction(userId, data) {
  const sheet = getSheet();
  
  const row = [
    data.id || Utilities.getUuid(),
    data.date || new Date().toISOString(),
    userId,
    data.type || 'general',
    data.amount || 0,
    data.original_amount || 0,
    data.bank_account || '',
    data.reason || '',
    data.is_paid === true || data.is_paid === 'TRUE',
    data.customer_name || '',
    data.phone_name || '',
    data.fault || '',
    data.price_status || ''
  ];

  sheet.appendRow(row);
  
  return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
}

function handleUpdateTransaction(userId, txId, updates) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // Map headers to column indices
  const colMap = {};
  headers.forEach((h, i) => colMap[h] = i);

  let found = false;
  
  // Iterate rows (skip header)
  for (let i = 1; i < data.length; i++) {
    if (data[i][colMap['id']] === txId && data[i][colMap['userId']] === userId) {
      
      // Apply updates
      Object.keys(updates).forEach(key => {
        if (colMap.hasOwnProperty(key)) {
          let value = updates[key];
          // Ensure numbers are numbers
          if (key === 'amount' || key === 'original_amount') {
             value = Number(value);
          }
          // Ensure booleans are consistent
          if (key === 'is_paid') {
             value = (value === true || value === 'true' || value === 'TRUE');
          }
          sheet.getRange(i + 1, colMap[key] + 1).setValue(value);
        }
      });
      
      found = true;
      break;
    }
  }

  if (!found) throw new Error("Transaction not found");

  return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
}
