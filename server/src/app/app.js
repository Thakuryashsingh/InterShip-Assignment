import express from "express";
import authRoute from "../routes/auth.routes.js";
import cookieParser from "cookie-parser";
import productsRoute from "../routes/product.routes.js";
import cartRoute from "../routes/cart.routes.js"
import orderRoute from "../routes/order.routes.js"

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoute);
app.use("/api/products", productsRoute);
app.use("/api/cart", cartRoute);
app.use("/api/order", orderRoute)

export default app;