# 見積PDFアプリ

JSONの見積データを受け取り、PDFを返すシンプルなAPIです。UIは `server.js` の `renderHtml()` で定義しています。

## できること
- 見積PDFをAPIで生成
- 小計/税/合計の自動計算
- 消費税の端数処理（round/floor/ceil）

## セットアップ
```bash
npm install
npm start
```
起動後: `http://localhost:3000`

## ヘルスチェック
```bash
curl http://localhost:3000/api/health
```

## PDF生成(API)
```bash
curl -X POST http://localhost:3000/api/estimate/pdf \
  -H "Content-Type: application/json" \
  -d "{\"customer\":\"山田\",\"date\":\"2026-01-24\",\"taxRate\":0.10,\"taxRounding\":\"round\",\"items\":[{\"name\":\"足場仮設工事\",\"unitPrice\":12000,\"quantity\":10,\"unit\":\"式\",\"spec\":\"一般\"}]}" \
  --output estimate.pdf
```

### PowerShell 例
```powershell
@"
{"customer":"山田","date":"2026-01-24","taxRate":0.10,"taxRounding":"round","items":[{"name":"足場仮設工事","unitPrice":12000,"quantity":10,"unit":"式","spec":"一般"}]}
"@ | curl.exe -X POST "http://localhost:3000/api/estimate/pdf" `
  -H "Content-Type: application/json" `
  --data-binary "@-" `
  --output "estimate.pdf"
```

## リクエスト仕様
- `customer` (string) 顧客名
- `date` (YYYY-MM-DD) 見積日
- `taxRate` (number) 例: `0.10`
- `taxRounding` (`round` | `floor` | `ceil`)
- `items` (array)
  - `name` (string) 品目
  - `unitPrice` (number) 単価
  - `quantity` (number) 数量
  - `unit` (string) 単位
  - `spec` (string) 仕様
- 任意: `estimateTotal` (number) 表示用の見積総額を上書きしたい場合

## 主要ファイル
- `server.js` API本体 / PDFレイアウト
- `public/` 静的ファイル

## 注意
- Puppeteer が利用できる環境が必要です。
- Windows の PowerShell では `--data-binary @-` が失敗する場合があるため、"@-" を使ってください。
