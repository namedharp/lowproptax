import type { ProcessStep } from "@/lib/types";

export const mockProcessSteps: ProcessStep[] = [
  {
    step: 1,
    title: "Look Up Your Property",
    description:
      "Enter your address and we will pull your property details, current assessed value, and tax information from public records.",
    icon: "Search",
  },
  {
    step: 2,
    title: "Review Your Assessment",
    description:
      "We analyze your property assessment against comparable sales, market trends, and property characteristics to identify potential over-valuations.",
    icon: "FileSearch",
  },
  {
    step: 3,
    title: "File Your Appeal",
    description:
      "Choose DIY with our guided tools or let our Full Service team prepare and file your appeal with all supporting evidence and documentation.",
    icon: "FileText",
  },
  {
    step: 4,
    title: "Attend Hearing",
    description:
      "Present your case at the appraisal review board hearing. With Full Service, our experts represent you and argue for a fair assessment.",
    icon: "Users",
  },
  {
    step: 5,
    title: "Save on Property Taxes",
    description:
      "Once your appeal is approved, enjoy a reduced assessment and lower property tax bill. Many homeowners save hundreds to thousands of dollars each year.",
    icon: "DollarSign",
  },
];
