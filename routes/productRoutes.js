// routes/productRoutes.js
import express from "express";
import { client, urlFor } from "../lib/sanity.js";

const router = express.Router();

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function normalize(doc) {
  if (!doc) return null;
  const collectionTitle = doc.collection?.title || doc.category;

  return {
    _id: doc._id,
    id: doc._id,
    name: doc.name,
    price: doc.price,
    badge: doc.badge ?? null,
    image: typeof doc.image === "string" ? doc.image : urlFor(doc.image) || "",
    hoverImage:
      typeof doc.hoverImage === "string"
        ? doc.hoverImage
        : urlFor(doc.hoverImage) || "",
    category: collectionTitle,
    collection: doc.collection
      ? {
          _id: doc.collection._id,
          title: doc.collection.title,
          slug: doc.collection.slug?.current || doc.collection.slug || null,
        }
      : null,
    rating: doc.rating ?? 4.5,
    reviews: doc.reviews ?? 0,
    colors: doc.colors ?? [],
    sizes: doc.sizes ?? [],
    description: doc.description ?? "",
    inStock: doc.inStock ?? true,
    legacyMongoId: doc.legacyMongoId ?? null,
    createdAt: doc._createdAt,
  };
}

const PRODUCT_FIELDS = `
  _id, name, price, badge, image, hoverImage, category,
  collection->{_id, title, slug},
  rating, reviews, colors, sizes, description, inStock,
  legacyMongoId, _createdAt
`;

async function fetchSanityProducts(query, params = {}) {
  if (!client) {
    throw new Error("Sanity client is not configured");
  }

  return await client.fetch(query, params);
}

// GET ALL (shuffled)
router.get("/", async (req, res) => {
  try {
    const products = await fetchSanityProducts(
      `*[_type == "product"] | order(_createdAt desc) { ${PRODUCT_FIELDS} }`,
    );

    return res.json(shuffleArray(products).map(normalize));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PAGINATED + SHUFFLED
router.get("/paginated", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;

    const allIds = await fetchSanityProducts(`*[_type == "product"]._id`);
    const shuffledIds = shuffleArray(allIds);
    const pickedIds = shuffledIds.slice(0, limit);
    const products = await fetchSanityProducts(
      `*[_type == "product" && _id in $ids] { ${PRODUCT_FIELDS} }`,
      { ids: pickedIds },
    );

    return res.json({
      products: shuffleArray(products || []).map(normalize),
      currentPage: page,
      totalPages: Math.ceil(allIds.length / limit),
      totalProducts: allIds.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// SEARCH
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === "") return res.json([]);

    const searchTerm = `${q.trim()}*`;
    const products = await fetchSanityProducts(
      `*[_type == "product" && (
        name match $q || category match $q || description match $q
      )] | order(_createdAt desc) [0...20] { ${PRODUCT_FIELDS} }`,
      { q: searchTerm },
    );

    return res.json(shuffleArray(products).slice(0, 10).map(normalize));
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: error.message });
  }
});

// RANDOM
router.get("/random/:count", async (req, res) => {
  try {
    const count = parseInt(req.params.count) || 4;
    const products = await fetchSanityProducts(
      `*[_type == "product"] { ${PRODUCT_FIELDS} }`,
    );

    return res.json(shuffleArray(products).slice(0, count).map(normalize));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// COLLECTIONS
router.get("/collections", async (req, res) => {
  try {
    const collections = await fetchSanityProducts(
      `*[_type == "collection"] | order(title asc) {
        _id,
        title,
        slug,
        description,
        featuredImage
      }`,
    );

    return res.json(
      (collections || []).map((collection) => ({
        _id: collection._id,
        id: collection._id,
        title: collection.title,
        slug: collection.slug?.current || collection.slug || null,
        description: collection.description || "",
        featuredImage:
          typeof collection.featuredImage === "string"
            ? collection.featuredImage
            : collection.featuredImage
              ? urlFor(collection.featuredImage)
              : "",
      })),
    );
  } catch (error) {
    console.error("Collections error:", error);
    res.status(500).json({ message: error.message });
  }
});

// BY CATEGORY
router.get("/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const products = await fetchSanityProducts(
      `*[_type == "product" && category match $cat] { ${PRODUCT_FIELDS} }`,
      { cat: `${category}*` },
    );

    return res.json(shuffleArray(products).map(normalize));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// SINGLE BY ID — supports both Sanity IDs and legacy Mongo IDs
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const product = await fetchSanityProducts(
      `*[_type == "product" && (_id == $id || legacyMongoId == $id)][0] { ${PRODUCT_FIELDS} }`,
      { id },
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json(normalize(product));
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ ADD PRODUCT
router.post("/add", async (req, res) => {
  try {
    const created = await client.create({
      _type: "product",
      ...req.body,
    });

    return res.status(201).json(normalize(created));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ SEED PRODUCTS
router.post("/seed", async (req, res) => {
  try {
    const createdProducts = [];

    for (const product of req.body) {
      const created = await client.create({
        _type: "product",
        ...product,
      });
      createdProducts.push(normalize(created));
    }

    return res.json(shuffleArray(createdProducts));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ DELETE PRODUCT
router.delete("/:id", async (req, res) => {
  try {
    const product = await fetchSanityProducts(
      `*[_type == "product" && (_id == $id || legacyMongoId == $id)][0] { _id }`,
      { id: req.params.id },
    );

    if (product) {
      await client.delete(product._id);
      return res.json({
        success: true,
        message: "Product deleted successfully",
      });
    }

    return res.status(404).json({ message: "Product not found" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
