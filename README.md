# 見積PDFアプリ

JSON から日本語の見積PDFを生成する TypeScript/Node.js アプリです。API で PDF を返し、ブラウザUI（フォーム）からも生成できます。

## 主要機能
- 見積データ(JSON) → PDF を生成
- `/docs` に Swagger UI、`/openapi.yaml` に OpenAPI 仕様を公開
- `backend/public` の静的UIから PDF 生成（画像は Data URL 対応）

## セットアップ / 起動

```bash
cd backend
npm install
npm run dev
```

起動後: `http://localhost:3000`

## エンドポイント
- `GET /api/health` → `{ ok: true }`
- `POST /api/estimate/pdf` → PDF バイナリ
- `GET /docs` → Swagger UI
- `GET /openapi.yaml` → OpenAPI 仕様

## PDF 生成（API）

```bash
curl -X POST http://localhost:3000/api/estimate/pdf \
  -H "Content-Type: application/json" \
  -d "{\"customer\":\"山田商事\",\"date\":\"2026-01-24\",\"taxRate\":0.10,\"taxRounding\":\"round\",\"items\":[{\"name\":\"電気工事\",\"unitPrice\":12000,\"quantity\":10,\"unit\":\"式\",\"spec\":\"一式\"}]}" \
  --output estimate.pdf
```

### PowerShell 例

```powershell
@"
{"customer":"山田商事","date":"2026-01-24","taxRate":0.10,"taxRounding":"round","items":[{"name":"電気工事","unitPrice":12000,"quantity":10,"unit":"式","spec":"一式"}]}
"@ | curl.exe -X POST "http://localhost:3000/api/estimate/pdf" `
  -H "Content-Type: application/json" `
  --data-binary "@-" `
  --output "estimate.pdf"
```

## リクエストJSON（主な項目）
- `customer` (string) 依頼元
- `date` (YYYY-MM-DD)
- `taxRate` (number|string) 例: `0.10`
- `taxRounding` (`round` | `floor` | `ceil`)
- `items` (array)
  - `name` (string) 品目名
  - `unitPrice` (number|string)
  - `quantity` (number|string)
  - `unit` (string)
  - `spec` (string)
- 任意: `estimateTotal`（計算結果の上書き）
- 任意: `projectName`, `projectPlace`, `validity`, `payment`
- 任意: `issuerTitle`, `issuerName`, `issuerAddr`, `issuerTel`, `issuerMobile`
- 任意: `company`, `companyMain`, `postId`, `address`, `tel`, `phone`
- 任意: `showStamp` (boolean)
- 任意: `stampImageDataUrl`, `staffImageDataUrl`, `creatorImageDataUrl`

詳細は `backend/openapi.yaml` を参照してください。

## アーキテクチャ（バックエンド）
- `backend/src/domain`：エンティティ、ドメインサービス
- `backend/src/application`：ユースケース、ポート
- `backend/src/infra`：HTMLテンプレート、Puppeteer PDF 生成
- `backend/src/presentation`：Express ルーティング / コントローラ
- `backend/src/main.ts`：起動エントリ

## 環境変数
- `DEFAULT_STAMP_DATA_URL`（任意: 角印などのデフォルト画像 Data URL）
- `DEFAULT_STAFF_STAMP_DATA_URL`（任意: 担当者印のデフォルト画像 Data URL）
- `DEFAULT_CREATOR_STAMP_DATA_URL`（任意: 作成者印のデフォルト画像 Data URL）
- `DEFAULT_COMPANY_MAIN`（任意: 会社名のデフォルト）
- `DEFAULT_COMPANY`（任意: 会社主名のデフォルト）
- `DEFAULT_POST_ID`（任意: 郵便番号のデフォルト）
- `DEFAULT_ADDRESS`（任意: 住所のデフォルト）
- `DEFAULT_TEL`（任意: TEL・FAX のデフォルト）
- `BASIC_AUTH_USER`（任意: Basic認証ユーザー）
- `BASIC_AUTH_PASS`（任意: Basic認証パスワード）

### デフォルト印鑑の設定例（Data URL）
```bash
# 例: PNG を Data URL にして環境変数へ（macOS/Linux）
STAMP_B64=$(base64 -i path/to/stamp.png | tr -d '\n')
export DEFAULT_STAFF_STAMP_DATA_URL="data:image/png;base64,${STAMP_B64}"
export DEFAULT_CREATOR_STAMP_DATA_URL="data:image/png;base64,${STAMP_B64}"
```

## その他
- ルート直下の `index.html` と `estimate.pdf` はサンプル/旧資産です。
