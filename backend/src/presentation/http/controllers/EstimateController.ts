import type { Request, Response } from "express";
import type { EstimatePayload } from "../../../domain/entities/EstimatePayload.js";
import { GenerateEstimatePdf } from "../../../application/usecases/GenerateEstimatePdf.js";

export class EstimateController {
  constructor(private readonly generateEstimatePdf: GenerateEstimatePdf) {}

  async createPdf(req: Request, res: Response) {
    try {
      const payload = (req.body ?? {}) as EstimatePayload;
      const pdf = await this.generateEstimatePdf.execute(payload);
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
