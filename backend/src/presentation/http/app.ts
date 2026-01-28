import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import swaggerUi from "swagger-ui-express";
import { EstimateHtmlRenderer } from "../../infra/templates/EstimateHtmlRenderer.js";
import { PuppeteerPdfGenerator } from "../../infra/pdf/PuppeteerPdfGenerator.js";
import { GenerateEstimatePdf } from "../../application/usecases/GenerateEstimatePdf.js";
import { EstimateController } from "./controllers/EstimateController.js";
import { createEstimateRouter } from "./routes/estimateRoutes.js";

export const createApp = () => {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  const publicDir = path.resolve(process.cwd(), "public");
  app.use(express.static(publicDir));

  app.get("/api/ui-defaults", (_req, res) => {
    res.json({
      companyMain: process.env.DEFAULT_COMPANY_MAIN || "",
      company: process.env.DEFAULT_COMPANY || "",
      postId: process.env.DEFAULT_POST_ID || "",
      address: process.env.DEFAULT_ADDRESS || "",
      tel: process.env.DEFAULT_TEL || "",
    });
  });

  app.get("/api/ui-default-images", (_req, res) => {
    res.json({
      staff: process.env.DEFAULT_STAFF_STAMP_DATA_URL || "",
      creator: process.env.DEFAULT_CREATOR_STAMP_DATA_URL || "",
    });
  });

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const openapiPath = path.resolve(__dirname, "../../../openapi.yaml");
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(undefined, {
    swaggerOptions: {
      url: `/openapi.yaml`
    }
  }));
  app.get("/openapi.yaml", (_req, res) => {
    res.sendFile(openapiPath);
  });

  const htmlRenderer = new EstimateHtmlRenderer();
  const pdfGenerator = new PuppeteerPdfGenerator();
  const useCase = new GenerateEstimatePdf(htmlRenderer, pdfGenerator);
  const controller = new EstimateController(useCase);

  app.use("/api", createEstimateRouter(controller));

  return app;
};
