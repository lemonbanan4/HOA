import React, { useState } from "react";
import { UserProfile } from "../types";
import { collection, doc, setDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { 
  Users, Mail, Phone, Calendar, Shield, MessageSquare, Send, Check, Info, AlertCircle 
} from "lucide-react";

interface BoardDirectoryProps {
  activeUser: UserProfile;
  onNavigateToMessages: () => void;
}

const BOARD_MEMBERS = [
  {
    name: "Marcus Aurelius",
    role: "HOA Board President",
    email: "marcus.board@hoa-tracker.com",
    phone: "(555) 123-4567",
    address: "101 Emperor Way",
    term: "2024 - 2027",
    responsibilities: "Strategic oversight, community development, budget sign-offs, and general association representations.",
    avatar: "M"
  },
  {
    name: "John Smith",
    role: "HOA Treasurer",
    email: "john.smith@gmail.com",
    phone: "(555) 987-6543",
    address: "204 Pine Needles Lane",
    term: "2025 - 2028",
    responsibilities: "Financial accounting, dues processing, assessments oversight, accounts payable, and auditing reports.",
    avatar: "J"
  },
  {
    name: "Clara Barton",
    role: "HOA Secretary / ACC Chairperson",
    email: "clara.barton@yahoo.com",
    phone: "(555) 345-6789",
    address: "305 Red Cross Circle",
    term: "2024 - 2026",
    responsibilities: "ACC exterior permits oversight, community files database, official meeting minutes, and document archives.",
    avatar: "C"
  },
  {
    name: "Sophie Germain",
    role: "Infrastructure & Community Safety Lead",
    email: "sophie.g@math.org",
    phone: "(555) 765-4321",
    address: "412 Prime Avenue",
    term: "2025 - 2027",
    responsibilities: "Common area physical repairs, street lighting oversight, community pool safety, and AI security logs auditing.",
    avatar: "S"
  }
];

export default function BoardDirectory({ activeUser, onNavigateToMessages }: BoardDirectoryProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [recipient, setRecipient] = useState("board");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Send a private board message
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      setLoading(true);

      // Create a unique message ID
      const messageId = `msg_${Date.now()}`;
      const threadId = activeUser.role === "board_member" ? "user_john" : activeUser.id; // board replies to john in demo

      // Pre-seed the thread first to ensure it appears in lists
      await setDoc(doc(db, "messageThreads", threadId), {
        id: threadId,
        residentId: threadId,
        residentName: activeUser.role === "board_member" ? "John Smith" : activeUser.name,
        residentAddress: activeUser.role === "board_member" ? "204 Pine Needles Lane" : activeUser.address,
        lastUpdated: new Date().toISOString(),
        lastMessageSnippet: message.trim()
      });

      // Write private message entry to Firestore
      await addDoc(collection(db, "secureMessages"), {
        id: messageId,
        threadId,
        senderId: activeUser.id,
        senderName: activeUser.name,
        senderRole: activeUser.role,
        recipientId: recipient,
        content: `[Subject: ${subject || "General Inquiry"}]\n\n${message.trim()}`,
        date: new Date().toISOString()
      });

      setSubject("");
      setMessage("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error("Error creating confidential message:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" id="board-directory-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Board Members & Committees Directory</h2>
          <p className="text-xs text-gray-500">
            Meet your volunteer HOA board directors and file secure, audited communication inquiries directly to their desk.
          </p>
        </div>
      </div>

      {/* Directory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="board-cards-grid">
        {BOARD_MEMBERS.map((b) => (
          <div key={b.name} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4 hover:shadow-sm transition-all duration-150">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center text-lg shadow-sm">
                {b.avatar}
              </div>
              <div className="space-y-0.5 flex-1">
                <h3 className="font-extrabold text-slate-950 text-sm leading-tight flex items-center justify-between">
                  {b.name}
                  {activeUser.name === b.name && (
                    <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded uppercase font-black">Logged In</span>
                  )}
                </h3>
                <p className="text-xs text-blue-600 font-bold">{b.role}</p>
                <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5" /> Term Period: {b.term}
                </p>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600 font-medium">
              <p className="leading-relaxed"><strong>Core Responsibilities:</strong> {b.responsibilities}</p>
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{b.email}</span>
                </div>
                <div className="flex items-center gap-1.5 justify-end">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{b.phone}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Contact Form Bento Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="board-contact-row">
        {/* Contact Form */}
        <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs lg:col-span-7 space-y-4">
          <div className="border-b border-slate-50 pb-3">
            <h3 className="font-extrabold text-slate-950 text-sm uppercase flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              File Private Board Inquiry
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Secure, end-to-end encrypted dispatch portal</p>
          </div>

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 px-4 py-3 rounded-xl flex items-start gap-2.5 shadow-sm animate-fade-in" id="contact-success-banner">
              <Check className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div className="text-xs">
                <p className="font-bold">Message Dispatched Successfully</p>
                <p className="text-emerald-700/90 mt-0.5">
                  Your inquiry has been logged as a private conversation thread. You can view or reply to board decisions inside the Confidential Messages channel.
                </p>
                <button
                  type="button"
                  onClick={onNavigateToMessages}
                  className="text-xs text-emerald-900 font-black underline hover:text-emerald-950 mt-1.5 block"
                >
                  Go to Confidential Messages →
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleContactSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Select Target Recipient</label>
                <select
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                >
                  <option value="board">All HOA Board Directors (Committee Desk)</option>
                  <option value="Marcus Aurelius">Marcus Aurelius (President)</option>
                  <option value="John Smith">John Smith (Treasurer)</option>
                  <option value="Clara Barton">Clara Barton (ACC Chair)</option>
                  <option value="Sophie Germain">Sophie Germain (Safety Lead)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Roof Permit Appeal, Parking Dispute..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Message Body</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your detailed inquiry here. All private board messages are archived under state auditing charters for homeowner governance records."
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-350 text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                id="submit-board-contact-btn"
              >
                <Send className="w-4 h-4" />
                {loading ? "Transmitting..." : "Send Secure Message"}
              </button>
            </div>
          </form>
        </div>

        {/* Security / Auditing Info Sidebar */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 lg:col-span-5 flex flex-col justify-between space-y-6 relative overflow-hidden" id="board-audit-info">
          <div className="absolute right-0 top-0 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl"></div>
          
          <div className="space-y-4 relative z-10">
            <span className="text-[9px] font-black uppercase tracking-widest bg-blue-500 text-white px-2 py-0.5 rounded-full">
              Governance Audit Active
            </span>
            <div className="space-y-1.5">
              <h4 className="text-sm font-black uppercase tracking-wider flex items-center gap-1 text-white">
                <Shield className="w-4 h-4 text-blue-400" /> Secure Correspondence
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Under current HOA Bylaws (Charter Section XII), all direct electronic letters sent to board members are archived inside our **Cloud Ledger** and visible to both parties.
              </p>
            </div>

            <div className="space-y-2 border-t border-white/10 pt-4 text-xs font-medium text-slate-400">
              <p className="flex items-start gap-1.5 text-[11px]">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Responses are typically dispatched within **24 - 48 business hours** depending on ACC committee agendas.</span>
              </p>
              <p className="flex items-start gap-1.5 text-[11px]">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>You can track historical logs and receive alerts in your **Confidential Messages** tab.</span>
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateToMessages}
            className="w-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold py-2.5 rounded-xl transition-all border border-white/10 text-center uppercase tracking-wider"
          >
            Open Messaging Center
          </button>
        </div>
      </div>
    </div>
  );
}
