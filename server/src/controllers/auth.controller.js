import userModel from "../models/auth.models.js";
import bcrypt from "bcryptjs";
import { createAccessToken, createRefreshToken, readRefreshToken } from "../utils/auth.utils.js";

const refreshCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/auth",
};

const clearRefreshCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
};

export const register = async (req,res)=>{
    const {name, email , password } = req.body;

    const isUserAlreadyExist = await userModel.findOne({ email })
    if(isUserAlreadyExist){
        return res.status(400).json({
            message:"user already exist with this email address",
            errors:[
                {
                    path:"email",
                    msg:"user already exist with email address"
                }
            ]
        })
    }

    const user = await userModel.create({
        name,
        email,
        passwordHash: await bcrypt.hash(password, 12),
        
    })

    const accessToken = createAccessToken({
        userId : user._id,
        role : user.role
    })

    const refreshToken = createRefreshToken({
        userId:user._id,
        role:user.role,
    })

    res.cookie("refreshToken", refreshToken, refreshCookieOptions)

    await userModel.findByIdAndUpdate(user.id, {
        refreshToken
    });

    res.status(201).json({
        message:"user registered successfully",
        data:{
            user:{
                email:user.email,
                name:user.name,
                id:user.id,
            },
            accessToken
        }
    })
}

export const login = async (req,res)=>{
    const { email, password } = req.body;

    const user = await userModel.findOne({email})

    if(!user){
        return res.status(400).json({
            message:"Invalid email or password"
        })
    }

    const isPassword = await bcrypt.compare(password,user.passwordHash);

    if(!isPassword){
        return res.status(400).json({
            message: "Invalid email or password"

        })
    }

    const accessToken = createAccessToken({
        userId:user._id,
        role:user.role,
    });
    const refreshToken = createRefreshToken({
        userId:user._id,
        role:user.role,
    });

    await userModel.findOneAndUpdate({email},{refreshToken});

    res.cookie("refreshToken",refreshToken,refreshCookieOptions)

    res.status(200).json({
        message:"User loggedIn successfully",
        data:{
            user:{
                email:user.email,
                name:user.name,
                id:user._id
            },
            accessToken
        }
    })
}

export const refresh = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      message: "refresh token is required",
    });
  }

  try {
    const decode = readRefreshToken(refreshToken);

    const { userId } = decode;

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    if (refreshToken !== user.refreshToken) {

      return res.status(401).json({
        message: "refresh token mismatch",
      });
    }

    const newAccessToken = createAccessToken({
      userId: user.id,
      role: user.role,
    });

    const newRefreshToken = createRefreshToken({
      userId: user.id,
      role: user.role,
    });

    await userModel.findByIdAndUpdate(user._id, {
      refreshToken: newRefreshToken,
    });

    res.cookie("refreshToken", newRefreshToken, refreshCookieOptions);

    return res.status(200).json({
      message: "token rotated successfully",
      data: {
        user: {
          name: user.name,
          email: user.email,
          id: user.id,
        },
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    console.error("Could not refresh authentication session:", error.message);

    return res.status(401).json({
      message: "Invalid refresh token",
    });
  }
};

export const getMe = async (req,res)=>{
    const { userId, role } = req.user

    const user = await userModel.findById(userId)

    res.status(200).json({
        message: "User data fetched successfully",
        data:{
            user:{
                name: user.name,
                email: user.email,
                id: user.id
            },
        }
    })
}

export const logout = async (req, res) => {
    try {
        await userModel.findByIdAndUpdate(
            req.user.userId,
            {
                $unset: {
                    refreshToken: 1
                }
            }
        );

        res.clearCookie("refreshToken", clearRefreshCookieOptions);

        return res.status(200).json({
            message: "Logout successful"
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};