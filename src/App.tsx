import { useState, useEffect } from "react";
import { UserProfile } from "./types";
import { seedDatabaseIfEmpty } from "./lib/seeder";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { syncAndLinkUserProfile } from "./lib/authSync";
import UserMenu from "./components/UserMenu";
import AuthModal from "./components/AuthModal";
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
  Shield,
  Menu,
  X,
  Wrench,
  CalendarDays,
  ShieldCheck,
  Lock,
  Users
} from "lucide-react";

export default function App() {
  const [activeUser, setActiveUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
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

    // Real Firebase Auth listener with automatic seeded data linking
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await syncAndLinkUserProfile(firebaseUser);
          setActiveUser(profile);
          setShowAuthModal(false);
        } catch (e) {
          console.error("Failed to sync authenticated user profile:", e);
        }
      } else {
        // Fallback for seamless demo if not yet logged in
        setActiveUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out error:", err);
    }
    setActiveUser(null);
    setShowAuthModal(true);
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "dues", label: "Dues & Assessments", icon: DollarSign },
    { id: "violations", label: "Violations & Disputes", icon: ShieldAlert },
    { id: "requests", label: "Permits & Repairs", icon: Wrench },
    { id: "bookings", label: "Amenity Bookings", icon: CalendarDays },
    { id: "forum", label: "Community Forum", icon: MessageSquare },
    { id: "documents", label: "Bylaws & Vault", icon: FileText },
    { id: "security", label: "AI Safety Analyst", icon: ShieldCheck },
    { id: "messages", label: "Confidential Messages", icon: Lock },
    { id: "directory", label: "Board & Committees", icon: Users },
  ];

  // Auth loading screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white" id="auth-loading-screen">
        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/30 mb-4 animate-pulse">
          <Shield className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl font-black uppercase tracking-widest text-white">BoardVault</h2>
        <p className="text-xs text-slate-400 font-semibold tracking-wider mt-1 uppercase">Connecting to Secure Ledger...</p>
        <div className="w-48 h-1 bg-slate-800 rounded-full mt-6 overflow-hidden">
          <div className="w-1/2 h-full bg-blue-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  // If unauthenticated, show the AuthModal directly as the gateway
  if (!activeUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative" id="unauthenticated-gateway">
        <AuthModal onSuccess={(profile) => {
          setActiveUser(profile);
          setShowAuthModal(false);
        }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col md:flex-row relative" id="app-root-layout">
      {/* Optional Auth modal for switching accounts */}
      {showAuthModal && (
        <AuthModal 
          onSuccess={(profile) => {
            setActiveUser(profile);
            setShowAuthModal(false);
          }} 
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* Sidebar for desktop, top bar for mobile */}
      <aside className="w-full md:w-64 bg-slate-900 flex flex-col shrink-0 border-r border-slate-800 z-30" id="app-sidebar">
        {/* Sidebar Header / Logo */}
        <div className="p-5 border-b border-slate-950 flex justify-between items-center bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest text-white leading-tight">BoardVault</h1>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">HOA Management</span>
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

        {/* Database state indicator and compliance link at sidebar footer */}
        <div className="p-4 border-t border-slate-950/50 bg-slate-950/30 text-center space-y-1.5">
          <div className="text-[10px] font-semibold text-slate-500 flex items-center justify-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${dbSeeded ? "bg-green-500 animate-pulse" : "bg-amber-500 animate-pulse"}`}></span>
            {dbSeeded ? "DURABLE FIRESTORE ONLINE" : "CONNECTING TO LEDGER..."}
          </div>
          <div className="flex justify-center items-center gap-2 text-[10px] text-slate-500 font-medium">
            <span>BoardVault v1.0.4</span>
            <span>•</span>
            <a 
              href="/privacy.html" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-slate-400 hover:text-white underline transition-colors"
            >
              Privacy Policy
            </a>
            <span>•</span>
            <a 
              href="mailto:boardvault@cogcoretech.com" 
              className="text-slate-400 hover:text-white underline transition-colors"
            >
              Support
            </a>
          </div>
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

          {/* Profile Real User Menu */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <UserMenu
              activeUser={activeUser}
              onOpenAuth={() => setShowAuthModal(true)}
              onSignOut={handleSignOut}
            />
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
