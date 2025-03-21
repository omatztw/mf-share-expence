# 家計分担 for MoneyForward

家計分担 for MoneyForwardは、MoneyForwardの家計簿ページを開くと自動的に経費を計算し、パートナーとの負担割合を計算するChrome拡張機能です。

## 機能

- MoneyForwardの家計簿ページから自動的に取引データを抽出
- 設定した割合に基づいてパートナーとの経費分担を計算
- 計算結果をMoneyForwardページ上に表示
- パートナーの支払い状況と不足額を一目で確認

## インストール方法

### 開発版をインストール

1. このリポジトリをクローンまたはダウンロードします
2. `npm install` を実行して依存関係をインストールします
3. `npm run build` を実行して拡張機能をビルドします
4. Chromeで `chrome://extensions/` を開きます
5. 右上の「デベロッパーモード」をオンにします
6. 「パッケージ化されていない拡張機能を読み込む」をクリックします
7. ビルドされた `dist` ディレクトリを選択します

## 使い方

1. [MoneyForwardの家計簿ページ](https://moneyforward.com/cf)を開きます
2. 拡張機能が自動的に取引データを抽出し、計算を行います
3. 計算結果がページの右上に表示されます
4. Chrome拡張機能のアイコンをクリックすると、詳細な結果と設定画面が表示されます

### 計算結果の見方

- **経費合計**: 計算対象となる取引の合計金額
- **パートナー支払い**: パートナーが支払うべき金額（設定した割合に基づく）
- **パートナー持ち出し**: パートナーの口座から実際に支払われた金額
- **パートナー不足**: パートナーが追加で支払うべき金額

## 設定方法

拡張機能のポップアップで「設定」タブを選択すると、以下の設定が可能です：

### 基本設定

- **割合設定**: パートナーの負担割合（0〜1の数値、例: 0.5 = 50%）
- **パートナー名**: 表示に使用するパートナーの名前

### 詳細設定

- **経費大項目設定**: 計算から除外する大項目カテゴリ
- **経費中項目設定**: 計算から除外する中項目カテゴリ
- **パートナー金融機関設定**: パートナーの金融機関（これらの口座からの支払いがパートナーの持ち出しとして計算されます）

## 特殊機能

### メモ欄の割合指定

取引のメモ欄に数字を入力すると、その取引に対して特別な割合計算が適用されます：

- メモ欄に数字（例: 30）を入力すると、その取引金額の指定した割合（例: 30%）がパートナーの負担額に加算されます
- これは特定の取引に対して通常の割合設定とは異なる分担比率を適用したい場合に便利です

## トラブルシューティング

- **データが表示されない場合**: MoneyForwardのページを再読み込みするか、拡張機能のポップアップで「データを更新」ボタンをクリックしてください
- **計算結果が正しくない場合**: 設定を確認し、除外カテゴリやパートナー金融機関が正しく設定されているか確認してください
- **拡張機能が動作しない場合**: Chromeの拡張機能ページで拡張機能が有効になっているか確認してください

## 技術的な詳細

- React + TypeScriptで開発
- Viteを使用したビルドシステム
- Chrome Extension Manifest V3に対応
- コンテンツスクリプトを使用してMoneyForwardページと連携
