import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import estimateVehicleRouter from "./routes/estimateVehicle.js";
import dbHealthRouter from "./routes/dbHealth.js";
import claimsRouter from "./routes/claims.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: ["http://localhost:5173", "http://localhost:8080", "https://claimsphere.your-domain.com"] }));
app.use(express.json({ limit: "15kb" }));

app.use(
  "/api",
  rateLimit({
    windowMs: 60_000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Trop de requêtes - merci de réessayer dans 1 minute",
  })
);

app.use("/api", estimateVehicleRouter);
app.use("/api", dbHealthRouter);
app.use("/api/claims", claimsRouter);

app.use(errorHandler);

export default app;
