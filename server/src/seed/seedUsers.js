
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import userModel from "../models/auth.models.js";

dotenv.config();

const TOTAL_USERS = 1000;

async function seedUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    const users = [];
    const passwordHash = await bcrypt.hash("Test@12345", 10);

    for (let i = 1; i <= TOTAL_USERS; i++) {
      users.push({
        name: `Test User ${i}`,
        email: `testuser${i}@example.com`,
        passwordHash,
        role: i % 10 === 0 ? "seller" : "user",
        refreshToken: ""
      });
    }

    const result = await userModel.insertMany(users, {
      ordered: false
    });

    console.log(`${result.length} users inserted successfully`);
  } catch (error) {
    console.error("Seeding failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

seedUsers();
