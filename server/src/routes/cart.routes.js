import { Router } from "express";
import { cartValidator } from "../validator/cart.validator.js";
import { addToCart, getCartcontroller } from "../controllers/cart.controller.js";
import { authenticate } from "../middlewares/auth.middlieware.js";

const router = Router();

router.post("/", authenticate, cartValidator, addToCart);

router.get("/", authenticate, getCartcontroller);

export default router;