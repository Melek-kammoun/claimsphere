import express from "express";
import { getAllClaims, approveClaim, rejectClaim, getClaimDetails } from "../controllers/claimsController.js";

const router = express.Router();

router.get("/", getAllClaims);
router.get("/:id", getClaimDetails);
router.post("/:id/approve", approveClaim);
router.post("/:id/reject", rejectClaim);

export default router;