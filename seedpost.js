import mongoose from "mongoose";
import dotenv from "dotenv";
import Post from "./models/Post.js";

dotenv.config();

const posts = [
  {
    category: "Lifestyle",
    title: "Why Your Shoes Matter More Than Your Clothes",
    excerpt: `When it comes to fashion, many people focus on clothes and forget one important detail—shoes.
The truth is, your shoes say a lot about you before you even speak.`,
    author: "Jofta Solemates",
    authorAvatar: "https://res.cloudinary.com/dpy2p67bw/image/upload/v1775220943/photo_2026-04-03_13-54-38_s9uq1g.jpg",
    image: "https://res.cloudinary.com/dpy2p67bw/image/upload/q_auto/f_auto/v1775221328/wedding-shoes-floral-arrangement_u5ulzv.jpg",
    altImage: "https://res.cloudinary.com/dpy2p67bw/image/upload/q_auto/f_auto/v1775221328/wedding-shoes-floral-arrangement_u5ulzv.jpg",
    tags: ["Fashion", "Tips", "Lifestyle"],
    content: `
When it comes to fashion, many people focus on clothes and forget one important detail—shoes.
The truth is, your shoes say a lot about you before you even speak.
1. First Impressions Matter
People notice your shoes faster than you think. Clean, well-designed footwear shows you are organized and confident.
2. Shoes Complete Your Outfit
You can wear a simple outfit, but the right shoes will upgrade your entire look instantly.
3. Quality Shoes Show Class
Wearing quality footwear tells people you pay attention to details. It’s a sign of style and self-respect.
4. Comfort is Confidence
When your shoes are comfortable, you walk better, stand taller, and feel more confident.
✨ Never underestimate the power of a good pair of shoes.
How to Take Care of Your Footwear and Make Them Last Longer
A good pair of shoes is an investment, and if properly cared for, it can serve you for a long time while still looking fresh and stylish.
At Jofta Solemates, we don’t just make quality footwear—we also want you to maintain them the right way.
Here are simple tips to help you take care of your shoes:
1. Keep Your Shoes Clean
Always wipe off dust and dirt after wearing your shoes.
For leather shoes, use a soft cloth to clean them gently.
2. Avoid Wearing the Same Pair Every Day
Give your shoes time to breathe. Wearing the same pair daily can make them wear out faster and develop odor.

3. Store Them Properly
Keep your shoes in a cool, dry place.
Avoid dumping them anywhere—use a shoe rack or box to maintain their shape.
4. Keep Them Away from Water
Too much water can damage leather and weaken the sole.
If your shoes get wet, dry them naturally—do not use direct sunlight.
5. Polish and Condition Regularly
Leather shoes need polishing to maintain their shine and prevent cracking.
This keeps them looking new and classy.
At Jofta Solemates, we create footwear that gives you confidence, comfort, and class.
Purchase your pairs of luxury shoe Now`,
    published: true
  },
  {
    category: "Fashion",
    title: "Why Custom-Made Shoes Are Better Than Ready-Made",
    excerpt: `In today’s world, many people buy ready-made shoes because they are fast and easy to get.
But when it comes to comfort, durability, and style, custom-made shoes always stand out.
At Jofta Solemates, we believe your footwear should be made specifically for you—not just picked off a shelf.`,
    author: "Jofta Solemates",
    authorAvatar: "https://res.cloudinary.com/dpy2p67bw/image/upload/v1775220943/photo_2026-04-03_13-54-38_s9uq1g.jpg",
    image: "https://res.cloudinary.com/dpy2p67bw/image/upload/q_auto/f_auto/v1775221339/brown-shoe-with-broccoli-rocks_yt7ilb.jpg",
    altImage: "https://res.cloudinary.com/dpy2p67bw/image/upload/q_auto/f_auto/v1775221339/brown-shoe-with-broccoli-rocks_yt7ilb.jpg",
    tags: ["Fashion", "Trends"],
    content: `In today’s world, many people buy ready-made shoes because they are fast and easy to get.
But when it comes to comfort, durability, and style, custom-made shoes always stand out.
At Jofta Solemates, we believe your footwear should be made specifically for you—not just picked off a shelf.
1. Perfect Fit
Custom-made shoes are designed to match your exact foot size and shape.
No tight edges, no discomfort—just the perfect fit.
2. Unique Style
With custom shoes, you don’t have to wear what everyone else is wearing.
You choose your design, color, and finish—making your footwear truly yours.
3. Better Quality
Custom shoes are made with attention to detail and quality materials.
This means they last longer than most ready-made options.
4. Maximum Comfort
Because they are made for your feet, custom shoes provide better support and comfort throughout the day.
5. Value for Your Money
Instead of buying cheap shoes frequently, investing in one quality pair saves you money in the long run.
✨ Good shoes take you to good places—but the right shoes make the journey better.
At Jofta Solemates, we specialize in creating footwear that matches your style, comfort, and personality.`,
    published: true
  },
    {
    category: "Fashion",
    title: "Common Shoe Mistakes Men Make (And How to Avoid Them)",
    excerpt: `Many men invest in good outfits but still get their overall look wrong because of simple shoe mistakes.
The truth is, your shoes can either elevate your appearance or completely ruin it.
At Jofta Solemates, we help you get it right every time.`,
    author: "Jofta Solemates",
    authorAvatar: "https://res.cloudinary.com/dpy2p67bw/image/upload/v1775220943/photo_2026-04-03_13-54-38_s9uq1g.jpg",
    image: "https://res.cloudinary.com/dpy2p67bw/image/upload/q_auto/f_auto/v1775221492/still-life-beach-bag-ready-travel_re7g5n.jpg",
    altImage: "https://res.cloudinary.com/dpy2p67bw/image/upload/q_auto/f_auto/v1775221492/still-life-beach-bag-ready-travel_re7g5n.jpg",
    tags: ["Fashion", "Trends"],
    content: `Many men invest in good outfits but still get their overall look wrong because of simple shoe mistakes.
The truth is, your shoes can either elevate your appearance or completely ruin it.
At Jofta Solemates, we help you get it right every time.
1. Wearing the Wrong Size
Too tight or too loose—both are problems.
Wearing the wrong size affects your comfort and can damage the shoe quickly.
2. Not Taking Care of Shoes
Dirty or worn-out shoes can make even expensive outfits look cheap.
Regular cleaning and proper storage go a long way.
3. Using One Shoe for Every Occasion
One pair cannot do everything.
Different occasions require different styles to maintain a sharp look.
4. Ignoring Quality
Buying cheap shoes often leads to frequent replacement.
Quality footwear lasts longer and looks better.
5. Choosing Style Over Comfort
Looking good is important, but comfort is key.
The best shoes give you both.
6. Wearing Damaged Shoes
Peeling leather, broken soles, or faded color reduces your overall appearance.
Know when it’s time to upgrade.
✨ Avoiding these simple mistakes can completely transform your style.
At Jofta Solemates, we don’t just sell shoes—we help you step out with confidence and class.`,
    published: true
  },
    {
    category: "Fashion",
    title: "How to Know a Quality Shoe at First Sight",
    excerpt: `Buying a good shoe goes beyond just liking the design.
A quality shoe speaks for itself—you just need to know what to look for.
At Jofta Solemates, we believe every customer should understand quality.`,
    author: "Jofta Solemates",
    authorAvatar: "https://res.cloudinary.com/dpy2p67bw/image/upload/v1775220943/photo_2026-04-03_13-54-38_s9uq1g.jpg",
    image: "https://res.cloudinary.com/dpy2p67bw/image/upload/q_auto/f_auto/v1775222781/download_9_py42kp.jpg",
    altImage: "https://res.cloudinary.com/dpy2p67bw/image/upload/q_auto/f_auto/v1775222781/download_9_py42kp.jpg",
    tags: ["Fashion", "Trends"],
    content: `Buying a good shoe goes beyond just liking the design.
A quality shoe speaks for itself—you just need to know what to look for.
At Jofta Solemates, we believe every customer should understand quality.
1. Check the Stitching
Neat and strong stitching is a sign of durability. Loose or uneven stitches mean poor finishing.
2. Look at the Material
Quality shoes are made from good leather or durable materials that don’t peel easily.
3. Examine the Sole
A strong, well-fixed sole ensures your shoe will last longer without damage.
4. Pay Attention to Finishing
Clean edges, smooth surface, and proper shaping show that the shoe was carefully made.
✨ Quality is not just seen—it is felt.
At Jofta Solemates, we deliver footwear that meets the highest standard.`,
    published: true
  },
    {
    category: "Fashion",
    title: "Why Every Man Needs More Than One Pair of Shoes",
    excerpt: `Many men rely on just one pair of shoes for everything—but that’s a mistake.
Your lifestyle requires different footwear for different occasions.`,
    author: "Jofta Solemates",
    authorAvatar: "https://res.cloudinary.com/dpy2p67bw/image/upload/v1775220943/photo_2026-04-03_13-54-38_s9uq1g.jpg",
    image: "https://res.cloudinary.com/dpy2p67bw/image/upload/q_auto/f_auto/v1775223009/images_1_smpfet.jpg",
    altImage: "https://res.cloudinary.com/dpy2p67bw/image/upload/q_auto/f_auto/v1775223009/images_1_smpfet.jpg",
    tags: ["Fashion", "Trends"],
    content: `Many men rely on just one pair of shoes for everything—but that’s a mistake.
Your lifestyle requires different footwear for different occasions.
1. Different Occasions, Different Shoes
Formal events, casual outings, and traditional wear all require different styles.
2. It Helps Your Shoes Last Longer
Wearing one pair every day causes faster wear and tear. Rotating your shoes increases durability.
3. Improves Your Overall Appearance
The right shoe for the right outfit instantly upgrades your look.
4. Boosts Confidence
When you know your shoes match your outfit, you naturally feel more confident.
✨ One shoe cannot do everything—style requires options.
At Jofta Solemates, we’ve got the perfect pair for every occasion.`,
    published: true
  },
    {
    category: "Fashion",
    title: "How the Right Shoes Boost Your Confidence",
    excerpt: `Confidence is not just about what you wear—it’s about how you feel.
And one of the biggest contributors to confidence is your footwear.`,
    author: "Jofta Solemates",
    authorAvatar: "https://res.cloudinary.com/dpy2p67bw/image/upload/v1775220943/photo_2026-04-03_13-54-38_s9uq1g.jpg",
    image: "https://res.cloudinary.com/dpy2p67bw/image/upload/q_auto/f_auto/v1775223009/WhatsAppImage2024-08-25at9.00.27PM_vx94hg.jpg",
    altImage: "https://res.cloudinary.com/dpy2p67bw/image/upload/q_auto/f_auto/v1775223009/WhatsAppImage2024-08-25at9.00.27PM_vx94hg.jpg",
    tags: ["Fashion", "Trends"],
    content: `Confidence is not just about what you wear—it’s about how you feel.
And one of the biggest contributors to confidence is your footwear.
1. Better Posture
Good shoes help you stand and walk properly, giving you a stronger presence.
2. Strong First Impression
People notice your shoes quickly. Clean, stylish footwear shows class and attention to detail.
3. Comfort Gives Confidence
When your shoes are comfortable, you move freely without distractions.
4. Completes Your Look
The right shoe ties everything together and makes you feel put together.
✨ When your shoes are right, everything feels right.
At Jofta Solemates, we create footwear that gives you confidence with every step.`,
    published: true
  }
];

async function seedPosts() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce');
    console.log("Connected to MongoDB");
    
    await Post.deleteMany();
    console.log("Cleared existing posts");
    
    const inserted = await Post.insertMany(posts);
    console.log(`Added ${inserted.length} posts`);
    
    process.exit(0);
  } catch (error) {
    console.error("Error seeding posts:", error);
    process.exit(1);
  }
}

seedPosts();