import { Settings } from '../types';

// Default settings
export const DEFAULT_SETTINGS: Settings = {
  partnerAccount: [],
  expenceList: [],
  expenceSubList: [],
  rate: 0.5,
  partnerName: 'パートナー'
};

// Load settings from Chrome storage
export const loadSettings = async (): Promise<Settings> => {
  return new Promise((resolve) => {
    chrome.storage.sync.get([
      'partnerAccount',
      'expenceList',
      'expenceSubList',
      'rate',
      'partnerName'
    ], (result) => {
      const settings: Settings = {
        partnerAccount: result.partnerAccount || DEFAULT_SETTINGS.partnerAccount,
        expenceList: result.expenceList || DEFAULT_SETTINGS.expenceList,
        expenceSubList: result.expenceSubList || DEFAULT_SETTINGS.expenceSubList,
        rate: result.rate !== undefined ? result.rate : DEFAULT_SETTINGS.rate,
        partnerName: result.partnerName || DEFAULT_SETTINGS.partnerName
      };
      resolve(settings);
    });
  });
};

// Save settings to Chrome storage
export const saveSettings = async (settings: Partial<Settings>): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.sync.set(settings, () => {
      resolve();
    });
  });
};

// Save a specific setting
export const saveSetting = async <K extends keyof Settings>(
  key: K, 
  value: Settings[K]
): Promise<void> => {
  const update = { [key]: value } as Partial<Settings>;
  return saveSettings(update);
};

// Add an item to an array setting
export const addItemToSetting = async <K extends keyof Settings>(
  key: K,
  item: string
): Promise<string[]> => {
  const settings = await loadSettings();
  const array = settings[key] as unknown as string[];
  
  if (array.includes(item)) {
    return array;
  }
  
  const newArray = [...array, item];
  await saveSetting(key, newArray as unknown as Settings[K]);
  return newArray;
};

// Remove an item from an array setting
export const removeItemFromSetting = async <K extends keyof Settings>(
  key: K,
  index: number
): Promise<string[]> => {
  const settings = await loadSettings();
  const array = settings[key] as unknown as string[];
  
  if (index < 0 || index >= array.length) {
    return array;
  }
  
  const newArray = [...array.slice(0, index), ...array.slice(index + 1)];
  await saveSetting(key, newArray as unknown as Settings[K]);
  return newArray;
};