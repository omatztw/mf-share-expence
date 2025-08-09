import React, { useEffect, useState } from "react";
import { CalculationResults, Settings } from "../types";
import {
  loadSettings,
  saveSettings,
  addItemToSetting,
  removeItemFromSetting,
} from "../utils/storage";
import "./Popup.css";

const Popup: React.FC = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState<"results" | "settings">("results");

  // State for settings
  const [settings, setSettings] = useState<Settings>({
    partnerAccount: [],
    expenceList: [],
    expenceSubList: [],
    rate: 0.5,
    partnerName: "パートナー",
    gasApiUrl: "",
    gasApiToken: "",
  });

  // State for calculation results
  const [results, setResults] = useState<CalculationResults>({
    sum: 0,
    partner: 0,
    need: 0,
    lack: 0,
    specialTotal: 0,
    specialOffer: 0,
  });

  // State for status message
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: "info" | "success" | "error";
  }>({
    text: "MoneyForwardの家計簿ページを開くと自動的に計算されます",
    type: "info",
  });

  // State for input values
  const [inputs, setInputs] = useState({
    expenseCategory: "",
    expenseSubcategory: "",
    partnerAccount: "",
  });

  // Load settings and results on component mount
  useEffect(() => {
    loadSettings().then((loadedSettings) => {
      setSettings(loadedSettings);
      updateResults();
    });
  }, []);

  // Update results from content script
  const updateResults = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (
        !tabs[0] ||
        !tabs[0].url ||
        !tabs[0].url.includes("moneyforward.com/cf")
      ) {
        showStatusMessage(
          "MoneyForwardの家計簿ページを開いてください",
          "error"
        );
        return;
      }

      try {
        chrome.tabs.sendMessage(
          tabs[0].id!,
          { action: "getResults" },
          (response) => {
            // Check for runtime error (content script not ready)
            if (chrome.runtime.lastError) {
              console.error("Error:", chrome.runtime.lastError.message);
              showStatusMessage(
                "コンテンツスクリプトとの通信エラー。ページを再読み込みしてください",
                "error"
              );

              // Try to inject the content script manually
              chrome.scripting
                .executeScript({
                  target: { tabId: tabs[0].id! },
                  files: ["content.js"],
                })
                .then(() => {
                  console.log("Content script injected manually");
                  // Wait a moment and try again
                  setTimeout(() => {
                    updateResults();
                  }, 500);
                })
                .catch((err) => {
                  console.error("Failed to inject content script:", err);
                });

              return;
            }

            if (response && response.results) {
              setResults(response.results);
              showStatusMessage("計算結果を更新しました", "success");
            } else {
              showStatusMessage(
                "MoneyForwardの家計簿ページでデータを取得できませんでした",
                "error"
              );
            }
          }
        );
      } catch (error) {
        console.error("Error sending message:", error);
        showStatusMessage("通信エラーが発生しました", "error");
      }
    });
  };

  // Refresh data from content script
  const refreshData = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (
        !tabs[0] ||
        !tabs[0].url ||
        !tabs[0].url.includes("moneyforward.com/cf")
      ) {
        showStatusMessage(
          "MoneyForwardの家計簿ページを開いてください",
          "error"
        );
        return;
      }

      try {
        chrome.tabs.sendMessage(
          tabs[0].id!,
          { action: "refreshData" },
          (response) => {
            // Check for runtime error (content script not ready)
            if (chrome.runtime.lastError) {
              console.error("Error:", chrome.runtime.lastError.message);
              showStatusMessage(
                "コンテンツスクリプトとの通信エラー。ページを再読み込みしてください",
                "error"
              );

              // Try to inject the content script manually
              chrome.scripting
                .executeScript({
                  target: { tabId: tabs[0].id! },
                  files: ["content.js"],
                })
                .then(() => {
                  console.log("Content script injected manually");
                  // Wait a moment and try again
                  setTimeout(() => {
                    refreshData();
                  }, 500);
                })
                .catch((err) => {
                  console.error("Failed to inject content script:", err);
                });

              return;
            }

            if (response && response.success) {
              updateResults();
            } else {
              showStatusMessage("データの更新に失敗しました", "error");
            }
          }
        );
      } catch (error) {
        console.error("Error sending message:", error);
        showStatusMessage("通信エラーが発生しました", "error");
      }
    });
  };

  // Save settings
  const handleSaveSettings = () => {
    saveSettings({
      rate: settings.rate,
      partnerName: settings.partnerName,
      gasApiUrl: settings.gasApiUrl,
      gasApiToken: settings.gasApiToken,
    }).then(() => {
      showStatusMessage("設定を保存しました", "success");
    });
  };

  // Show status message with auto-reset
  const showStatusMessage = (
    text: string,
    type: "info" | "success" | "error"
  ) => {
    setStatusMessage({ text, type });

    if (type !== "info") {
      setTimeout(() => {
        setStatusMessage({
          text: "MoneyForwardの家計簿ページを開くと自動的に計算されます",
          type: "info",
        });
      }, 3000);
    }
  };

  // Add item to a list setting
  const handleAddItem = async (
    key: "expenceList" | "expenceSubList" | "partnerAccount",
    inputKey: "expenseCategory" | "expenseSubcategory" | "partnerAccount"
  ) => {
    const value = inputs[inputKey].trim();

    if (!value) return;

    if (settings[key].includes(value)) {
      showStatusMessage("既に登録されている項目です", "error");
      return;
    }

    const newArray = await addItemToSetting(key, value);
    setSettings({ ...settings, [key]: newArray });
    setInputs({ ...inputs, [inputKey]: "" });
  };

  // Remove item from a list setting
  const handleRemoveItem = async (
    key: "expenceList" | "expenceSubList" | "partnerAccount",
    index: number
  ) => {
    const newArray = await removeItemFromSetting(key, index);
    setSettings({ ...settings, [key]: newArray });
  };

  // Open external link in new tab
  const handleOpenLink = (url: string) => {
    chrome.tabs.create({ url: url });
  };

  return (
    <div className='container'>
      <div className='header'>
        <h2>MoneyForward 経費計算</h2>
      </div>

      <div className={`status-message ${statusMessage.type}`}>
        {statusMessage.text}
      </div>

      <div className='tabs'>
        <div
          className={`tab ${activeTab === "results" ? "active" : ""}`}
          onClick={() => setActiveTab("results")}
        >
          結果
        </div>
        <div
          className={`tab ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          設定
        </div>
      </div>

      <div className={`tab-content ${activeTab === "results" ? "active" : ""}`}>
        <div className='card'>
          <div className='row'>
            <div className='label'>経費合計:</div>
            <div className='value'>{results.sum.toLocaleString()} 円</div>
          </div>
          <div className='row'>
            <div className='label'>{settings.partnerName}支払い:</div>
            <div className='value'>{results.need.toLocaleString()} 円</div>
          </div>
          <div className='row'>
            <div className='label'>{settings.partnerName}持ち出し:</div>
            <div className='value'>{results.partner.toLocaleString()} 円</div>
          </div>
          <div className='row'>
            <div className='label'>{settings.partnerName}不足:</div>
            <div className='value'>{results.lack.toLocaleString()} 円</div>
          </div>
        </div>

        <button className='button' onClick={refreshData}>
          データを更新
        </button>
      </div>

      <div
        className={`tab-content ${activeTab === "settings" ? "active" : ""}`}
      >
        <div className='input-group'>
          <label className='input-label'>割合設定</label>
          <input
            type='number'
            min='0'
            max='1'
            step='0.01'
            value={settings.rate}
            onChange={(e) =>
              setSettings({
                ...settings,
                rate: parseFloat(e.target.value),
              })
            }
          />
        </div>

        <div className='input-group'>
          <label className='input-label'>パートナー名</label>
          <input
            type='text'
            value={settings.partnerName}
            onChange={(e) =>
              setSettings({
                ...settings,
                partnerName: e.target.value,
              })
            }
          />
        </div>

        <div className='input-group'>
          <label className='input-label'>経費大項目設定</label>
          <div className='tag-container'>
            {settings.expenceList.map((item, index) => (
              <div className='tag' key={index}>
                {item}
                <span
                  className='tag-remove'
                  onClick={() => handleRemoveItem("expenceList", index)}
                >
                  ×
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", marginTop: "8px" }}>
            <input
              type='text'
              placeholder='追加する項目'
              value={inputs.expenseCategory}
              onChange={(e) =>
                setInputs({
                  ...inputs,
                  expenseCategory: e.target.value,
                })
              }
            />
            <button
              className='button'
              style={{ marginLeft: "8px" }}
              onClick={() => handleAddItem("expenceList", "expenseCategory")}
            >
              追加
            </button>
          </div>
        </div>

        <div className='input-group'>
          <label className='input-label'>経費中項目設定</label>
          <div className='tag-container'>
            {settings.expenceSubList.map((item, index) => (
              <div className='tag' key={index}>
                {item}
                <span
                  className='tag-remove'
                  onClick={() => handleRemoveItem("expenceSubList", index)}
                >
                  ×
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", marginTop: "8px" }}>
            <input
              type='text'
              placeholder='追加する項目'
              value={inputs.expenseSubcategory}
              onChange={(e) =>
                setInputs({
                  ...inputs,
                  expenseSubcategory: e.target.value,
                })
              }
            />
            <button
              className='button'
              style={{ marginLeft: "8px" }}
              onClick={() =>
                handleAddItem("expenceSubList", "expenseSubcategory")
              }
            >
              追加
            </button>
          </div>
        </div>

        <div className='input-group'>
          <label className='input-label'>パートナー金融機関設定</label>
          <div className='tag-container'>
            {settings.partnerAccount.map((item, index) => (
              <div className='tag' key={index}>
                {item}
                <span
                  className='tag-remove'
                  onClick={() => handleRemoveItem("partnerAccount", index)}
                >
                  ×
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", marginTop: "8px" }}>
            <input
              type='text'
              placeholder='追加する金融機関'
              value={inputs.partnerAccount}
              onChange={(e) =>
                setInputs({
                  ...inputs,
                  partnerAccount: e.target.value,
                })
              }
            />
            <button
              className='button'
              style={{ marginLeft: "8px" }}
              onClick={() => handleAddItem("partnerAccount", "partnerAccount")}
            >
              追加
            </button>
          </div>
        </div>

        <div className='input-group'>
          <label className='input-label'>スプレッドシート連携設定</label>
          <div style={{ marginBottom: "8px" }}>
            <input
              type='text'
              placeholder='GAS API URL'
              value={settings.gasApiUrl || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  gasApiUrl: e.target.value,
                })
              }
              style={{ marginBottom: "8px" }}
            />
            <input
              type='password'
              placeholder='API トークン'
              value={settings.gasApiToken || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  gasApiToken: e.target.value,
                })
              }
            />
            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
              ※ GASのセットアップ方法は{" "}
              <span 
                onClick={() => handleOpenLink('https://github.com/omatztw/mf-share-expence/blob/main/README.md#google-スプレッドシート連携')}
                style={{ 
                  color: "blue", 
                  textDecoration: "underline", 
                  cursor: "pointer" 
                }}
              >
                README.md
              </span>{" "}
              を参照
            </div>
          </div>
        </div>

        <button className='button' onClick={handleSaveSettings}>
          設定を保存
        </button>
      </div>
    </div>
  );
};

export default Popup;
