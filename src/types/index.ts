// Types for the extension

// Settings type
export interface Settings {
  partnerAccount: string[];
  expenceList: string[];
  expenceSubList: string[];
  rate: number;
  partnerName: string;
  gasApiUrl?: string;
  gasApiToken?: string;
}

// Transaction data type
export interface Transaction {
  ID: string;
  計算対象: string;
  日付: string;
  内容: string;
  '金額（円）': string;
  保有金融機関: string;
  大項目: string;
  中項目: string;
  メモ: string;
  振替: string;
}

// Calculation results type
export interface CalculationResults {
  sum: number;
  partner: number;
  need: number;
  lack: number;
  specialTotal: number;
  specialOffer: number;
}

// Message types
export type MessageAction =
  | { action: 'getResults' }
  | { action: 'refreshData' }
  | { action: 'pageLoaded' }
  | { action: 'contentScriptReady' };

export type MessageResponse =
  | { results: CalculationResults }
  | { results: CalculationResults; success: boolean }
  | { success: boolean };