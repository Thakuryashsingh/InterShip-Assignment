import { body, validationResult } from "express-validator"

export const registerValidator = [
    body("email")
        .exists().withMessage("Email is required").bail()
        .trim()
        .isEmail().withMessage("Please enter a valid email address"),
    body("name")
        .exists().withMessage("Name is required").bail()
        .isString().withMessage("Name must be a string").bail()
        .trim()
        .isLength({min:2, max:50}).withMessage("Name must be 2 to 50 character long"),
    body("password")    
        .exists().withMessage("Password is required").bail()
        .isString().withMessage("Password  must be a string").bail()
        .trim()
        .isLength({min:6}).withMessage("Password length must be 6 character long"),
    (req,res,next)=>{
        const error = validationResult(req)

        if(!error.isEmpty()){
            return res.status(400).json({
                message:"Invalid request",
                errors: error.array()
            })
        }

        next()
    }    
]

export const loginValidator = [
    body("email")
        .exists().withMessage("Email is required").bail()
        .isString().withMessage("Email must be a string").bail()
        .trim()
        .isEmail().withMessage("Please enter valid email address"),
    body("password")
        .exists().withMessage("Password is required").bail()
        .isString().withMessage("Password must be a string").bail()
        .trim()
        .isLength({min:6}).withMessage("password must be 6 character long"),
    (res,req,next)=>{
        const error = validationResult(req)
        if(!error.isEmpty()){
            return res.status(400).json({
                message: "Invalid requist",
                errors: error.array()
            })
        }
        next()    
    }

]