import type { ChatMessage } from "@/lib/types";

export const mockChatMessages: ChatMessage[] = [
  {
    id: "msg-001",
    role: "assistant",
    content:
      "Hello! I'm your LowPropTax AI assistant. I can help you understand your property tax assessment, find potential savings, and guide you through the appeal process. How can I help you today?",
    timestamp: "2025-08-15T10:00:00Z",
  },
  {
    id: "msg-002",
    role: "user",
    content:
      "Hi, I just got my property tax assessment and it went up 20% from last year. That seems way too high. What can I do?",
    timestamp: "2025-08-15T10:01:15Z",
  },
  {
    id: "msg-003",
    role: "assistant",
    content:
      "A 20% increase is significant and definitely worth investigating. Many assessments contain errors or are based on outdated or inaccurate data. Here's what I recommend:\n\n1. **Verify the details** — Check that your property's square footage, bedroom/bathroom count, and lot size are correct in the assessment.\n2. **Compare with neighbors** — Look at what similar homes in your area are assessed at.\n3. **Review comparable sales** — Recent sales of similar properties are the strongest evidence in an appeal.\n\nWould you like me to pull up your property details so we can start analyzing your assessment?",
    timestamp: "2025-08-15T10:01:45Z",
  },
  {
    id: "msg-004",
    role: "user",
    content:
      "Yes, my property is at 4521 Westheimer Rd in Houston, TX 77027.",
    timestamp: "2025-08-15T10:02:30Z",
  },
  {
    id: "msg-005",
    role: "assistant",
    content:
      "I found your property. Here's a summary:\n\n- **Address:** 4521 Westheimer Rd, Houston, TX 77027\n- **Current Assessment:** $385,000\n- **Estimated Market Value:** $450,000\n- **Tax Rate:** 2.31%\n- **Annual Tax:** $8,893\n\nLooking at comparable sales in your area, several similar properties have sold for less than your assessed value. Based on my initial analysis, your property may be over-assessed by approximately $55,000 to $60,000. This could mean potential savings of around $1,270 to $1,386 per year.\n\nWould you like to explore filing an appeal?",
    timestamp: "2025-08-15T10:02:50Z",
  },
  {
    id: "msg-006",
    role: "user",
    content:
      "That sounds great. What are my options for filing an appeal?",
    timestamp: "2025-08-15T10:03:30Z",
  },
  {
    id: "msg-007",
    role: "assistant",
    content:
      "You have two main options:\n\n**DIY ($149/property)**\nYou get a detailed comparable sales report, assessment analysis, and step-by-step filing instructions. You handle the filing and hearing yourself, with email support from our team.\n\n**Full Service ($399/property)**\nWe handle everything — from preparing your appeal with evidence, to filing the paperwork, to representing you at the hearing. Plus, we offer a money-back guarantee if we don't reduce your assessment.\n\nGiven your potential savings of $1,270+/year, either option would pay for itself in the first year. The Full Service option has a higher success rate since our experts know exactly how to present cases to the Harris County Appraisal Review Board.\n\nWhich option interests you?",
    timestamp: "2025-08-15T10:03:55Z",
  },
  {
    id: "msg-008",
    role: "user",
    content:
      "Let's go with Full Service. What happens next?",
    timestamp: "2025-08-15T10:04:30Z",
  },
];
