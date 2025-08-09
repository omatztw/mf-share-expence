/**
 * Google Apps Script for MoneyForward Chrome Extension
 * This script handles data from the Chrome extension and writes it to the spreadsheet
 * 
 * Setup:
 * 1. Create a new Google Spreadsheet
 * 2. Go to Extensions > Apps Script
 * 3. Copy this code into the script editor
 * 4. Deploy as Web App with following settings:
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the Web App URL and the token for the Chrome extension
 */

// Configuration - Set your own secret token here
const SECRET_TOKEN = 'your-secret-token-here-change-this'; // Change this to your own secret

/**
 * Handle POST requests from the Chrome extension
 */
function doPost(e) {
  try {
    // Parse the request
    const data = JSON.parse(e.postData.contents);
    
    // Verify token
    if (data.token !== SECRET_TOKEN) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: 'Invalid token'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Extract month and amount
    const month = data.month;
    const amount = data.amount;
    
    // Validate data
    if (!month || amount === undefined) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: 'Missing required fields: month or amount'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get the active spreadsheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Find or create row for the month
    const result = updateOrInsertData(sheet, month, amount);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: result.message,
        data: {
          month: month,
          amount: amount,
          row: result.row
        }
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle GET requests (for testing)
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      message: 'MoneyForward Spreadsheet API is running',
      version: '1.0.0'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Update existing row or insert new row with month and amount
 */
function updateOrInsertData(sheet, month, amount) {
  // Parse the input month (format: "2025/10")
  const [yearStr, monthStr] = month.split('/');
  const inputYear = parseInt(yearStr);
  const inputMonth = parseInt(monthStr);
  
  // Get all data in column A (months)
  const lastRow = sheet.getLastRow();
  let targetRow = -1;
  
  if (lastRow > 0) {
    const monthColumn = sheet.getRange(1, 1, lastRow, 1).getValues();
    
    // Search for existing month by comparing year and month
    for (let i = 0; i < monthColumn.length; i++) {
      const cellValue = monthColumn[i][0];
      
      // Skip if cell is empty or not a date
      if (!cellValue) continue;
      
      // Try to interpret as date
      let cellDate;
      if (cellValue instanceof Date) {
        cellDate = cellValue;
      } else if (typeof cellValue === 'string') {
        // Try parsing string as date
        cellDate = new Date(cellValue);
      } else {
        continue;
      }
      
      // Check if it's a valid date
      if (isNaN(cellDate.getTime())) continue;
      
      // Compare year and month
      if (cellDate.getFullYear() === inputYear && 
          cellDate.getMonth() + 1 === inputMonth) {
        targetRow = i + 1;
        break;
      }
    }
  }
  
  if (targetRow > 0) {
    // Update existing row
    sheet.getRange(targetRow, 2).setValue(amount);
    
    return {
      message: 'Data updated successfully',
      row: targetRow
    };
  } else {
    // Insert new row
    const newRow = lastRow + 1;
    
    // Create a date for the first day of the month
    const dateValue = new Date(inputYear, inputMonth - 1, 1);
    sheet.getRange(newRow, 1).setValue(dateValue);
    sheet.getRange(newRow, 2).setValue(amount);
    
    // Add headers if this is the first row
    if (newRow === 1) {
      sheet.getRange(1, 1).setValue('Month');
      sheet.getRange(1, 2).setValue('Amount');
      
      // Insert data in row 2 instead
      sheet.getRange(2, 1).setValue(dateValue);
      sheet.getRange(2, 2).setValue(amount);
      
      return {
        message: 'Headers and data created successfully',
        row: 2
      };
    }
    
    return {
      message: 'New data inserted successfully',
      row: newRow
    };
  }
}

/**
 * Test function to verify the script is working
 * Run this function in the Apps Script editor to test
 */
function testScript() {
  const testData = {
    month: '2025/01',
    amount: '12345',
    token: SECRET_TOKEN
  };
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const result = updateOrInsertData(sheet, testData.month, testData.amount);
  
  console.log('Test result:', result);
}