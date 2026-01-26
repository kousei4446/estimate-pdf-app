# Estimate PDF App - Agent Notes

## Overview
- Generates a Japanese estimate PDF from JSON payloads.
- Backend is a TypeScript/Node.js Express app using Puppeteer for HTML->PDF.
- A static browser UI is served from `backend/public` for interactive PDF generation.
- OpenAPI spec is in `backend/openapi.yaml` and served at `/openapi.yaml` and `/docs`.

## Quick Start (backend)
```bash
cd backend
npm install
npm run dev
```
Server defaults to `http://localhost:3000`.

## Key Endpoints
- `GET /api/health` -> `{ ok: true }`
- `POST /api/estimate/pdf` -> returns PDF binary
- `GET /docs` -> Swagger UI
- `GET /openapi.yaml` -> OpenAPI spec

## Architecture (clean-ish layers)
- `backend/src/domain`
  - `entities/EstimatePayload.ts`: request shape
  - `services/estimateCalculator.ts`: tax, totals, formatting, date conversion
- `backend/src/application`
  - `usecases/GenerateEstimatePdf.ts`
  - `ports/HtmlRenderer.ts`, `PdfGenerator.ts`
- `backend/src/infra`
  - `templates/EstimateHtmlRenderer.ts`: inline HTML/CSS template
  - `pdf/PuppeteerPdfGenerator.ts`: Puppeteer PDF generation
- `backend/src/presentation/http`
  - Express app setup + routes + controller

## UI (static)
- `backend/public/index.html`, `backend/public/style.css`, `backend/public/app.js`
  - Form-driven UI for building JSON and opening the PDF in a new tab.
  - Uploads staff/creator images as base64 data URLs.

## Data Model Notes
- `EstimatePayload` supports `items[]` with `name`, `unitPrice`, `quantity`, `unit`, `spec`.
- `taxRate` can be number or string; `taxRounding` is `round | floor | ceil`.
- `estimateTotal` can override computed total.
- Image fields: `staffImageDataUrl`, `creatorImageDataUrl`, `stampImageDataUrl`.
- `resolveDate()` renders Reiwa date for >= 2019-05-01.

## PDF Rendering Details
- `EstimateHtmlRenderer` builds a full HTML document with inline CSS.
- `PuppeteerPdfGenerator` renders A4 landscape with background printing.
- Images are sanitized to data URLs: `data:image/(png|jpg|jpeg|svg+xml);base64,...`.

## Environment
- `PORT` (default 3000)
- `PUPPETEER_EXECUTABLE_PATH` for custom Chromium path

## Repository Notes
- There is a root-level `index.html` and `estimate.pdf` that appear to be samples or legacy assets.
- Some HTML/JS files show mojibake when viewed as UTF-8; file encoding may be non-UTF-8.
