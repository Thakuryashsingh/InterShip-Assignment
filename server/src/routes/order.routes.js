import { Router } from "express";
import { authenticate } from "../middlewares/auth.middlieware.js";
import { createOrder } from "../controllers/order.controller.js";

const router = Router();

router.post("/order", authenticate, createOrder)

export default router