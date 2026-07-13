import { collection, getDocs, doc, setDoc, writeBatch } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { UserProfile, Due, Violation, DocumentItem, CommunicationItem, BehavioralLogItem, Expense, Budget, MessageThread, SecureMessage, ACCRequest, WorkOrder, AmenityBooking } from "../types";

export const MOCK_USERS: UserProfile[] = [
  {
    id: "user_marcus",
    name: "Marcus Aurelius",
    email: "marcus.board@hoa-tracker.com",
    role: "board_member",
    address: "101 Emperor Way",
    phone: "(555) 123-4567",
    joinedDate: "2024-01-15T10:00:00Z",
    status: "active",
    balance: 0,
  },
  {
    id: "user_john",
    name: "John Smith",
    email: "john.smith@gmail.com",
    role: "resident",
    address: "204 Pine Needles Lane",
    phone: "(555) 987-6543",
    joinedDate: "2024-03-10T14:30:00Z",
    status: "active",
    balance: 250,
  },
  {
    id: "user_clara",
    name: "Clara Barton",
    email: "clara.barton@yahoo.com",
    role: "resident",
    address: "305 Red Cross Circle",
    phone: "(555) 456-7890",
    joinedDate: "2024-05-22T09:15:00Z",
    status: "active",
    balance: 50,
  },
  {
    id: "user_sophie",
    name: "Sophie Germain",
    email: "sophie.g@math.org",
    role: "resident",
    address: "412 Prime Avenue",
    phone: "(555) 321-6540",
    joinedDate: "2024-08-01T11:00:00Z",
    status: "active",
    balance: 0,
  },
];

const MOCK_DUES: Due[] = [
  {
    id: "due_q1_marcus",
    residentId: "user_marcus",
    residentName: "Marcus Aurelius",
    residentAddress: "101 Emperor Way",
    amount: 250,
    dueDate: "2026-01-15",
    paidDate: "2026-01-10T12:00:00Z",
    status: "paid",
    description: "Q1 2026 HOA Assessment Dues",
  },
  {
    id: "due_q1_john",
    residentId: "user_john",
    residentName: "John Smith",
    residentAddress: "204 Pine Needles Lane",
    amount: 250,
    dueDate: "2026-01-15",
    status: "unpaid",
    description: "Q1 2026 HOA Assessment Dues",
  },
  {
    id: "due_q1_clara",
    residentId: "user_clara",
    residentName: "Clara Barton",
    residentAddress: "305 Red Cross Circle",
    amount: 250,
    dueDate: "2026-01-15",
    paidDate: "2026-01-14T16:45:00Z",
    status: "paid",
    description: "Q1 2026 HOA Assessment Dues",
  },
  {
    id: "due_q1_sophie",
    residentId: "user_sophie",
    residentName: "Sophie Germain",
    residentAddress: "412 Prime Avenue",
    amount: 250,
    dueDate: "2026-01-15",
    paidDate: "2026-01-11T09:30:00Z",
    status: "paid",
    description: "Q1 2026 HOA Assessment Dues",
  },
  {
    id: "due_late_clara",
    residentId: "user_clara",
    residentName: "Clara Barton",
    residentAddress: "305 Red Cross Circle",
    amount: 50,
    dueDate: "2026-02-15",
    status: "overdue",
    description: "Pet Policy Infraction Fine",
  },
];

const MOCK_VIOLATIONS: Violation[] = [
  {
    id: "viol_1",
    residentId: "user_john",
    residentName: "John Smith",
    residentAddress: "204 Pine Needles Lane",
    title: "Unapproved Exterior Paint",
    description: "Resident repainted their front door in neon purple without obtaining Architectural Control Committee approval.",
    reportedDate: "2026-06-15",
    status: "fine_issued",
    fineAmount: 100,
    notes: "First warning was sent on 2026-06-01. Purple door is still outstanding. Fine issued on 2026-06-15. Resident submitted feedback about liking the color.",
  },
  {
    id: "viol_2",
    residentId: "user_clara",
    residentName: "Clara Barton",
    residentAddress: "305 Red Cross Circle",
    title: "Trash Cans Left on Curb",
    description: "Trash bins were left on the street curb for three days past the Tuesday trash pick-up window.",
    reportedDate: "2026-06-20",
    status: "resolved",
    fineAmount: 0,
    notes: "Spoke to Clara Barton; she was away on emergency medical shift and couldn't store them. Neighbor helped put them away. Issue closed, warning revoked.",
  },
  {
    id: "viol_3",
    residentId: "user_john",
    residentName: "John Smith",
    residentAddress: "204 Pine Needles Lane",
    title: "Unleashed Dog in Play Area",
    description: "Golden retriever was observed running loose with no leash in the children's park area, violating Bylaw Section 4.",
    reportedDate: "2026-06-28",
    status: "under_review",
    fineAmount: 0,
    notes: "Reported by neighbor. Resident was sent a warning via message. Awaiting response.",
  },
];

