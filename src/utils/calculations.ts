import { CalculationResults, Settings, Transaction } from '../types';

// Calculate expenses based on transaction data and settings
export const calculateExpenses = (
  transactions: Transaction[],
  settings: Settings
): CalculationResults => {
  const { expenceList, expenceSubList, partnerAccount, rate } = settings;
  
  const expenceSet = new Set(expenceList);
  const expenceSubSet = new Set(expenceSubList);
  const partnerAccountSet = new Set(partnerAccount);
  
  // Filter transactions based on settings
  const filtered = transactions
    .filter(d => d.計算対象 === '1')
    .filter(d => !expenceSet.has(d.大項目))
    .filter(d => !expenceSubSet.has(d.中項目))
    .filter(d => !!parseInt(d['金額（円）']));
  
  // Special transactions (with percentage in memo)
  const special = filtered.filter(d => !Number.isNaN(parseInt(d.メモ)));
  
  // Calculate total for special transactions
  const specialTotal = special.reduce(
    (p, c) => p + parseInt(c['金額（円）']),
    0
  );
  
  // Calculate discount amount for special transactions
  const specialOffer = special.reduce(
    (p, c) => p + (parseInt(c['金額（円）']) * parseInt(c.メモ)) / 100,
    0
  );
  
  // Calculate partner's payment amount
  const partner = filtered
    .filter(d => partnerAccountSet.has(d.保有金融機関))
    .reduce((p, c) => p + parseInt(c['金額（円）']), 0);
  
  // Calculate total expenses
  const expenceAll = filtered.reduce(
    (p, c) => p + parseInt(c['金額（円）']),
    0
  );
  
  // Calculate amount partner should pay
  const need = Math.floor((expenceAll - specialTotal) * rate + specialOffer);
  
  // Calculate partner's shortage
  const lack = need - partner;
  
  // Return calculation results
  return {
    sum: expenceAll,
    partner: partner,
    need: need,
    lack: lack,
    specialTotal: specialTotal,
    specialOffer: specialOffer
  };
};