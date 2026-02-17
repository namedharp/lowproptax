import type { Agent } from "@/lib/types";

export const mockAgents: Agent[] = [
  {
    id: "agent-001",
    name: "Amanda Foster",
    email: "amanda.foster@lowproptax.com",
    role: "manager",
    activeAppeals: 14,
    totalWins: 87,
    successRate: 82,
  },
  {
    id: "agent-002",
    name: "Brian Nguyen",
    email: "brian.nguyen@lowproptax.com",
    role: "agent",
    activeAppeals: 8,
    totalWins: 52,
    successRate: 76,
  },
  {
    id: "agent-003",
    name: "Carla Hernandez",
    email: "carla.hernandez@lowproptax.com",
    role: "agent",
    activeAppeals: 6,
    totalWins: 41,
    successRate: 79,
  },
  {
    id: "agent-004",
    name: "Derek Simmons",
    email: "derek.simmons@lowproptax.com",
    role: "agent",
    activeAppeals: 5,
    totalWins: 34,
    successRate: 74,
  },
  {
    id: "agent-005",
    name: "Elena Kowalski",
    email: "elena.kowalski@lowproptax.com",
    role: "admin",
    activeAppeals: 3,
    totalWins: 63,
    successRate: 85,
  },
];
