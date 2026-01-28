import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import swaggerUi from "swagger-ui-express";
import { EstimateHtmlRenderer } from "../../infra/templates/EstimateHtmlRenderer.js";
import { PuppeteerPdfGenerator } from "../../infra/pdf/PuppeteerPdfGenerator.js";
import { GenerateEstimatePdf } from "../../application/usecases/GenerateEstimatePdf.js";
import { EstimateController } from "./controllers/EstimateController.js";
import { createEstimateRouter } from "./routes/estimateRoutes.js";
import { getStampImagesFromFirestore } from "../../infra/firebase/stampImages.js";

export const createApp = () => {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  const authUser = process.env.BASIC_AUTH_USER;
  const authPass = process.env.BASIC_AUTH_PASS;
  if (authUser && authPass) {
    app.use((req, res, next) => {
      const authHeader = req.headers.authorization || "";
      if (!authHeader.startsWith("Basic ")) {
        res.setHeader("WWW-Authenticate", 'Basic realm="Estimate PDF"');
        return res.status(401).send("Authentication required.");
      }
      const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf8");
      const [user, pass] = decoded.split(":");
      if (user !== authUser || pass !== authPass) {
        res.setHeader("WWW-Authenticate", 'Basic realm="Estimate PDF"');
        return res.status(401).send("Invalid credentials.");
      }
      return next();
    });
  }

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

  app.get("/api/ui-default-images", async (_req, res) => {
    const defaultsFromFirestore = await getStampImagesFromFirestore();
    res.json({
      staff:
        defaultsFromFirestore?.staff ||
        process.env.DEFAULT_STAFF_STAMP_DATA_URL ||
        "",
      creator:
        defaultsFromFirestore?.creator ||
        process.env.DEFAULT_CREATOR_STAMP_DATA_URL ||
        "",
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
