import { cartModel } from "../models/cart.model.js";
import { orderModel } from "../models/order.models.js";

export const createOrder = async (req, res) => {
  try {
    const userId = req.user.userId;

    const cart = await cartModel
      .findOne({ user: userId })
      .populate("products.product");

    if (!cart || cart.products.length === 0) {
      return res.status(400).json({
        message: "Cart is empty",
      });
    }

    const orderProducts = [];
    let totalAmount = 0;

    for (const item of cart.products) {
      const product = item.product;

      if (!product) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      const productSizes = Array.isArray(product.sizes) ? product.sizes : [];
      const selectedSize = productSizes.find(
        (s) => s.size === item.size
      );

      if (!selectedSize) {
        return res.status(400).json({
          message: `Size ${item.size} is not available`,
        });
      }

      if (selectedSize.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.title}`,
        });
      }

      const itemTotal =
        product.price.amount * item.quantity;

      totalAmount += itemTotal;

      orderProducts.push({
        product: product._id,
        quantity: item.quantity,
        size: item.size,
        price: product.price.amount,
      });
    }

    const order = await orderModel.create({
      user: userId,
      products: orderProducts,
      totalAmount,
    });

    // Clear cart
    await cartModel.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          products: [],
        },
      }
    );

    return res.status(201).json({
      message: "Order placed successfully",
      data: {
        order,
      },
    });
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};