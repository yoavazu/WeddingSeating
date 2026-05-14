function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    const data = JSON.parse(e.postData.contents);
    
    const action = data.action; // 'add' or 'remove'
    const colIndex = data.colIndex; // e.g., 2 for Column B
    const guestName = data.guestName;
    
    // Dynamically find where the guests should be by looking for the Table Number and the "סך הכל" (Total) row.
    let tableNumberRow = -1;
    let totalRow = -1;
    
    for (let r = 1; r <= 150; r++) {
      const val = sheet.getRange(r, colIndex).getValue();
      if (val === "סך הכל") {
        totalRow = r;
        break;
      }
      // Assuming table number is the first numeric value we encounter
      if (tableNumberRow === -1 && typeof val === 'number') {
        tableNumberRow = r;
      }
    }
    
    if (tableNumberRow === -1 || totalRow === -1) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Could not find table boundaries (Table Number or 'סך הכל')." }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'add') {
      const guestCount = data.guestCount;
      
      // Find the first empty row between Table Number and Total
      let targetRow = -1;
      for (let r = tableNumberRow + 1; r < totalRow; r++) {
        const cellValue = sheet.getRange(r, colIndex).getValue();
        if (!cellValue || cellValue === "") {
          targetRow = r;
          break;
        }
      }
      
      if (targetRow !== -1) {
        sheet.getRange(targetRow, colIndex).setValue(guestName);
        sheet.getRange(targetRow, colIndex + 1).setValue(guestCount);
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Guest added successfully." }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Table is full." }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    } 
    else if (action === 'remove') {
      
      let foundRow = -1;
      for (let r = tableNumberRow + 1; r < totalRow; r++) {
        if (sheet.getRange(r, colIndex).getValue() == guestName) {
          foundRow = r;
          break;
        }
      }
      
      if (foundRow !== -1) {
        sheet.getRange(foundRow, colIndex).clearContent();
        sheet.getRange(foundRow, colIndex + 1).clearContent();
        
        // Shift cells up to fill the gap
        for (let r = foundRow; r < totalRow - 1; r++) {
          const nextName = sheet.getRange(r + 1, colIndex).getValue();
          const nextCount = sheet.getRange(r + 1, colIndex + 1).getValue();
          sheet.getRange(r, colIndex).setValue(nextName);
          sheet.getRange(r, colIndex + 1).setValue(nextCount);
        }
        
        // Clear the last row before the total
        sheet.getRange(totalRow - 1, colIndex).clearContent();
        sheet.getRange(totalRow - 1, colIndex + 1).clearContent();

        return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Guest removed." }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Guest not found." }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    else if (action === 'addTable') {
      const tableName = data.tableName;
      const tableNumber = data.tableNumber;
      
      let tableNumberRow = -1;
      let totalRow = -1;
      // Search in a known column (like B which is 2) to find the table number row and total row
      for (let r = 1; r <= 150; r++) {
        const val = sheet.getRange(r, 2).getValue();
        if (val === "סך הכל") { totalRow = r; break; }
        if (tableNumberRow === -1 && typeof val === 'number') { tableNumberRow = r; }
      }
      
      if (tableNumberRow === -1) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Could not find table structure to add a new table." }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const tableNameRow = tableNumberRow > 1 ? tableNumberRow - 1 : 1;
      
      let targetCol = -1;
      for (let c = 2; c <= 200; c += 2) {
        const val = sheet.getRange(tableNameRow, c).getValue();
        if (!val || val === "") {
          targetCol = c;
          break;
        }
      }
      
      if (targetCol !== -1) {
        sheet.getRange(tableNameRow, targetCol).setValue(tableName);
        sheet.getRange(tableNumberRow, targetCol).setValue(tableNumber);
        
        if (totalRow !== -1) {
          sheet.getRange(totalRow, targetCol).setValue("סך הכל");
          sheet.getRange(totalRow + 1, targetCol).setValue("שולחן של");
        }
        
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Table added successfully." }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({ success: false, message: "No empty columns found to add table." }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Unknown action." }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle CORS preflight requests
function doOptions(e) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(headers);
}
