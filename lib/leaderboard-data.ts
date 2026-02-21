export interface TeamMember {
  id: string
  name: string
  role: string
  avatar: string
  rank: number
  score: number
  streak: number
  tasksCompleted: number
  tasksTotal: number
  hoursLogged: number
  efficiency: number
  trend: "up" | "down" | "stable"
  trendValue: number
  // New folio-SKU metrics (optional for backward compat with mock data)
  foliosCompleted?: number
  distinctSkus?: number
  totalQuantity?: number
  weightKg?: number
  volumeM3?: number
}

export interface DayProgress {
  hour: string
  completed: number
  target: number
}

export interface Resource {
  id: string
  name: string
  category: string
  allocated: number
  used: number
  unit: string
  status: "on-track" | "at-risk" | "exceeded"
  owner: string
}

export const teamMembers: TeamMember[] = [
  {
    id: "1",
    name: "Alejandro RL",
    role: "Lead Engineer",
    avatar: "SC",
    rank: 1,
    score: 2840,
    streak: 14,
    tasksCompleted: 23,
    tasksTotal: 25,
    hoursLogged: 7.5,
    efficiency: 96,
    trend: "up",
    trendValue: 12,
  },
  {
    id: "2",
    name: "Marcus Johnson",
    role: "Senior Designer",
    avatar: "MJ",
    rank: 2,
    score: 2615,
    streak: 9,
    tasksCompleted: 19,
    tasksTotal: 22,
    hoursLogged: 6.8,
    efficiency: 91,
    trend: "up",
    trendValue: 8,
  },
  {
    id: "3",
    name: "Elena Rodriguez",
    role: "Product Manager",
    avatar: "ER",
    rank: 3,
    score: 2490,
    streak: 7,
    tasksCompleted: 17,
    tasksTotal: 20,
    hoursLogged: 7.2,
    efficiency: 88,
    trend: "stable",
    trendValue: 1,
  },
  {
    id: "4",
    name: "Alex Kim",
    role: "Frontend Dev",
    avatar: "AK",
    rank: 4,
    score: 2310,
    streak: 5,
    tasksCompleted: 15,
    tasksTotal: 20,
    hoursLogged: 6.5,
    efficiency: 84,
    trend: "up",
    trendValue: 5,
  },
  {
    id: "5",
    name: "Priya Patel",
    role: "Data Analyst",
    avatar: "PP",
    rank: 5,
    score: 2180,
    streak: 3,
    tasksCompleted: 14,
    tasksTotal: 18,
    hoursLogged: 6.0,
    efficiency: 82,
    trend: "down",
    trendValue: 3,
  },
  {
    id: "6",
    name: "Tom Wilson",
    role: "Backend Dev",
    avatar: "TW",
    rank: 6,
    score: 2050,
    streak: 11,
    tasksCompleted: 12,
    tasksTotal: 16,
    hoursLogged: 5.8,
    efficiency: 79,
    trend: "up",
    trendValue: 6,
  },
  {
    id: "7",
    name: "Nia Okafor",
    role: "QA Engineer",
    avatar: "NO",
    rank: 7,
    score: 1920,
    streak: 2,
    tasksCompleted: 11,
    tasksTotal: 15,
    hoursLogged: 5.5,
    efficiency: 76,
    trend: "stable",
    trendValue: 0,
  },
]

export const dayProgressData: DayProgress[] = [
  { hour: "8am", completed: 2, target: 3 },
  { hour: "9am", completed: 5, target: 6 },
  { hour: "10am", completed: 9, target: 9 },
  { hour: "11am", completed: 14, target: 12 },
  { hour: "12pm", completed: 16, target: 15 },
  { hour: "1pm", completed: 17, target: 18 },
  { hour: "2pm", completed: 22, target: 21 },
  { hour: "3pm", completed: 26, target: 24 },
  { hour: "4pm", completed: 30, target: 27 },
  { hour: "5pm", completed: 33, target: 30 },
]

export const resources: Resource[] = [
  {
    id: "r1",
    name: "Cloud Compute",
    category: "Infrastructure",
    allocated: 500,
    used: 387,
    unit: "vCPU hrs",
    status: "on-track",
    owner: "Alejandro RL",
  },
  {
    id: "r2",
    name: "Storage",
    category: "Infrastructure",
    allocated: 2000,
    used: 1840,
    unit: "GB",
    status: "at-risk",
    owner: "Tom Wilson",
  },
  {
    id: "r3",
    name: "API Calls",
    category: "Services",
    allocated: 100000,
    used: 62400,
    unit: "requests",
    status: "on-track",
    owner: "Alex Kim",
  },
  {
    id: "r4",
    name: "CI/CD Minutes",
    category: "DevOps",
    allocated: 3000,
    used: 2100,
    unit: "min",
    status: "on-track",
    owner: "Marcus Johnson",
  },
  {
    id: "r5",
    name: "Database IOPS",
    category: "Infrastructure",
    allocated: 10000,
    used: 10200,
    unit: "ops/s",
    status: "exceeded",
    owner: "Elena Rodriguez",
  },
  {
    id: "r6",
    name: "CDN Bandwidth",
    category: "Network",
    allocated: 500,
    used: 285,
    unit: "GB",
    status: "on-track",
    owner: "Priya Patel",
  },
]
