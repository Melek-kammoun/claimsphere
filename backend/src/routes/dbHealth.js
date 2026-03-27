import { Router } from "express";
import { dbHealthController } from "../controllers/dbHealthController.js";

const router = Router();
router.get("/test-db", dbHealthController);

export default router;
