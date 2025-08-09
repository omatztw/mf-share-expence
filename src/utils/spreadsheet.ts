import { Settings } from '../types';

/**
 * Send data to Google Spreadsheet via GAS Web API
 */
export async function sendToSpreadsheet(
  month: string,
  amount: number,
  settings: Settings
): Promise<{ success: boolean; message: string }> {
  // Check if GAS API settings are configured
  if (!settings.gasApiUrl || !settings.gasApiToken) {
    return {
      success: false,
      message: 'スプレッドシート連携が設定されていません。設定画面でGAS APIのURLとトークンを入力してください。'
    };
  }

  try {
    // Prepare the data
    const data = {
      month: month,
      amount: amount.toString(),
      token: settings.gasApiToken
    };

    // Send POST request to GAS Web API
    await fetch(settings.gasApiUrl, {
      method: 'POST',
      mode: 'no-cors', // GAS doesn't support CORS, so we use no-cors mode
      headers: {
        'Content-Type': 'text/plain' // GAS requires text/plain for no-cors
      },
      body: JSON.stringify(data)
    });

    // Note: Due to no-cors mode, we can't read the response body
    // We assume success if no error is thrown
    return {
      success: true,
      message: 'スプレッドシートへの保存リクエストを送信しました。'
    };
  } catch (error) {
    console.error('Error sending to spreadsheet:', error);
    return {
      success: false,
      message: `エラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`
    };
  }
}

/**
 * Extract month from MoneyForward page
 * Expects format like "2025/8/1 - 2025/8/31" and returns "2025/08"
 */
export function extractMonthFromPage(): string | null {
  // Look for the header with the date range
  const headerElement = document.querySelector('.fc-header-title h2');
  
  if (!headerElement) {
    console.error('Month header element not found');
    return null;
  }

  const dateText = headerElement.textContent?.trim();
  
  if (!dateText) {
    console.error('No date text found in header');
    return null;
  }

  // Extract the start date (e.g., "2025/8/1" from "2025/8/1 - 2025/8/31")
  const dateMatch = dateText.match(/(\d{4})\/(\d{1,2})\/\d{1,2}/);
  
  if (!dateMatch) {
    console.error('Could not parse date from:', dateText);
    return null;
  }

  const year = dateMatch[1];
  const month = dateMatch[2].padStart(2, '0'); // Pad month with zero if needed
  
  return `${year}/${month}`;
}

/**
 * Test the GAS API connection
 */
export async function testSpreadsheetConnection(
  settings: Settings
): Promise<{ success: boolean; message: string }> {
  if (!settings.gasApiUrl) {
    return {
      success: false,
      message: 'GAS APIのURLが設定されていません'
    };
  }

  try {
    // Send GET request to test the API
    await fetch(settings.gasApiUrl, {
      method: 'GET',
      mode: 'no-cors'
    });

    // Due to no-cors, we can't read the response
    // We assume success if no error is thrown
    return {
      success: true,
      message: 'GAS APIへの接続テストが完了しました'
    };
  } catch (error) {
    return {
      success: false,
      message: `接続エラー: ${error instanceof Error ? error.message : '不明なエラー'}`
    };
  }
}