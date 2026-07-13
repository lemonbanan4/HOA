import { useState, useEffect } from "react";
import { UserProfile } from "./types";
import { MOCK_USERS, seedDatabaseIfEmpty } from "./lib/seeder";
import UserProfileSelector from "./components/UserProfileSelector";
import Dashboard from "./components/Dashboard";
import DuesManager from "./components/DuesManager";
import ViolationsLog from "./components/ViolationsLog";
import CommunityForum from "./components/CommunityForum";
import DocumentLibrary from "./components/DocumentLibrary";
import SecurityAnalysis from "./components/SecurityAnalysis";
import SupportChatbot from "./components/SupportChatbot";
import SecureBoardMessages from "./components/SecureBoardMessages";
import RequestsManager from "./components/RequestsManager";
import AmenityBookingManager from "./components/AmenityBookingManager";
import BoardDirectory from "./components/BoardDirectory";

import {
  LayoutDashboard,
  DollarSign,
  ShieldAlert,
  MessageSquare,
  FileText,
  Sparkles,
  Shield,
  Menu,
  X,
  Mail,
  Wrench,
  CalendarCheck,
  Users
} from "lucide-react";

export default function App() {
  const [activeUser, setActiveUser] = useState<UserProfile>(MOCK_USERS[0]);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [dbSeeded, setDbSeeded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Seed Firestore Database with rich sample data on application load
  useEffect(() => {
    async function initDb() {
      await seedDatabaseIfEmpty();
      setDbSeeded(true);
    }
    initDb();
  }, []);

  // Sync state if user switcher updates activeUser
  const handleUserChange = (newUser: UserProfile) => {
    setActiveUser(newUser);
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "dues", label: "Dues & Assessments", icon: DollarSign },
    { id: "violations", label: "Violations & Disputes", icon: ShieldAlert },
    { id: "requests", label: "Permits & Repairs", icon: Wrench },
    { id: "bookings", label: "Amenity Bookings", icon: CalendarCheck },
    { id: "forum", label: "Community Forum", icon: MessageSquare },
    { id: "documents", label: "Bylaws & Vault", icon: FileText },
    { id: "security", label: "AI Safety Analyst", icon: Sparkles },
    { id: "messages", label: "Confidential Messages", icon: Mail },
    { id: "directory", label: "Board & Committees", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col md:flex-row relative" id="app-root-layout">
      {/* Sidebar for desktop, top bar for mobile */}
      <aside className="w-full md:w-64 bg-slate-900 flex flex-col shrink-0 border-r border-slate-800 z-30" id="app-sidebar">
        {/* Sidebar Header / Logo */}
        <div className="p-5 border-b border-slate-950 flex justify-between items-center bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest text-white leading-tight">HOA Elite</h1>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cloud Ledger</span>
            </div>
          </div>

          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-slate-300 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            id="mobile-menu-toggle-btn"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation lists (conditional show on mobile) */}
        <nav
          className={`flex-1 p-4 space-y-1.5 md:block ${mobileMenuOpen ? "block" : "hidden bg-slate-900"}`}
          id="sidebar-navigation"
        >
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors text-left ${
                  activeTab === item.id
                    ? "bg-blue-600 text-white shadow-md font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
                id={`nav-btn-${item.id}`}
              >
                <IconComponent className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Database state indicator at sidebar footer */}
        <div className="p-4 border-t border-slate-950/50 bg-slate-950/30 text-center text-[10px] font-semibold text-slate-500 flex items-center justify-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${dbSeeded ? "bg-green-500 animate-pulse" : "bg-amber-500 animate-pulse"}`}></span>
          {dbSeeded ? "DURABLE FIRESTORE ONLINE" : "CONNECTING TO LEDGER..."}
        </div>
      </aside>

      {/* Main viewport canvas */}
      <main className="flex-1 flex flex-col min-w-0" id="app-main-viewport">
        {/* Workspace Top Bar Header */}
        <header className="bg-white border-b border-gray-150 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 z-20 shadow-xs" id="app-top-header">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Governance Portal</span>
            <h2 className="text-base font-black text-slate-950 leading-tight uppercase mt-0.5">
              {menuItems.find((item) => item.id === activeTab)?.label || "HOA System"}
            </h2>
          </div>

          {/* Profile Multi-Tenant Selector */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <UserProfileSelector activeUser={activeUser} setActiveUser={handleUserChange} />
          </div>
        </header>

        {/* Inner Tab content pane */}
        <div className="p-6 max-w-7xl w-full mx-auto flex-1 pb-24" id="app-content-pane">
          {activeTab === "dashboard" && <Dashboard activeUser={activeUser} onNavigate={(tab) => setActiveTab(tab)} />}
          {activeTab === "dues" && <DuesManager activeUser={activeUser} />}
          {activeTab === "violations" && <ViolationsLog activeUser={activeUser} />}
          {activeTab === "requests" && <RequestsManager activeUser={activeUser} />}
          {activeTab === "bookings" && <AmenityBookingManager activeUser={activeUser} />}
          {activeTab === "forum" && <CommunityForum activeUser={activeUser} />}
          {activeTab === "documents" && <DocumentLibrary activeUser={activeUser} />}
          {activeTab === "security" && <SecurityAnalysis activeUser={activeUser} />}
          {activeTab === "messages" && <SecureBoardMessages activeUser={activeUser} />}
          {activeTab === "directory" && <BoardDirectory activeUser={activeUser} onNavigateToMessages={() => setActiveTab("messages")} />}
        </div>
      </main>

      {/* 24/7 Automated Customer Support Chatbot floating drawer */}
      <SupportChatbot />
    </div>
  );
}
