import express from "express";
import cors from "cors";
import claimsRoutes from "./routes/claimsRoutes.js";

const app = express();

app.use(cors({ origin: "http://localhost:3000" })); // URL de ton frontend
app.use(express.json());

app.use("/api/claims", claimsRoutes);

app.listen(5000, () => console.log("Backend running on port 5000"));