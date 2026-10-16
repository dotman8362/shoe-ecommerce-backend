import dotenv from "dotenv";
import mongoose from "mongoose";
import { createClient } from "@sanity/client";

dotenv.config();

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET || "production";
const token = process.env.SANITY_API_TOKEN;

if (!projectId || !token) {
  throw new Error(
    "SANITY_PROJECT_ID and SANITY_API_TOKEN must be set in backend/.env",
  );
}

const sanity = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  useCdn: false,
  token,
});

const Product = (await import("../models/Product.js")).default;

const toSanityProduct = (doc) => ({
  _type: "product",
  name: doc.name,
  price: Number(doc.price || 0),
  badge: doc.badge || "",
  image: doc.image || "",
  hoverImage: doc.hoverImage || doc.image || "",
  category: doc.category || "",
  rating: Number(doc.rating || 4.5),
  reviews: Number(doc.reviews || 0),
  colors: Array.isArray(doc.colors) ? doc.colors : [],
  sizes: Array.isArray(doc.sizes) ? doc.sizes : [],
  description: doc.description || "",
  inStock: doc.inStock ?? true,
  legacyMongoId: doc._id.toString(),
});

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const products = await Product.find({}).lean();

  console.log(`Found ${products.length} Mongo products to migrate.`);

  let imported = 0;
  let skipped = 0;

  for (const product of products) {
    const existing = await sanity.fetch(
      `*[_type == "product" && legacyMongoId == $legacyMongoId][0]{_id}`,
      { legacyMongoId: product._id.toString() },
    );

    if (existing) {
      skipped += 1;
      continue;
    }

    await sanity.create(toSanityProduct(product));
    imported += 1;
  }

  console.log(`Imported: ${imported}`);
  console.log(`Skipped: ${skipped}`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
