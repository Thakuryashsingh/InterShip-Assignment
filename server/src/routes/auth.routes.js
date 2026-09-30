import { Router } from "express";
import { getMe, login, logout, refresh, register } from "../controllers/auth.controller.js";
import { loginValidator, registerValidator } from "../validator/auth.validation.js";
import { authenticate } from "../middlewares/auth.middlieware.js";

const router = Router();

router.post("/register", registerValidator, register);
router.post("/login", loginValidator, login);
router.post("/refresh", refresh);
router.get("/me", authenticate, getMe)
router.post("/logout",authenticate, logout)

export default router;