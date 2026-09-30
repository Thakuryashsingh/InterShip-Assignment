import mongoose from "mongoose";
import config from "./config.js";

const connectDB = async ()=>{
    await mongoose.connect(config.MONGO_URI);
    console.log("server connected to database");
    
};

export default connectDB;