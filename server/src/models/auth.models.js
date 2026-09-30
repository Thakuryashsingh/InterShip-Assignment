import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    passwordHash:{
        type:String,
        required:true
    },
    role:{
        type:String,
        default:"user",
        enum: [ "user","seller" ]
    },
    refreshToken:{
        type:String,
    }
});

const userModel = mongoose.model("users",userSchema);

export default userModel;