import { readAccessToken } from "../utils/auth.utils.js"

export const authenticate = (req, res, next)=>{
    const accessToken = req.headers.authorization?.split(" ")[ 1 ]

    if(!accessToken){
        return res.status(400).json({
            message: "Access token not found in request header"
        })
    }

    try {
        const decoded = readAccessToken(accessToken)
        
        req.user = decoded
        next()
    } catch (error) {
        res.status(401).json({
            message: "Invalid or expired accesstoken"
        })
    }

}

export const authenticateSeller = (req, res, next) =>{

    if(req.user.role !== "seller"){
        return res.status(403).json({
            message: "User is not authorized to perorm this action"
        })
    }
    next()
}