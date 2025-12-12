// src/controllers/authController.ts
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js"; // <-- .js required for ts-node/esm resolution

const JWT_KEY = process.env.JWT_KEY || "supersecret";

function signToken(user: { id: string; email: string; role?: string }) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    JWT_KEY,
    { expiresIn: "7d" }
  );
}

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body as { name?: string; email?: string; password?: string };

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Please provide name, email and password" });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: "User with this email already exists" });
  }

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);

  const user = new User({
    name,
    email: email.toLowerCase(),
    password: hashed,
    role: "admin" // matches your frontend creating admin accounts; change if needed
  });

  await user.save();

  const token = signToken({ id: user._id.toString(), email: user.email, role: user.role });

  res.status(201).json({
    message: "Account created",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) return res.status(400).json({ message: "Please provide email and password" });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: "Invalid credentials" });

  const token = signToken({ id: user._id.toString(), email: user.email, role: user.role });

  res.json({
    message: "Logged in",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
};

export const me = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) return res.status(404).json({ message: "User not found" });

  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
};
