export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "resident" | "board_member";
  address: string;
  phone: string;
  joinedDate: string;
  status: "active" | "pending" | "suspended";
  balance: number;
}

export interface Due {
  id: string;
  residentId: string;
  residentName: string;
  residentAddress: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: "unpaid" | "paid" | "overdue";
  description: string;
}

export interface Violation {
  id: string;
  residentId: string;
  residentName: string;
  residentAddress: string;
  title: string;
  description: string;
  reportedDate: string;
  status: "reported" | "under_review" | "fine_issued" | "resolved";
  fineAmount: number;
  evidenceUrl?: string;
  notes?: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  description: string;
  category: "bylaws" | "financials" | "meeting_minutes" | "guidelines";
  fileUrl?: string;
  uploadDate: string;
  version: string;
}

export interface Comment {
  id: string;
  authorName: string;
  authorRole: "resident" | "board_member";
  content: string;
  date: string;
}

export interface CommunicationItem {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: "resident" | "board_member";
  title: string;
  content: string;
  type: "announcement" | "discussion";
  date: string;
  likes: number;
  comments: Comment[];
}

export interface BehavioralLogItem {
  id: string;
  submittedBy: string;
  description: string;
  date: string;
  analysis?: {
    threatLevel: "low" | "medium" | "high";
    summary: string;
    behavioralAnalysis: string;
    securityRecommendations: string;
    socialFabricImpact: string;
  };
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  date: string;
  read: boolean;
  type: "info" | "warning" | "success";
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
}

export interface Budget {
  id: string;
  category: string;
  allocated: number;
  period: string;
}

export interface SecureMessage {
  id: string;
  threadId: string; // equals residentId
  senderId: string;
  senderName: string;
  senderRole: "resident" | "board_member";
  recipientId: string; // "board" or residentId
  content: string;
  date: string;
}

export interface MessageThread {
  id: string; // residentId
  residentId: string;
  residentName: string;
  residentAddress: string;
  lastUpdated: string;
  lastMessageSnippet: string;
}

export interface ACCRequest {
  id: string;
  residentId: string;
  residentName: string;
  residentAddress: string;
  projectType: "painting" | "roofing" | "landscaping" | "deck_patio" | "fence" | "other";
  description: string;
  materialsDetails: string;
  submittedDate: string;
  status: "pending" | "approved" | "rejected";
  boardNotes?: string;
  decisionDate?: string;
}

export interface WorkOrder {
  id: string;
  reportedBy: string;
  reporterName: string;
  title: string;
  location: string;
  description: string;
  category: "lighting" | "pool" | "landscaping" | "roads_sidewalks" | "clubhouse" | "other";
  submittedDate: string;
  status: "submitted" | "in_progress" | "completed";
  assignedVendor?: string;
  completionDate?: string;
}

export interface AmenityBooking {
  id: string;
  residentId: string;
  residentName: string;
  amenityName: "Clubhouse" | "Community Pavilion" | "Pool Lounge" | "Tennis Court";
  bookingDate: string;
  timeSlot: string;
  status: "confirmed" | "cancelled";
  notes?: string;
}