const MOCK_DOCUMENTS: DocumentItem[] = [
  {
    id: "doc_bylaws",
    title: "HOA Master Declaration & Bylaws",
    description: "The official governing regulations for community property use, architectural review standards, and collection policies.",
    category: "bylaws",
    uploadDate: "2024-01-01",
    version: "v3.2",
  },
  {
    id: "doc_acc",
    title: "Architectural Review Application (ACC) Form",
    description: "Mandatory form for all exterior home improvements including paint, fencing, roofs, solar panels, and decks.",
    category: "guidelines",
    uploadDate: "2025-03-12",
    version: "v1.4",
  },
  {
    id: "doc_budget_2026",
    title: "HOA Annual Budget & Financial Projections",
    description: "Detailed financial breakdown of reserve funds, operational costs, landscaping service logs, and clubhouse maintenance fees.",
    category: "financials",
    uploadDate: "2025-12-10",
    version: "v2026.1",
  },
  {
    id: "doc_minutes_may",
    title: "Board Meeting Minutes - May 2026",
    description: "Official summary of decisions regarding clubhouse pool resurfacing, landscaping contractor replacement, and fine scale updates.",
    category: "meeting_minutes",
    uploadDate: "2026-05-15",
    version: "v1.0",
  },
];

const MOCK_COMMUNICATIONS: CommunicationItem[] = [
  {
    id: "comm_1",
    authorId: "user_marcus",
    authorName: "Marcus Aurelius",
    authorRole: "board_member",
    title: "Clubhouse Pool Resurfacing & Closure Notice",
    content: "Please note that the community swimming pool will be closed for structural resurfacing and minor tiling repairs from Monday, July 6th through Friday, July 10th. We apologize for the warm weather inconvenience, but these repairs are essential to pass state safety code reviews. Thank you for your cooperation!",
    type: "announcement",
    date: "2026-06-25T08:00:00Z",
    likes: 12,
    comments: [
      {
        id: "c1",
        authorName: "John Smith",
        authorRole: "resident",
        content: "Thanks for the update. Good to see the upkeep!",
        date: "2026-06-25T10:15:00Z",
      },
      {
        id: "c2",
        authorName: "Clara Barton",
        authorRole: "resident",
        content: "Will the poolside lounge chairs be cleaned too?",
        date: "2026-06-25T14:20:00Z",
      },
    ],
  },
  {
    id: "comm_2",
    authorId: "user_john",
    authorName: "John Smith",
    authorRole: "resident",
    title: "Recommendations for Landscaping / Weeds?",
    content: "Does anyone have a contact for a reliable and affordable yard service? The spring weeds have grown out of control in my side yard, and I'd like to get it tidied up before I end up on the HOA violations report! Please leave any phone numbers or recommendations below.",
    type: "discussion",
    date: "2026-06-29T11:40:00Z",
    likes: 4,
    comments: [
      {
        id: "c3",
        authorName: "Sophie Germain",
        authorRole: "resident",
        content: "I highly recommend Green Thumb Landscaping! They do my lawn for $45 a session and they are extremely neat and quick. (555) 777-8899.",
        date: "2026-06-29T13:02:00Z",
      },
    ],
  },
];

const MOCK_BEHAVIORAL_LOGS: BehavioralLogItem[] = [
  {
    id: "log_1",
    submittedBy: "Marcus Aurelius",
    description: "Repeated parking of a large commercial service truck overnight in the narrow cul-de-sac. Two adjacent residents complained in forums and began calling each other out aggressively online. An argument nearly escalated physically near the mailboxes on Thursday afternoon.",
    date: "2026-06-20T17:30:00Z",
    analysis: {
      threatLevel: "medium",
      summary: "Parking friction escalated to online harassment and a physical near-confrontation.",
      behavioralAnalysis: "Friction is driven by narrow street access, but escalated significantly due to text-based community forums lacking verbal nuance. Emotional venting online built systemic hostility, resulting in 'mailbox tribalism' where neighbors took sides.",
      securityRecommendations: "1. Add clear 'No Obstruction' paint markers on cul-de-sac curbs. 2. Establish a clear, structured mediation protocol rather than allowing public flaming on boards. 3. Deploy a security cruiser patrol during mailbox delivery hours (3 PM - 5 PM) to deter physical confrontations.",
      socialFabricImpact: "Highly negative impact on community trust. Left unchecked, neighbors are forming hostile cliques. Resolving via direct physical curb lines and warm board mediation will neutralize personal blame.",
    },
  },
];

