import { AppDataSource } from "../data-source";
import { CategoryEntity } from "../../entities/CategoryEntity";

async function seedCategories() {
  try {
    await AppDataSource.initialize();
    console.log("Connected to database");

    const categoryRepository = AppDataSource.getRepository(CategoryEntity);

    const categories = [
      { name: "Juegos", slug: "juegos" },
      { name: "Aplicaciones", slug: "aplicaciones" },
    ];

    for (const cat of categories) {
      const existing = await categoryRepository.findOne({ where: { slug: cat.slug } });
      if (!existing) {
        const category = categoryRepository.create(cat);
        await categoryRepository.save(category);
        console.log(`✅ Created category: ${cat.name}`);
      } else {
        console.log(`⏭️  Category already exists: ${cat.name}`);
      }
    }

    console.log("Categories seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding categories:", error);
    process.exit(1);
  }
}

seedCategories();
