// scripts/migrate-products.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Readable } from "node:stream";
import { client } from "../lib/sanity.js";
import Product from "../models/Product.js";

dotenv.config();

async function uploadImageFromUrl(url) {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const asset = await client.assets.upload("image", Readable.fromWeb(res.body), {
      filename: url.split("/").pop(),
    });
    return asset;
  } catch (err) {
    console.warn(`Image upload failed: ${url}`, err.message);
    return null;
  }
}

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Mongo connected");

  const products = await Product.find().lean();
  console.log(`Found ${products.length} products`);

  let migrated = 0;
  let failed = 0;

  for (const p of products) {
    try {
      // Upload images first
      const imageAsset = await uploadImageFromUrl(p.image);
      const hoverAsset = await uploadImageFromUrl(p.hoverImage);

      const doc = {
        _type: "product",
        _id: `product-${p._id}`, // deterministic ID from Mongo
        name: p.name,
        price: p.price,
        badge: p.badge || null,
        category: p.category || null,
        rating: p.rating ?? 4.5,
        reviews: p.reviews ?? 0,
        colors: p.colors || [],
        sizes: p.sizes || [],
        description: p.description || "",
        inStock: p.inStock ?? true,
        legacyMongoId: p._id.toString(),
        ...(imageAsset && {
          image: {
            _type: "image",
            asset: { _type: "reference", _ref: imageAsset._id },
          },
        }),
        ...(hoverAsset && {
          hoverImage: {
            _type: "image",
            asset: { _type: "reference", _ref: hoverAsset._id },
          },
        }),
      };

      await client.createOrReplace(doc);
      migrated++;
      console.log(`✅ ${migrated}/${products.length}: ${p.name}`);
    } catch (err) {
      failed++;
      console.error(`❌ Failed: ${p.name}`, err.message);
    }
  }

  console.log(`\nDone. Migrated: ${migrated}, Failed: ${failed}`);
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});