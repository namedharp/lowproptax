import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hash } from "bcryptjs";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

// ─── Helpers ─────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ─── Main ────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding database...\n");

  // ── 1. Clear all tables (respect FK order) ─────────────

  console.log("  Clearing existing data...");
  await prisma.chatMessage.deleteMany();
  await prisma.document.deleteMany();
  await prisma.appealStatusHistory.deleteMany();
  await prisma.appeal.deleteMany();
  await prisma.property.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.user.deleteMany();
  console.log("  Done.\n");

  // ── 2. Hash passwords ──────────────────────────────────

  console.log("  Hashing passwords...");
  const adminHash = await hash("admin123", 12);
  const demoHash = await hash("demo123", 12);
  console.log("  Done.\n");

  // ── 3. Create Users ────────────────────────────────────

  console.log("  Creating users...");

  const elena = await prisma.user.create({
    data: {
      id: "user-elena",
      name: "Elena Kowalski",
      email: "elena.kowalski@lowproptax.com",
      hashedPassword: adminHash,
      role: "admin",
      phone: "(469) 555-0100",
      createdAt: new Date("2022-01-15"),
    },
  });

  const marcus = await prisma.user.create({
    data: {
      id: "user-marcus",
      name: "Marcus Johnson",
      email: "marcus.johnson@email.com",
      hashedPassword: demoHash,
      role: "investor",
      phone: "(713) 555-0142",
      createdAt: new Date("2023-06-15"),
    },
  });

  const sarah = await prisma.user.create({
    data: {
      id: "user-sarah",
      name: "Sarah Mitchell",
      email: "sarah.mitchell@email.com",
      hashedPassword: demoHash,
      role: "homeowner",
      phone: "(713) 555-0198",
      createdAt: new Date("2024-01-10"),
    },
  });

  const david = await prisma.user.create({
    data: {
      id: "user-david",
      name: "David Chen",
      email: "david.chen@email.com",
      hashedPassword: demoHash,
      role: "investor",
      phone: "(214) 555-0267",
      createdAt: new Date("2022-11-05"),
    },
  });

  const linda = await prisma.user.create({
    data: {
      id: "user-linda",
      name: "Linda Patel",
      email: "linda.patel@email.com",
      hashedPassword: demoHash,
      role: "homeowner",
      phone: "(404) 555-0523",
      createdAt: new Date("2024-05-30"),
    },
  });

  console.log(`  Created ${5} users.\n`);

  // ── 4. Create Agents ───────────────────────────────────

  console.log("  Creating agents...");

  await prisma.agent.createMany({
    data: [
      {
        id: "agent-001",
        name: "Amanda Foster",
        email: "amanda.foster@lowproptax.com",
        role: "manager",
      },
      {
        id: "agent-002",
        name: "Brian Nguyen",
        email: "brian.nguyen@lowproptax.com",
        role: "agent",
      },
      {
        id: "agent-003",
        name: "Carla Hernandez",
        email: "carla.hernandez@lowproptax.com",
        role: "agent",
      },
      {
        id: "agent-004",
        name: "Derek Simmons",
        email: "derek.simmons@lowproptax.com",
        role: "agent",
      },
      {
        id: "agent-005",
        name: "Elena Kowalski",
        email: "elena.kowalski@lowproptax.com",
        role: "admin",
      },
    ],
  });

  console.log(`  Created 5 agents.\n`);

  // ── 5. Create Properties ───────────────────────────────

  console.log("  Creating properties...");

  await prisma.property.createMany({
    data: [
      // ── Marcus Johnson's properties (prop-001 through prop-010) ──
      {
        id: "prop-001",
        address: "4521 Westheimer Rd",
        city: "Houston",
        state: "TX",
        zip: "77027",
        county: "Harris",
        propertyType: "single-family",
        assessedValue: 385000,
        marketValue: 450000,
        taxRate: 2.31,
        annualTax: 8893,
        yearBuilt: 1998,
        sqft: 2450,
        bedrooms: 4,
        bathrooms: 3,
        lotSize: 7500,
        lastAssessmentDate: "2025-01-15",
        ownerId: marcus.id,
      },
      {
        id: "prop-002",
        address: "1847 N Michigan Ave",
        city: "Chicago",
        state: "IL",
        zip: "60611",
        county: "Cook",
        propertyType: "condo",
        assessedValue: 310000,
        marketValue: 375000,
        taxRate: 2.1,
        annualTax: 6510,
        yearBuilt: 2005,
        sqft: 1200,
        bedrooms: 2,
        bathrooms: 2,
        lastAssessmentDate: "2025-02-01",
        ownerId: marcus.id,
      },
      {
        id: "prop-003",
        address: "9032 Preston Rd",
        city: "Dallas",
        state: "TX",
        zip: "75225",
        county: "Dallas",
        propertyType: "single-family",
        assessedValue: 520000,
        marketValue: 610000,
        taxRate: 2.18,
        annualTax: 11336,
        yearBuilt: 2012,
        sqft: 3200,
        bedrooms: 5,
        bathrooms: 4,
        lotSize: 9800,
        lastAssessmentDate: "2025-01-20",
        ownerId: marcus.id,
      },
      {
        id: "prop-004",
        address: "2210 E Camelback Rd",
        city: "Phoenix",
        state: "AZ",
        zip: "85016",
        county: "Maricopa",
        propertyType: "single-family",
        assessedValue: 275000,
        marketValue: 340000,
        taxRate: 1.6,
        annualTax: 4400,
        yearBuilt: 2001,
        sqft: 1850,
        bedrooms: 3,
        bathrooms: 2,
        lotSize: 6200,
        lastAssessmentDate: "2025-03-10",
        ownerId: marcus.id,
      },
      {
        id: "prop-005",
        address: "785 Peachtree St NE",
        city: "Atlanta",
        state: "GA",
        zip: "30308",
        county: "Fulton",
        propertyType: "condo",
        assessedValue: 245000,
        marketValue: 298000,
        taxRate: 1.87,
        annualTax: 4581,
        yearBuilt: 2015,
        sqft: 1050,
        bedrooms: 1,
        bathrooms: 1,
        lastAssessmentDate: "2025-02-15",
        ownerId: marcus.id,
      },
      {
        id: "prop-006",
        address: "3415 Montrose Blvd",
        city: "Houston",
        state: "TX",
        zip: "77006",
        county: "Harris",
        propertyType: "multi-family",
        assessedValue: 685000,
        marketValue: 790000,
        taxRate: 2.31,
        annualTax: 15823,
        yearBuilt: 1985,
        sqft: 4800,
        bedrooms: 8,
        bathrooms: 6,
        lotSize: 12000,
        lastAssessmentDate: "2025-01-15",
        ownerId: marcus.id,
      },
      {
        id: "prop-007",
        address: "5600 N Central Expy",
        city: "Dallas",
        state: "TX",
        zip: "75206",
        county: "Dallas",
        propertyType: "commercial",
        assessedValue: 780000,
        marketValue: 920000,
        taxRate: 2.18,
        annualTax: 17004,
        yearBuilt: 1992,
        sqft: 5500,
        lotSize: 15000,
        lastAssessmentDate: "2025-01-20",
        ownerId: marcus.id,
      },
      {
        id: "prop-008",
        address: "1122 S Lamar Blvd",
        city: "Austin",
        state: "TX",
        zip: "78704",
        county: "Travis",
        propertyType: "single-family",
        assessedValue: 465000,
        marketValue: 540000,
        taxRate: 1.95,
        annualTax: 9067,
        yearBuilt: 2008,
        sqft: 2100,
        bedrooms: 3,
        bathrooms: 2,
        lotSize: 5800,
        lastAssessmentDate: "2025-04-01",
        ownerId: marcus.id,
      },
      {
        id: "prop-009",
        address: "403 W Riverside Dr",
        city: "Austin",
        state: "TX",
        zip: "78704",
        county: "Travis",
        propertyType: "condo",
        assessedValue: 350000,
        marketValue: 410000,
        taxRate: 1.95,
        annualTax: 6825,
        yearBuilt: 2018,
        sqft: 1400,
        bedrooms: 2,
        bathrooms: 2,
        lastAssessmentDate: "2025-04-01",
        ownerId: marcus.id,
      },
      {
        id: "prop-010",
        address: "6740 Woodlands Pkwy",
        city: "The Woodlands",
        state: "TX",
        zip: "77382",
        county: "Montgomery",
        propertyType: "single-family",
        assessedValue: 425000,
        marketValue: 495000,
        taxRate: 2.42,
        annualTax: 10285,
        yearBuilt: 2010,
        sqft: 2800,
        bedrooms: 4,
        bathrooms: 3,
        lotSize: 8500,
        lastAssessmentDate: "2025-01-30",
        ownerId: marcus.id,
      },

      // ── Sarah Mitchell (prop-011) ──
      {
        id: "prop-011",
        address: "2901 S King Dr",
        city: "Chicago",
        state: "IL",
        zip: "60616",
        county: "Cook",
        propertyType: "multi-family",
        assessedValue: 490000,
        marketValue: 575000,
        taxRate: 2.1,
        annualTax: 10290,
        yearBuilt: 1975,
        sqft: 3600,
        bedrooms: 6,
        bathrooms: 4,
        lotSize: 5000,
        lastAssessmentDate: "2025-02-01",
        ownerId: sarah.id,
      },

      // ── David Chen (prop-012, prop-013) ──
      {
        id: "prop-012",
        address: "150 E Robinson St",
        city: "Orlando",
        state: "FL",
        zip: "32801",
        county: "Orange",
        propertyType: "condo",
        assessedValue: 198000,
        marketValue: 245000,
        taxRate: 1.73,
        annualTax: 3425,
        yearBuilt: 2020,
        sqft: 950,
        bedrooms: 1,
        bathrooms: 1,
        lastAssessmentDate: "2025-03-15",
        ownerId: david.id,
      },
      {
        id: "prop-013",
        address: "8820 Bellaire Blvd",
        city: "Houston",
        state: "TX",
        zip: "77036",
        county: "Harris",
        propertyType: "commercial",
        assessedValue: 550000,
        marketValue: 640000,
        taxRate: 2.31,
        annualTax: 12705,
        yearBuilt: 1988,
        sqft: 4200,
        lotSize: 10000,
        lastAssessmentDate: "2025-01-15",
        ownerId: david.id,
      },

      // ── Linda Patel (prop-014, prop-015) ──
      {
        id: "prop-014",
        address: "4455 E Shea Blvd",
        city: "Phoenix",
        state: "AZ",
        zip: "85028",
        county: "Maricopa",
        propertyType: "vacant-land",
        assessedValue: 155000,
        marketValue: 195000,
        taxRate: 1.6,
        annualTax: 2480,
        yearBuilt: 0,
        sqft: 0,
        lotSize: 43560,
        lastAssessmentDate: "2025-03-10",
        ownerId: linda.id,
      },
      {
        id: "prop-015",
        address: "1200 Peachtree Rd NE",
        city: "Atlanta",
        state: "GA",
        zip: "30309",
        county: "Fulton",
        propertyType: "single-family",
        assessedValue: 395000,
        marketValue: 470000,
        taxRate: 1.87,
        annualTax: 7386,
        yearBuilt: 2003,
        sqft: 2650,
        bedrooms: 4,
        bathrooms: 3,
        lotSize: 8200,
        lastAssessmentDate: "2025-02-15",
        ownerId: linda.id,
      },
    ],
  });

  console.log(`  Created 15 properties.\n`);

  // ── 6. Create Appeals ──────────────────────────────────

  console.log("  Creating appeals...");

  // apl-001: prop-001, Marcus, full-service, won, agent-001
  await prisma.appeal.create({
    data: {
      id: "apl-001",
      status: "won",
      serviceType: "full-service",
      priority: "medium",
      filedDate: "2025-02-10",
      hearingDate: "2025-04-15",
      originalAssessment: 385000,
      targetAssessment: 325000,
      finalAssessment: 330000,
      estimatedSavings: 1271,
      actualSavings: 1270,
      notes:
        "Successfully argued based on comparable sales in the area. Board agreed property was over-assessed.",
      internalNotes:
        "Strong comparable sales evidence. Board agreed to reduction. Client satisfied.",
      propertyId: "prop-001",
      userId: marcus.id,
      assignedAgent: "agent-001",
      statusHistory: {
        createMany: {
          data: [
            {
              fromStatus: null,
              toStatus: "draft",
              notes: "Appeal created",
              changedBy: marcus.id,
              createdAt: new Date("2025-02-08"),
            },
            {
              fromStatus: "draft",
              toStatus: "submitted",
              notes: "Appeal filed with Harris County",
              changedBy: "agent-001",
              createdAt: new Date("2025-02-10"),
            },
            {
              fromStatus: "submitted",
              toStatus: "hearing-scheduled",
              notes: "Hearing date set for April 15",
              changedBy: "agent-001",
              createdAt: new Date("2025-03-01"),
            },
            {
              fromStatus: "hearing-scheduled",
              toStatus: "won",
              notes: "Board reduced assessment to $330,000",
              changedBy: "agent-001",
              createdAt: new Date("2025-04-15"),
            },
          ],
        },
      },
    },
  });

  // apl-002: prop-003, Marcus, full-service, hearing-scheduled, agent-001
  await prisma.appeal.create({
    data: {
      id: "apl-002",
      status: "hearing-scheduled",
      serviceType: "full-service",
      priority: "high",
      filedDate: "2025-06-01",
      hearingDate: "2025-09-20",
      deadline: "2025-09-15",
      originalAssessment: 520000,
      targetAssessment: 450000,
      estimatedSavings: 1526,
      notes:
        "Hearing scheduled with Dallas County Appraisal Review Board. Strong comparable evidence prepared.",
      internalNotes:
        "Hearing with Dallas County ARB on 9/20. Presentation materials ready. Prep call with client scheduled 9/18.",
      propertyId: "prop-003",
      userId: marcus.id,
      assignedAgent: "agent-001",
      statusHistory: {
        createMany: {
          data: [
            {
              fromStatus: null,
              toStatus: "draft",
              notes: "Appeal created",
              changedBy: marcus.id,
              createdAt: new Date("2025-05-28"),
            },
            {
              fromStatus: "draft",
              toStatus: "submitted",
              notes: "Filed with Dallas County",
              changedBy: "agent-001",
              createdAt: new Date("2025-06-01"),
            },
            {
              fromStatus: "submitted",
              toStatus: "hearing-scheduled",
              notes: "Hearing date set for September 20",
              changedBy: "agent-001",
              createdAt: new Date("2025-07-15"),
            },
          ],
        },
      },
    },
  });

  // apl-003: prop-006, Marcus, investor-portfolio, under-review, agent-002
  await prisma.appeal.create({
    data: {
      id: "apl-003",
      status: "under-review",
      serviceType: "investor-portfolio",
      priority: "high",
      filedDate: "2025-07-15",
      deadline: "2025-10-01",
      originalAssessment: 685000,
      targetAssessment: 590000,
      estimatedSavings: 2194,
      notes:
        "Multi-family property. Submitted income approach analysis showing lower net operating income.",
      internalNotes:
        "Multi-family income approach analysis submitted. Awaiting ARB assignment.",
      propertyId: "prop-006",
      userId: marcus.id,
      assignedAgent: "agent-002",
      statusHistory: {
        createMany: {
          data: [
            {
              fromStatus: null,
              toStatus: "draft",
              notes: "Appeal created",
              changedBy: marcus.id,
              createdAt: new Date("2025-07-10"),
            },
            {
              fromStatus: "draft",
              toStatus: "submitted",
              notes: "Filed with Harris County",
              changedBy: "agent-002",
              createdAt: new Date("2025-07-15"),
            },
            {
              fromStatus: "submitted",
              toStatus: "under-review",
              notes: "Under review by appraisal district",
              changedBy: "agent-002",
              createdAt: new Date("2025-07-28"),
            },
          ],
        },
      },
    },
  });

  // apl-004: prop-002, Marcus, diy, won, agent-003
  await prisma.appeal.create({
    data: {
      id: "apl-004",
      status: "won",
      serviceType: "diy",
      priority: "low",
      filedDate: "2025-01-20",
      hearingDate: "2025-03-10",
      originalAssessment: 310000,
      targetAssessment: 270000,
      finalAssessment: 280000,
      estimatedSavings: 630,
      actualSavings: 630,
      notes:
        "Owner filed DIY appeal using our comparable sales report. Cook County reduced assessment.",
      internalNotes:
        "Client filed DIY with our report. Cook County reduced. Good outcome for DIY.",
      propertyId: "prop-002",
      userId: marcus.id,
      assignedAgent: "agent-003",
      statusHistory: {
        createMany: {
          data: [
            {
              fromStatus: null,
              toStatus: "draft",
              notes: "DIY appeal started",
              changedBy: marcus.id,
              createdAt: new Date("2025-01-15"),
            },
            {
              fromStatus: "draft",
              toStatus: "submitted",
              notes: "Filed by owner with Cook County",
              changedBy: marcus.id,
              createdAt: new Date("2025-01-20"),
            },
            {
              fromStatus: "submitted",
              toStatus: "hearing-scheduled",
              notes: "Hearing set for March 10",
              changedBy: "agent-003",
              createdAt: new Date("2025-02-10"),
            },
            {
              fromStatus: "hearing-scheduled",
              toStatus: "won",
              notes: "Cook County reduced to $280,000",
              changedBy: "agent-003",
              createdAt: new Date("2025-03-10"),
            },
          ],
        },
      },
    },
  });

  // apl-005: prop-007, Marcus, investor-portfolio, submitted, agent-002
  await prisma.appeal.create({
    data: {
      id: "apl-005",
      status: "submitted",
      serviceType: "investor-portfolio",
      priority: "medium",
      filedDate: "2025-08-01",
      deadline: "2025-11-15",
      originalAssessment: 780000,
      targetAssessment: 680000,
      estimatedSavings: 2180,
      notes:
        "Commercial property appeal filed. Awaiting assignment to review board.",
      internalNotes:
        "Commercial property. Filed with Dallas County. Awaiting docket assignment.",
      propertyId: "prop-007",
      userId: marcus.id,
      assignedAgent: "agent-002",
      statusHistory: {
        createMany: {
          data: [
            {
              fromStatus: null,
              toStatus: "draft",
              notes: "Appeal created for commercial property",
              changedBy: marcus.id,
              createdAt: new Date("2025-07-25"),
            },
            {
              fromStatus: "draft",
              toStatus: "submitted",
              notes: "Filed with Dallas County",
              changedBy: "agent-002",
              createdAt: new Date("2025-08-01"),
            },
          ],
        },
      },
    },
  });

  // apl-006: prop-010, Marcus, full-service, won, agent-004
  await prisma.appeal.create({
    data: {
      id: "apl-006",
      status: "won",
      serviceType: "full-service",
      priority: "medium",
      filedDate: "2025-03-05",
      hearingDate: "2025-05-22",
      originalAssessment: 425000,
      targetAssessment: 370000,
      finalAssessment: 375000,
      estimatedSavings: 1210,
      actualSavings: 1210,
      notes:
        "Montgomery County agreed to reduce after reviewing comparable sales and condition adjustments.",
      internalNotes:
        "Montgomery County agreed after reviewing condition adjustments. Smooth hearing.",
      propertyId: "prop-010",
      userId: marcus.id,
      assignedAgent: "agent-004",
      statusHistory: {
        createMany: {
          data: [
            {
              fromStatus: null,
              toStatus: "draft",
              notes: "Appeal created",
              changedBy: marcus.id,
              createdAt: new Date("2025-03-01"),
            },
            {
              fromStatus: "draft",
              toStatus: "submitted",
              notes: "Filed with Montgomery County",
              changedBy: "agent-004",
              createdAt: new Date("2025-03-05"),
            },
            {
              fromStatus: "submitted",
              toStatus: "hearing-scheduled",
              notes: "Hearing date set for May 22",
              changedBy: "agent-004",
              createdAt: new Date("2025-04-10"),
            },
            {
              fromStatus: "hearing-scheduled",
              toStatus: "won",
              notes: "Reduced to $375,000. Client satisfied.",
              changedBy: "agent-004",
              createdAt: new Date("2025-05-22"),
            },
          ],
        },
      },
    },
  });

  // apl-007: prop-011, Sarah, investor-portfolio, draft (no agent)
  await prisma.appeal.create({
    data: {
      id: "apl-007",
      status: "draft",
      serviceType: "investor-portfolio",
      priority: "medium",
      originalAssessment: 490000,
      targetAssessment: 420000,
      estimatedSavings: 1470,
      notes:
        "Preparing income approach documentation for Cook County multi-family appeal.",
      internalNotes:
        "New appeal in draft. Gathering comparable rent data for income approach.",
      propertyId: "prop-011",
      userId: sarah.id,
      statusHistory: {
        createMany: {
          data: [
            {
              fromStatus: null,
              toStatus: "draft",
              notes: "Appeal created",
              changedBy: sarah.id,
              createdAt: new Date("2025-08-10"),
            },
          ],
        },
      },
    },
  });

  // apl-008: prop-008, Marcus, diy, lost, agent-003
  await prisma.appeal.create({
    data: {
      id: "apl-008",
      status: "lost",
      serviceType: "diy",
      priority: "medium",
      filedDate: "2025-02-20",
      hearingDate: "2025-04-30",
      originalAssessment: 465000,
      targetAssessment: 400000,
      finalAssessment: 465000,
      estimatedSavings: 1267,
      actualSavings: 0,
      notes:
        "Travis County upheld original assessment. Comparable sales did not support reduction. Consider full-service for next year.",
      internalNotes:
        "Lost at hearing. Comparable evidence was weak in this submarket. Recommend full-service next year.",
      propertyId: "prop-008",
      userId: marcus.id,
      assignedAgent: "agent-003",
      statusHistory: {
        createMany: {
          data: [
            {
              fromStatus: null,
              toStatus: "draft",
              notes: "DIY appeal started",
              changedBy: marcus.id,
              createdAt: new Date("2025-02-15"),
            },
            {
              fromStatus: "draft",
              toStatus: "submitted",
              notes: "Filed with Travis County",
              changedBy: marcus.id,
              createdAt: new Date("2025-02-20"),
            },
            {
              fromStatus: "submitted",
              toStatus: "hearing-scheduled",
              notes: "Hearing set for April 30",
              changedBy: "agent-003",
              createdAt: new Date("2025-03-15"),
            },
            {
              fromStatus: "hearing-scheduled",
              toStatus: "lost",
              notes: "Travis County upheld original assessment at $465,000",
              changedBy: "agent-003",
              createdAt: new Date("2025-04-30"),
            },
          ],
        },
      },
    },
  });

  // apl-009: prop-013, David, full-service, under-review, agent-001
  await prisma.appeal.create({
    data: {
      id: "apl-009",
      status: "under-review",
      serviceType: "full-service",
      priority: "high",
      filedDate: "2025-07-20",
      deadline: "2025-10-30",
      originalAssessment: 550000,
      targetAssessment: 475000,
      estimatedSavings: 1732,
      notes:
        "Commercial property on Bellaire. Submitted market approach with recent comparable sales.",
      internalNotes:
        "Harris County commercial appeal. Market approach with strong recent comps submitted.",
      propertyId: "prop-013",
      userId: david.id,
      assignedAgent: "agent-001",
      statusHistory: {
        createMany: {
          data: [
            {
              fromStatus: null,
              toStatus: "draft",
              notes: "Appeal created",
              changedBy: david.id,
              createdAt: new Date("2025-07-15"),
            },
            {
              fromStatus: "draft",
              toStatus: "submitted",
              notes: "Filed with Harris County",
              changedBy: "agent-001",
              createdAt: new Date("2025-07-20"),
            },
            {
              fromStatus: "submitted",
              toStatus: "under-review",
              notes: "Under review by appraisal district",
              changedBy: "agent-001",
              createdAt: new Date("2025-08-05"),
            },
          ],
        },
      },
    },
  });

  // apl-010: prop-015, Linda, diy, withdrawn (no agent)
  await prisma.appeal.create({
    data: {
      id: "apl-010",
      status: "withdrawn",
      serviceType: "diy",
      priority: "low",
      filedDate: "2025-04-10",
      originalAssessment: 395000,
      targetAssessment: 350000,
      estimatedSavings: 841,
      actualSavings: 0,
      notes:
        "Owner withdrew appeal after receiving updated market analysis showing fair assessment.",
      internalNotes:
        "Client decided assessment was fair after reviewing updated comps. Withdrew voluntarily.",
      propertyId: "prop-015",
      userId: linda.id,
      statusHistory: {
        createMany: {
          data: [
            {
              fromStatus: null,
              toStatus: "draft",
              notes: "DIY appeal started",
              changedBy: linda.id,
              createdAt: new Date("2025-04-05"),
            },
            {
              fromStatus: "draft",
              toStatus: "submitted",
              notes: "Filed with Fulton County",
              changedBy: linda.id,
              createdAt: new Date("2025-04-10"),
            },
            {
              fromStatus: "submitted",
              toStatus: "withdrawn",
              notes: "Owner withdrew after reviewing updated market analysis",
              changedBy: linda.id,
              createdAt: new Date("2025-05-01"),
            },
          ],
        },
      },
    },
  });

  console.log(`  Created 10 appeals with status histories.\n`);

  // ── 7. Create Activity Log ─────────────────────────────

  console.log("  Creating activity log entries...");

  await prisma.activityLog.createMany({
    data: [
      {
        id: "log-001",
        action: "Appeal Filed",
        entityType: "appeal",
        entityId: "apl-005",
        agentName: "Brian Nguyen",
        details:
          "Filed commercial property appeal for Marcus Johnson — 5600 N Central Expy, Dallas, TX.",
        createdAt: daysAgo(1),
      },
      {
        id: "log-002",
        action: "Documents Uploaded",
        entityType: "appeal",
        entityId: "apl-002",
        agentName: "Amanda Foster",
        details:
          "Uploaded hearing prep notes for Marcus Johnson — 9032 Preston Rd, Dallas, TX.",
        createdAt: daysAgo(2),
      },
      {
        id: "log-003",
        action: "Hearing Scheduled",
        entityType: "appeal",
        entityId: "apl-002",
        agentName: "Amanda Foster",
        details:
          "Hearing scheduled for Marcus Johnson — 9032 Preston Rd, Dallas, TX on 9/20.",
        createdAt: daysAgo(3),
      },
      {
        id: "log-004",
        action: "Appeal Status Updated",
        entityType: "appeal",
        entityId: "apl-003",
        agentName: "Brian Nguyen",
        details:
          "Appeal for Marcus Johnson — 3415 Montrose Blvd, Houston, TX moved to Under Review.",
        createdAt: daysAgo(5),
      },
      {
        id: "log-005",
        action: "Client Note Added",
        entityType: "client",
        entityId: "user-david",
        agentName: "Amanda Foster",
        details:
          "Updated notes for David Chen: Commercial property appeal under review. Strong market evidence.",
        createdAt: daysAgo(6),
      },
      {
        id: "log-006",
        action: "Appeal Filed",
        entityType: "appeal",
        entityId: "apl-009",
        agentName: "Amanda Foster",
        details:
          "Filed commercial property appeal for David Chen — 8820 Bellaire Blvd, Houston, TX.",
        createdAt: daysAgo(8),
      },
      {
        id: "log-007",
        action: "Assessment Analysis Completed",
        entityType: "property",
        entityId: "prop-013",
        agentName: "Amanda Foster",
        details:
          "Completed initial assessment analysis for David Chen — 8820 Bellaire Blvd, Houston, TX.",
        createdAt: daysAgo(10),
      },
      {
        id: "log-008",
        action: "Appeal Filed",
        entityType: "appeal",
        entityId: "apl-003",
        agentName: "Brian Nguyen",
        details:
          "Filed multi-family appeal for Marcus Johnson — 3415 Montrose Blvd, Houston, TX.",
        createdAt: daysAgo(12),
      },
      {
        id: "log-009",
        action: "Portfolio Review Completed",
        entityType: "portfolio",
        entityId: "user-marcus",
        agentName: "Amanda Foster",
        details:
          "Quarterly portfolio review completed for Marcus Johnson. 10 properties, 6 active appeals.",
        createdAt: daysAgo(14),
      },
      {
        id: "log-010",
        action: "Client Onboarded",
        entityType: "client",
        entityId: "user-linda",
        agentName: "Derek Simmons",
        details:
          "New client Linda Patel onboarded. Two properties in Phoenix and Atlanta.",
        createdAt: daysAgo(16),
      },
      {
        id: "log-011",
        action: "Appeal Won",
        entityType: "appeal",
        entityId: "apl-006",
        agentName: "Derek Simmons",
        details:
          "Won appeal for Marcus Johnson — 6740 Woodlands Pkwy, The Woodlands, TX. Reduced from $425k to $375k.",
        createdAt: daysAgo(18),
      },
      {
        id: "log-012",
        action: "Hearing Completed",
        entityType: "appeal",
        entityId: "apl-006",
        agentName: "Derek Simmons",
        details:
          "Hearing completed for Marcus Johnson — 6740 Woodlands Pkwy. Assessment reduced to $375k.",
        createdAt: daysAgo(20),
      },
      {
        id: "log-013",
        action: "Appeal Lost",
        entityType: "appeal",
        entityId: "apl-008",
        agentName: "Carla Hernandez",
        details:
          "Appeal for Marcus Johnson — 1122 S Lamar Blvd, Austin, TX was denied. Assessment upheld at $465k.",
        createdAt: daysAgo(22),
      },
      {
        id: "log-014",
        action: "Appeal Won",
        entityType: "appeal",
        entityId: "apl-001",
        agentName: "Amanda Foster",
        details:
          "Won appeal for Marcus Johnson — 4521 Westheimer Rd, Houston, TX. Reduced from $385k to $330k.",
        createdAt: daysAgo(25),
      },
      {
        id: "log-015",
        action: "Appeal Won",
        entityType: "appeal",
        entityId: "apl-004",
        agentName: "Carla Hernandez",
        details:
          "DIY appeal won for Marcus Johnson — 1847 N Michigan Ave, Chicago, IL. Reduced from $310k to $280k.",
        createdAt: daysAgo(28),
      },
    ],
  });

  console.log(`  Created 15 activity log entries.\n`);

  // ── Done ───────────────────────────────────────────────

  console.log("✅ Seed completed successfully!");
  console.log("   Users:      5");
  console.log("   Agents:     5");
  console.log("   Properties: 15");
  console.log("   Appeals:    10");
  console.log("   Activity:   15");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
