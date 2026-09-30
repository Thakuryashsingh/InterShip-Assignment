import { productModel } from "../models/product.model.js";
import { cartModel } from "../models/cart.model.js";

export const addToCart = async (req, res) => {
    const { productID, quantity, size } = req.body;
    const requestedQuantity = Number(quantity);

    const product = await productModel.findById(productID);
    if (!product) {
        return res.status(400).json({
            message: "Product not found",
        });
    }

    const selectedSize = product.sizes.find((item) => item.size === size);
    if (!selectedSize) {
        return res.status(400).json({
            message: "Invalid Size",
        });
    }

    const cart = await cartModel.findOne({ user: req.user.userId })
        ?? await cartModel.create({ user: req.user.userId });
    const productInCart = cart.products.find((item) =>
        item.product.toString() === productID && item.size === size
    );
    const updatedQuantity = (productInCart?.quantity ?? 0) + requestedQuantity;

    if (updatedQuantity > selectedSize.stock) {
        return res.status(400).json({
            message: "Insufficient stock",
        });
    }

    if (productInCart) {
        productInCart.quantity = updatedQuantity;
    } else {
        cart.products.push({
            product: productID,
            quantity: requestedQuantity,
            size,
        });
    }

    await cart.save();

    return res.status(200).json({
        message: productInCart
            ? "Product quantity updated successfully"
            : "Product added to cart",
    });
}

export const getCartcontroller = async (req, res)=>{
    const cart = (await cartModel.findOne({ user: req.user.userId}) 
    ?? 
    await cartModel.create({ user: req.user.userId }))

    return res.status(200).json({
        message: "Cart retrived successfully",
        data:{
            cart
        }
    })
}