const MOCK_EXPENSES: Expense[] = [
  {
    id: "exp_1",
    category: "Landscaping",
    amount: 2200,
    date: "2026-05-10",
    description: "Mowing, weeding, edging, and spring planting across common area properties."
  },
  {
    id: "exp_2",
    category: "Pool Maintenance",
    amount: 1200,
    date: "2026-06-12",
    description: "Deposit for tile resurfacing and main filtration backwash treatment."
  },
  {
    id: "exp_3",
    category: "Utilities",
    amount: 850,
    date: "2026-06-15",
    description: "Lighting, street lamp, and clubhouse HVAC power utility bill."
  },
  {
    id: "exp_4",
    category: "Administration",
    amount: 400,
    date: "2026-04-18",
    description: "Professional accounting ledger subscription and tax filing service."
  },
  {
    id: "exp_5",
    category: "Repairs & Reserves",
    amount: 1500,
    date: "2026-06-02",
    description: "Repaired broken perimeter security fencing on the south boundary."
  }
];

const MOCK_BUDGETS: Budget[] = [
  {
    id: "bud_landscaping",
    category: "Landscaping",
    allocated: 5000,
    period: "Annual 2026"
  },
  {
    id: "bud_pool",
    category: "Pool Maintenance",
    allocated: 3000,
    period: "Annual 2026"
  },
  {
    id: "bud_utilities",
    category: "Utilities",
    allocated: 2000,
    period: "Annual 2026"
  },
  {
    id: "bud_admin",
    category: "Administration",
    allocated: 1500,
    period: "Annual 2026"
  },
  {
    id: "bud_repairs",
    category: "Repairs & Reserves",
    allocated: 4000,
    period: "Annual 2026"
  }
];

const MOCK_THREADS: MessageThread[] = [
  {
    id: "user_john",
    residentId: "user_john",
    residentName: "John Smith",
    residentAddress: "204 Pine Needles Lane",
    lastUpdated: "2026-06-28T14:30:00Z",
    lastMessageSnippet: "Hello Board, can you review the fine on my account? I repainted my door."
  }
];

const MOCK_SECURE_MESSAGES: SecureMessage[] = [
  {
    id: "msg_1",
    threadId: "user_john",
    senderId: "user_john",
    senderName: "John Smith",
    senderRole: "resident",
    recipientId: "board",
    content: "Hello Board, can you review the fine on my account? I repainted my door. I have submitted an architectural review application for it as well. Thanks!",
    date: "2026-06-28T14:30:00Z"
  }
];

export const MOCK_ACC_REQUESTS: ACCRequest[] = [
  {
    id: "acc_1",
    residentId: "user_john",
    residentName: "John Smith",
    residentAddress: "204 Pine Needles Lane",
    projectType: "painting",
    description: "Repainting front door deep mahogany red to complement the white house trim.",
    materialsDetails: "Sherwin Williams paint #SW203 Mahogany Satin Outdoor Acrylic.",
    submittedDate: "2026-06-25",
    status: "pending"
  },
  {
    id: "acc_2",
    residentId: "user_clara",
    residentName: "Clara Barton",
    residentAddress: "305 Red Cross Circle",
    projectType: "fence",
    description: "Installing a 4ft high cedar wood picket fence around back garden area to keep small dog secure.",
    materialsDetails: "Pre-assembled 4-ft tall cedar picket fence panels with galvanized posts.",
    submittedDate: "2026-06-18",
    status: "approved",
    boardNotes: "Approved. Must be set back at least 5 feet from the public sidewalk.",
    decisionDate: "2026-06-20"
  },
  {
    id: "acc_3",
    residentId: "user_sophie",
    residentName: "Sophie Germain",
    residentAddress: "412 Prime Avenue",
    projectType: "roofing",
    description: "Complete shingle replacement due to minor hail damage. Changing from green shingles to standard charcoal gray.",
    materialsDetails: "Gaf Timberline HDX Lifetime Architectural Shingles in Charcoal Gray.",
    submittedDate: "2026-06-22",
    status: "approved",
    boardNotes: "Approved. Charcoal gray is a pre-approved community shingle color.",
    decisionDate: "2026-06-24"
  }
];

