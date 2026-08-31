import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/healthz", (_req, res) => {
  res.status(200).send("ok");
});

healthRouter.get("/readyz", (_req, res) => {
  res.status(200).send("ok");
});
