import type { Request, Response } from "express";
import type { EstimatePayload } from "../../../domain/entities/EstimatePayload.js";
import { GenerateEstimatePdf } from "../../../application/usecases/GenerateEstimatePdf.js";

export class EstimateController {
  constructor(private readonly generateEstimatePdf: GenerateEstimatePdf) {}

  async createPdf(req: Request, res: Response) {
    try {
      const payload = (req.body ?? {}) as EstimatePayload;
      const withDefaults = applyDefaultStampImages(payload);
      const pdf = await this.generateEstimatePdf.execute(withDefaults);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'inline; filename="estimate.pdf"');
      res.send(pdf);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: String(error) });
    }
  }

  health(_req: Request, res: Response) {
    res.json({ ok: true });
  }
}

const IMAGE_DATA_URL_PATTERN =
  /^data:image\/(png|jpe?g|svg\+xml);base64,[A-Za-z0-9+/=]+$/i;

function sanitizeImageDataUrl(imageDataUrl: string | undefined) {
  if (!imageDataUrl) return undefined;
  const trimmed = imageDataUrl.trim();
  return IMAGE_DATA_URL_PATTERN.test(trimmed) ? trimmed : undefined;
}

function applyDefaultStampImages(payload: EstimatePayload): EstimatePayload {
  const defaultStamp = sanitizeImageDataUrl(process.env.DEFAULT_STAMP_DATA_URL);
  const defaultStaff = sanitizeImageDataUrl(process.env.DEFAULT_STAFF_STAMP_DATA_URL);
  const defaultCreator = sanitizeImageDataUrl(process.env.DEFAULT_CREATOR_STAMP_DATA_URL);

  return {
    ...payload,
    stampImageDataUrl: payload.stampImageDataUrl || defaultStamp,
    staffImageDataUrl: payload.staffImageDataUrl || defaultStaff,
    creatorImageDataUrl: payload.creatorImageDataUrl || defaultCreator,
  };
}
