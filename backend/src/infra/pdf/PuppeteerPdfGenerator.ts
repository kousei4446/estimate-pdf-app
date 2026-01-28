import puppeteer from "puppeteer";
import type { PdfGenerator } from "../../application/ports/PdfGenerator.js";

export class PuppeteerPdfGenerator implements PdfGenerator {
  async generateFromHtml(html: string): Promise<Buffer> {
    const launchOptions: Parameters<typeof puppeteer.launch>[0] = {
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
    };

    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    const timeoutMs = Number(process.env.PUPPETEER_TIMEOUT_MS) || 120000;
    page.setDefaultTimeout(timeoutMs);
    page.setDefaultNavigationTimeout(timeoutMs);
    await page.setContent(html, { waitUntil: "load", timeout: timeoutMs });
    const pdf = await page.pdf({ format: "A4", landscape: true, printBackground: true });
    await browser.close();
    return pdf;
  }
}
