import Papa from 'papaparse';

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/10_3364l6pH7gQJXTi6p8EZ-zRf5SdIMjBWFnLJotEVM/export?format=csv';

// Note: The user needs to deploy the Apps Script and put the URL here for edits to work.
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzH5GrgtPNWioliO1lEFCoV_670ZN3Ghrs5OtTMnPfIHEPlum2LGdsBYMTD_v4rBQDq/exec';

export async function fetchTableData() {
  try {
    const response = await fetch(SHEET_CSV_URL);
    const csvText = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        complete: (results) => {
          const data = results.data;
          const tables = parseSheetData(data);
          resolve(tables);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error("Error fetching sheet data:", error);
    throw error;
  }
}

function parseSheetData(data) {
  const tables = [];

  if (data.length < 5) return tables; // Not enough data

  // Dynamically find the row that contains the table names
  let tableNamesRowIndex = -1;
  for (let i = 0; i < Math.min(20, data.length); i++) {
    // Look for the "Table Name" header added by the user, or one of the known table names
    if (data[i].includes('Table Name') || data[i].includes('מקסים - חברים')) {
      tableNamesRowIndex = i;
      break;
    }
  }

  // Fallback if we couldn't find it dynamically
  if (tableNamesRowIndex === -1) {
    tableNamesRowIndex = 3;
  }

  const tableNamesRow = data[tableNamesRowIndex];
  const tableNumbersRow = data[tableNamesRowIndex + 1];
  const guestsStartRowIndex = tableNamesRowIndex + 2;

  // Iterate through columns in steps of 2 starting from index 1 (Column B)
  for (let colIndex = 1; colIndex < tableNamesRow.length; colIndex += 2) {
    const tableName = tableNamesRow[colIndex];
    const tableNumber = tableNumbersRow[colIndex];

    // If there's no table number, skip
    // Also skip the instructional column added by the user
    if (!tableNumber || tableNumber.trim() === '' || tableNumber === 'Table Number' || tableName === 'Table Name') continue;

    const guests = [];
    let totalGuests = 0;

    // Guests are from guestsStartRowIndex up to guestsStartRowIndex + 16 (17 rows total)
    for (let rowIndex = guestsStartRowIndex; rowIndex <= guestsStartRowIndex + 16; rowIndex++) {
      if (data[rowIndex]) {
        const guestName = data[rowIndex][colIndex];
        const guestCountStr = data[rowIndex][colIndex + 1];

        if (guestName && guestName.trim() !== '') {
          const count = parseInt(guestCountStr, 10) || 1;

          // Calculate the absolute row index for Google Sheets (assuming guests always start at Row 10 in the sheet)
          // Google Sheets rows are 1-indexed. The guests start at absolute row 10.
          // The offset in the array is rowIndex - guestsStartRowIndex.
          const absoluteSheetRow = 10 + (rowIndex - guestsStartRowIndex);

          guests.push({
            name: guestName.trim(),
            count: count,
            rowIndex: absoluteSheetRow
          });
          totalGuests += count;
        }
      }
    }

    tables.push({
      id: `table-${tableNumber}-${colIndex}`,
      number: tableNumber,
      name: tableName ? tableName.trim() : '',
      colIndex: colIndex + 1, // 1-indexed for Apps Script (Column B is 2)
      guests: guests,
      totalGuests: totalGuests
    });
  }

  return tables;
}

export async function addGuestToTable(colIndex, guestName, guestCount) {
  if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE') {
    throw new Error("אנא הגדר את כתובת ה-Apps Script כדי לאפשר עריכה");
  }

  const payload = {
    action: 'add',
    colIndex: colIndex,
    guestName: guestName,
    guestCount: guestCount
  };

  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    }
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || result.error);
  }
  return result;
}

export async function removeGuestFromTable(colIndex, guestName) {
  if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE') {
    throw new Error("אנא הגדר את כתובת ה-Apps Script כדי לאפשר עריכה");
  }

  const payload = {
    action: 'remove',
    colIndex: colIndex,
    guestName: guestName
  };

  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    }
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || result.error);
  }
  return result;
}

export async function addTable(tableName, tableNumber) {
  if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE') {
    throw new Error("אנא הגדר את כתובת ה-Apps Script כדי לאפשר עריכה");
  }

  const payload = {
    action: 'addTable',
    tableName: tableName,
    tableNumber: tableNumber
  };

  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    }
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || result.error);
  }
  return result;
}
