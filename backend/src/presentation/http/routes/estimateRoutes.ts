import { Router } from "express";
import { EstimateController } from "../controllers/EstimateController.js";

export const createEstimateRouter = (controller: EstimateController) => {
  const router = Router();
  router.post("/estimate/pdf", controller.createPdf.bind(controller));
  router.get("/health", controller.health.bind(controller));
  return router;
};
