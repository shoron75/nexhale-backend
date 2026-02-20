import express from "express";
import { getBrands, getVapeBrands } from "../controllers/brands.controller.js";

const router = express.Router();

router.get("/", getBrands);
router.get("/vape", getVapeBrands);

export default router;
