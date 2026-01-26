import type { EstimatePayload } from "../../domain/entities/EstimatePayload.js";
import type { HtmlRenderer } from "../ports/HtmlRenderer.js";
import type { PdfGenerator } from "../ports/PdfGenerator.js";

export class GenerateEstimatePdf {
  constructor(
    private readonly htmlRenderer: HtmlRenderer<EstimatePayload>,
    private readonly pdfGenerator: PdfGenerator
  ) {}

  async execute(payload: EstimatePayload): Promise<Buffer> {
    const html = this.htmlRenderer.render(payload);
    return this.pdfGenerator.generateFromHtml(html);
  }
}

