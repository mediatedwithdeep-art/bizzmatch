/**
 * Demo seed: super admin, owner accounts, 8 businesses (mix of verified and
 * active), one open report, sample follows/saves.
 * Run with: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { existsSync, readFileSync } from "node:fs";

// Load .env when run directly (npm run db:seed) so DATABASE_URL is available.
if (!process.env.DATABASE_URL && existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
  }
}
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set — add your Postgres URL to .env first.");
}

const db = new PrismaClient();
const PASSWORD = "demo1234";
const OWNER_PASSWORD = "Deep@1234";

const businesses = [
  { email: "priya@textilehub.demo", name: "Priya Sharma", companyName: "TextileHub Exports", industry: "Textiles & Apparel", city: "Surat", state: "Gujarat", verified: true,
    about: "Family-run textile exporter since 2005. We produce premium cotton and viscose fabrics for domestic brands and export to 12 countries.",
    products: "Woven cotton fabrics, viscose blends, custom dyeing and printing runs from 500m.",
    goals: "Looking for apparel manufacturers and D2C brands who need reliable fabric supply at scale." },
  { email: "rahul@freshfarm.demo", name: "Rahul Verma", companyName: "FreshFarm Organics", industry: "Agriculture", city: "Nashik", state: "Maharashtra", verified: false,
    about: "FPO-backed organic produce aggregator working with 400+ farmers. FSSAI licensed, cold-chain enabled.",
    products: "Certified organic vegetables, grapes, onions. Weekly B2B supply contracts.",
    goals: "Seeking hotel chains, cloud kitchens and modern-trade retailers for recurring supply partnerships." },
  { email: "sneha@codecraft.demo", name: "Sneha Iyer", companyName: "CodeCraft Studios", industry: "IT & Software", city: "Bengaluru", state: "Karnataka", verified: true,
    about: "22-person product studio building mobile apps and internal tools for SMEs. 60+ shipped projects.",
    products: "Custom app development, ERP integrations, AI chatbots, maintenance retainers.",
    goals: "Looking for manufacturing and logistics companies wanting to digitise operations." },
  { email: "arjun@steelline.demo", name: "Arjun Mehta", companyName: "SteelLine Industries", industry: "Manufacturing", city: "Ludhiana", state: "Punjab", verified: true,
    about: "ISO 9001 fastener and precision-parts manufacturer supplying automotive OEMs for 18 years.",
    products: "High-tensile fasteners, CNC-machined components, custom tooling.",
    goals: "Want distributors in South India and export partners for the Middle East market." },
  { email: "kavita@medisupply.demo", name: "Kavita Rao", companyName: "MediSupply Care", industry: "Healthcare & Pharma", city: "Hyderabad", state: "Telangana", verified: false,
    about: "Licensed distributor of surgical consumables and diagnostic kits serving 300+ hospitals and labs.",
    products: "Surgical consumables, POC diagnostic kits, hospital furniture procurement.",
    goals: "Looking for manufacturers seeking South-India distribution and hospital chains for annual rate contracts." },
  { email: "vikram@spicetrail.demo", name: "Vikram Nair", companyName: "SpiceTrail Foods", industry: "Food & Beverage", city: "Kochi", state: "Kerala", verified: false,
    about: "Spice processor and private-label manufacturer. In-house grinding, blending and packing; export-grade quality.",
    products: "Whole and ground spices, masala blends, private-label manufacturing from 1-ton MOQ.",
    goals: "Seeking retail brands for private-label deals and bulk buyers in North India." },
  { email: "meera@brandboost.demo", name: "Meera Kapoor", companyName: "BrandBoost Media", industry: "Marketing & Media", city: "Mumbai", state: "Maharashtra", verified: true,
    about: "Performance-marketing agency for B2B and D2C. ₹40Cr+ ad spend managed, 15-member team.",
    products: "Performance ads, LinkedIn ABM campaigns, content studios, marketing automation setup.",
    goals: "Looking for SaaS and manufacturing companies wanting qualified lead pipelines." },
  { email: "sanjay@swiftlogi.demo", name: "Sanjay Gupta", companyName: "SwiftLogi Express", industry: "Logistics & Supply Chain", city: "Delhi", state: "Delhi", verified: false,
    about: "Tech-enabled 3PL with 40 vehicles and warehousing in Delhi NCR, Jaipur and Lucknow.",
    products: "FTL/PTL transport, warehousing, last-mile delivery for e-commerce.",
    goals: "Want e-commerce sellers and manufacturers needing North-India distribution; open to fleet partnerships." },
];

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const ownerHash = await bcrypt.hash(OWNER_PASSWORD, 12);

  // Super admin + owner admin
  await db.user.upsert({
    where: { email: "admin@bizmatch.demo" },
    update: { role: "SUPER_ADMIN" },
    create: { email: "admin@bizmatch.demo", name: "Platform Admin", passwordHash, role: "SUPER_ADMIN" },
  });
  await db.user.upsert({
    where: { email: "deepsolanki0174@gmail.com" },
    update: { passwordHash: ownerHash, role: "SUPER_ADMIN" },
    create: { email: "deepsolanki0174@gmail.com", name: "Deep Solanki", passwordHash: ownerHash, role: "SUPER_ADMIN" },
  });

  // Owner member — fully enriched profile
  await db.user.upsert({
    where: { email: "deep@bizmatch.demo" },
    update: { passwordHash: ownerHash },
    create: {
      email: "deep@bizmatch.demo",
      name: "Deep Solanki",
      passwordHash: ownerHash,
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          companyName: "Deep Ventures",
          industry: "Consulting",
          country: "India",
          city: "Ahmedabad",
          state: "Gujarat",
          about: "Founder account for testing BizMatch — exploring partnerships across industries.",
          products: "Business networking, partnerships, and growth consulting.",
          goals: "Testing the platform: discovering businesses, matching and chatting.",
          size: "1-10",
          status: "ACTIVE",
        },
      },
    },
  });

  const ids: Record<string, string> = {};
  for (const b of businesses) {
    const user = await db.user.upsert({
      where: { email: b.email },
      update: {},
      create: {
        email: b.email,
        name: b.name,
        passwordHash,
        emailVerifiedAt: new Date(),
        profile: {
          create: {
            companyName: b.companyName,
            industry: b.industry,
            country: "India",
            city: b.city,
            state: b.state,
            about: b.about,
            products: b.products,
            goals: b.goals,
            status: b.verified ? "VERIFIED" : "ACTIVE",
            verifiedAt: b.verified ? new Date() : null,
          },
        },
      },
    });
    ids[b.email] = user.id;
  }

  // Social graph flavour
  const priya = ids["priya@textilehub.demo"];
  const sneha = ids["sneha@codecraft.demo"];
  const rahul = ids["rahul@freshfarm.demo"];
  if (priya && sneha) {
    await db.follow.upsert({
      where: { followerId_targetId: { followerId: sneha, targetId: priya } },
      update: {},
      create: { followerId: sneha, targetId: priya },
    });
  }
  if (rahul && sneha) {
    await db.report.create({
      data: { reporterId: rahul, targetId: sneha, reason: "OTHER", detail: "Seed example report — dismiss me." },
    }).catch(() => {});
  }

  console.log("Seeded. Demo accounts (password: %s):", PASSWORD);
  console.log("  Super admin:      admin@bizmatch.demo");
  console.log("  Members:          priya@textilehub.demo (+7 more)");
  console.log("Owner accounts (password: %s):", OWNER_PASSWORD);
  console.log("  Owner admin:      deepsolanki0174@gmail.com  → /admin");
  console.log("  Owner member:     deep@bizmatch.demo         → /discover");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
