import { body, param, validationResult } from "express-validator";

export const productsValidator = [
    body("title")
        .exists().withMessage("Titel is required").bail()
        .isString().withMessage("Title must be a string").bail()
        .trim()
        .isLength({ min:2, max:100}).withMessage("Title length must be between 2 to 100 character long").bail()    
        .isAlpha("en-US", {ignore: " "}).withMessage("Title can only have small case and capital case character"),
    body("description")
        .exists().withMessage("Description is reqired").bail()
        .isString().withMessage("Description must be a string").bail()
        .trim()
        .isLength({ min:20, max:500}).withMessage("Description length must be between 20 to 500 character long"),
    body("price.amount")
        .exists().withMessage("Price amount is required").bail()
        .isFloat({ min:0 }).withMessage("Price amount must be a floating number and must be greater than 0"),    
    body("price.currency") 
        .exists().withMessage("Currency is required").bail()
        .isString().withMessage("Currency must be a string value").bail()
        .isIn([ "INR", "USD" ]).withMessage("currency eighter in INR or USD"),
    body("sizes")    
        .exists().withMessage("sizes are required").bail()
        .isArray().withMessage("size must be a array of object"),
    body("sizes.*.size")    
        .exists().withMessage("size must be present in every entry of size array").bail()
        .isString().withMessage("size must be a string value").bail()
        .trim()
        .isIn([ "XS", "S", "M", "L", "XL", "XXL"]).withMessage("size can be one of these XS, S, M, L, XL, XXL,").bail(),
    body("sizes.*.stock")
        .exists().withMessage("stock must be present in every entity in size array").bail()
        .isInt({ min: 0}).withMessage("stock must be a integer value"),
    (req,res,next)=>{
        const error = validationResult(req)

        if(!error.isEmpty){
            return res.status(400).json({
                message: "Invalid request",
                errors: error.array()
            })

        }

        next()
    }      
]

export const unListProductValidator =[
    param("id")
        .exists().withMessage("product id is required in request params").bail()
        .isMongoId().withMessage("product is must be a valid mongo object id"),
    (req, res, next)=>{
        const errors = validationResult(req)

        if(!errors.isEmpty()){
            return res.status(400).json({
                message: "InValid Data",
                errors: errors.array()
            })
        }
        next()
    }
]

export const listProductValidator =[
     param("id")
        .exists().withMessage("product id is required in request params").bail()
        .isMongoId().withMessage("product is must be a valid mongo object id"),
    (req, res, next)=>{
        const errors = validationResult(req)

        if(!errors.isEmpty()){
            return res.status(400).json({
                message: "InValid Data",
                errors: errors.array()
            })
        }
        next()
    }
]