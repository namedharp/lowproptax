import type { Service } from "@/lib/types";

export const mockServices: Service[] = [
  {
    id: "svc-full-service",
    slug: "full-service",
    name: "Full Service",
    shortDescription:
      "We handle your entire property tax appeal from start to finish, including hearing representation.",
    longDescription:
      "Our Full Service option is the hassle-free way to lower your property taxes. Our team of experienced property tax consultants will analyze your assessment, prepare a comprehensive appeal package with comparable sales data and market analysis, file all necessary paperwork, and represent you at your hearing. With our money-back guarantee, you only pay if we successfully reduce your taxes. We handle everything so you can focus on what matters most to you.",
    icon: "Shield",
    features: [
      "Complete assessment analysis and market valuation",
      "Professional appeal preparation with comparable sales",
      "All paperwork filed on your behalf",
      "Expert hearing representation",
      "Money-back guarantee if no reduction achieved",
      "Dedicated support throughout the process",
      "Post-hearing follow-up and verification",
    ],
    idealFor:
      "Homeowners who want a hands-off experience and the highest chance of a successful appeal.",
  },
  {
    id: "svc-diy",
    slug: "diy",
    name: "DIY",
    shortDescription:
      "Get the data, reports, and guidance you need to file your own property tax appeal.",
    longDescription:
      "Our DIY package gives you all the tools and information you need to successfully appeal your property tax assessment on your own. You will receive a detailed comparable sales report, a thorough assessment analysis highlighting potential over-valuations, step-by-step filing instructions specific to your county, and access to our email support team for questions along the way. This option is perfect for those who are comfortable with the process but need professional-grade data to support their case.",
    icon: "Wrench",
    features: [
      "Detailed property data and assessment breakdown",
      "Comparable sales report with market analysis",
      "Step-by-step filing instructions for your county",
      "Assessment analysis identifying over-valuations",
      "Email support for questions during the process",
      "Downloadable evidence package for your hearing",
    ],
    idealFor:
      "Homeowners comfortable filing their own appeal who want professional data and guidance at an affordable price.",
  },
  {
    id: "svc-investor",
    slug: "investor-portfolio",
    name: "Investor Portfolio",
    shortDescription:
      "Comprehensive property tax management for multi-property portfolios with dedicated support.",
    longDescription:
      "Our Investor Portfolio service is designed for real estate investors and property managers who need to manage property tax appeals across multiple properties efficiently. You get everything in our Full Service package, plus a dedicated account manager who knows your portfolio inside and out, a real-time portfolio dashboard for tracking all your appeals and savings, batch processing for filing multiple appeals simultaneously, priority support with faster response times, detailed ROI tracking and reporting, and volume discounts that increase your savings as your portfolio grows.",
    icon: "Building2",
    features: [
      "Everything included in Full Service",
      "Dedicated account manager for your portfolio",
      "Real-time portfolio dashboard and analytics",
      "Batch processing for multiple properties",
      "Priority support with expedited response times",
      "Comprehensive ROI tracking and reporting",
      "Volume discounts based on portfolio size",
      "Quarterly portfolio review and strategy sessions",
    ],
    idealFor:
      "Real estate investors and property managers with multiple properties who want to maximize tax savings across their entire portfolio.",
  },
];
