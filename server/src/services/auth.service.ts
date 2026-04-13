import bcrypt from "bcryptjs";
import { UserRepository } from "@/repositories/user.repository";
import { generateToken } from "@/utils/jwt";
import type { RegisterInput, LoginInput } from "@/schemas/auth.schema";
import type { UserResponse } from "@/types";

export class AuthService {
  constructor(private userRepository: UserRepository) {}

  async register(input: RegisterInput): Promise<{ user: UserResponse; token: string }> {
    const existingUser = await this.userRepository.findByEmail(input.email);

    if (existingUser) {
      throw new Error("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    const user = this.userRepository.create({
      name: input.name,
      email: input.email,
      password: hashedPassword,
    });

    await this.userRepository.save(user);

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  async login(input: LoginInput): Promise<{ user: UserResponse; token: string }> {
    console.log("[AUTH SERVICE] login() called for email:", input.email);

    const user = await this.userRepository.findByEmail(input.email);

    if (!user) {
      console.error("[AUTH SERVICE] User not found for email:", input.email);
      throw new Error("Invalid credentials");
    }

    console.log("[AUTH SERVICE] User found. ID:", user.id, "Role:", user.role);

    const isValidPassword = await bcrypt.compare(input.password, user.password);

    if (!isValidPassword) {
      console.error("[AUTH SERVICE] Invalid password for user:", user.email);
      throw new Error("Invalid credentials");
    }

    console.log("[AUTH SERVICE] Password verified. Generating token...");

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    console.log("[AUTH SERVICE] Token generated successfully");

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  async getUserById(userId: string): Promise<UserResponse | null> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}