export const MOCK_WORK_ORDERS: WorkOrder[] = [
  {
    id: "wo_1",
    reportedBy: "user_john",
    reporterName: "John Smith",
    title: "Street lamp post #45 flickers",
    location: "Intersection of Pine Needles Lane and Birch Road",
    description: "The neighborhood street lamp post #45 flickers repeatedly at night and makes a buzzing sound. Highly distracting and creates dark pockets on the sidewalk.",
    category: "lighting",
    submittedDate: "2026-06-27",
    status: "in_progress",
    assignedVendor: "VoltStar Electrical Services"
  },
  {
    id: "wo_2",
    reportedBy: "user_clara",
    reporterName: "Clara Barton",
    title: "Broken pool gate self-closer",
    location: "Community Pool North Entrance Gate",
    description: "The self-closing magnetic latch on the north entrance gate to the pool is broken. The gate stays slightly propped open, which is a major child safety hazard.",
    category: "pool",
    submittedDate: "2026-06-29",
    status: "submitted"
  },
  {
    id: "wo_3",
    reportedBy: "user_sophie",
    reporterName: "Sophie Germain",
    title: "Fallen oak branch blocks path",
    location: "North jogging trail near mile marker 0.4",
    description: "A large oak branch has snapped during yesterday's storm and is fully blocking the walking/jogging path. Joggers have to detour into the mud.",
    category: "landscaping",
    submittedDate: "2026-06-28",
    status: "completed",
    assignedVendor: "GreenEdge Landscaping",
    completionDate: "2026-06-29"
  }
];

export const MOCK_AMENITY_BOOKINGS: AmenityBooking[] = [
  {
    id: "book_1",
    residentId: "user_john",
    residentName: "John Smith",
    amenityName: "Clubhouse",
    bookingDate: "2026-07-04",
    timeSlot: "1:00 PM - 5:00 PM",
    status: "confirmed",
    notes: "Hosting a small family Independence Day lunch. Expecting about 15 guests."
  },
  {
    id: "book_2",
    residentId: "user_clara",
    residentName: "Clara Barton",
    amenityName: "Community Pavilion",
    bookingDate: "2026-07-11",
    timeSlot: "10:00 AM - 2:00 PM",
    status: "confirmed",
    notes: "Children's charity committee outdoor meeting."
  },
  {
    id: "book_3",
    residentId: "user_sophie",
    residentName: "Sophie Germain",
    amenityName: "Tennis Court",
    bookingDate: "2026-07-01",
    timeSlot: "5:00 PM - 7:00 PM",
    status: "confirmed",
    notes: "Singles match practice."
  }
];

export async function seedDatabaseIfEmpty() {
  let activePath: string | null = null;
  try {
    activePath = "users";
    const usersSnap = await getDocs(collection(db, "users"));
    if (!usersSnap.empty) {
      console.log("Database already seeded with data. Skipping seeder.");
      return;
    }

    console.log("Database is empty. Initiating data seeding...");

    // Batch seed users
    for (const user of MOCK_USERS) {
      await setDoc(doc(db, "users", user.id), user);
    }

    // Batch seed dues
    activePath = "dues";
    for (const due of MOCK_DUES) {
      await setDoc(doc(db, "dues", due.id), due);
    }

    // Batch seed violations
    activePath = "violations";
    for (const v of MOCK_VIOLATIONS) {
      await setDoc(doc(db, "violations", v.id), v);
    }

    // Batch seed documents
    activePath = "documents";
    for (const docItem of MOCK_DOCUMENTS) {
      await setDoc(doc(db, "documents", docItem.id), docItem);
    }

    // Batch seed communications
    activePath = "communications";
    for (const comm of MOCK_COMMUNICATIONS) {
      await setDoc(doc(db, "communications", comm.id), comm);
    }

    // Batch seed behavioral logs
    activePath = "behavioralLogs";
    for (const logItem of MOCK_BEHAVIORAL_LOGS) {
      await setDoc(doc(db, "behavioralLogs", logItem.id), logItem);
    }

    // Batch seed financial expenses
    activePath = "expenses";
    for (const exp of MOCK_EXPENSES) {
      await setDoc(doc(db, "expenses", exp.id), exp);
    }

    // Batch seed financial budgets
    activePath = "budgets";
    for (const bud of MOCK_BUDGETS) {
      await setDoc(doc(db, "budgets", bud.id), bud);
    }

    // Batch seed secure message threads
    activePath = "messageThreads";
    for (const thread of MOCK_THREADS) {
      await setDoc(doc(db, "messageThreads", thread.id), thread);
    }

    // Batch seed secure messages
    activePath = "secureMessages";
    for (const msg of MOCK_SECURE_MESSAGES) {
      await setDoc(doc(db, "secureMessages", msg.id), msg);
    }

    // Batch seed ACC requests
    activePath = "accRequests";
    for (const req of MOCK_ACC_REQUESTS) {
      await setDoc(doc(db, "accRequests", req.id), req);
    }

    // Batch seed maintenance work orders
    activePath = "workOrders";
    for (const wo of MOCK_WORK_ORDERS) {
      await setDoc(doc(db, "workOrders", wo.id), wo);
    }

    // Batch seed amenity bookings
    activePath = "amenityBookings";
    for (const booking of MOCK_AMENITY_BOOKINGS) {
      await setDoc(doc(db, "amenityBookings", booking.id), booking);
    }

    console.log("Database successfully pre-seeded with rich HOA assets.");
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, activePath);
  }
}
