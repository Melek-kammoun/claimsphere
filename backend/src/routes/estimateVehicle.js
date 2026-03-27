import { Router } from "express";
import { validateBody } from "../middlewares/requestValidator.js";
import { estimateVehicleSchema } from "../validators/estimateVehicleSchema.js";
import { estimateVehicleController } from "../controllers/estimateVehicleController.js";

const router = Router();

router.post("/estimate-vehicle", validateBody(estimateVehicleSchema), estimateVehicleController);

export default router;
