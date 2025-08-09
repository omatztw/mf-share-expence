### Google Spreadsheet Connector

計算結果を Google Spreadsheet に保存する機能

- Chrome Extension 側の実装と Google Spreadsheet 側の実装が必要になる
- Google Spreadsheet 側は、GAS で WEB API を作り公開するものとする

#### 要求

##### Chrome Extension

- MF の家計簿ページに飛んで経費計算の結果が表示された時
- Google Spreadsheet 連携ボタンを表示
- クリックすると Google Spreadsheet に「パートナー不足」の値を飛ばす

##### Google Spreadsheet

- Google Spreadsheet 側は、WEB API を待ち受けるようにして以下を受信

```json
{
  "month": "2025/09",
  "amount": "215937"
}
```

- A 列を検索し、month の値と同じ月がある場合は同行の B 列に amount の値を挿入
- month の値がない場合は、A 列に month の値、B 列に amount の値を挿入
