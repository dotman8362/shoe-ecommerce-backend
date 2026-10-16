// lib/sanity.js
import { createClient } from "@sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";
import dotenv from "dotenv";

// ✅ Load .env before createClient runs
dotenv.config();

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET || "production";

if (!projectId) {
  console.warn(
    "SANITY_PROJECT_ID is not set; Sanity product reads will fall back to MongoDB.",
  );
}
if (!dataset) {
  console.warn("SANITY_DATASET is not set; defaulting to production.");
}

export const client = projectId
  ? createClient({
      projectId,
      dataset,
      apiVersion: "2024-01-01",
      useCdn: false,
      token: process.env.SANITY_API_TOKEN,
    })
  : null;

const builder = client ? createImageUrlBuilder(client) : null;

export function urlFor(source) {
  if (!source || !builder) return null;
  try {
    return builder.image(source).url();
  } catch (error) {
    console.warn("Sanity image URL build failed:", error.message);
    return null;
  }
}
