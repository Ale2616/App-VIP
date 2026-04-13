import bcrypt from "bcryptjs";
import { AppDataSource } from "../data-source";
import { UserEntity, UserRole } from "../../entities/UserEntity";

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log("Connected to database");

    const userRepository = AppDataSource.getRepository(UserEntity);

    // Check if admin exists
    const existingAdmin = await userRepository.findOne({
      where: { email: "admin@devcorex.com" },
    });

    if (existingAdmin) {
      console.log("Admin user already exists");
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);

    const admin = userRepository.create({
      name: "Admin",
      email: "admin@devcorex.com",
      password: hashedPassword,
      role: UserRole.ADMIN,
    });

    await userRepository.save(admin);
    console.log("Admin user created successfully!");
    console.log("Email: admin@devcorex.com");
    console.log("Password: admin123");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();
