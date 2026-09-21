import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, Sparkles } from "lucide-react";
import { getApiUrl } from "../lib/api";

interface Message {
  role: "user" | "bot";
  content: string;
  time: string;
}

const CONCIERGE_SUGGESTIONS = [
  "🗑️ Trash Schedule",
  "🤫 Quiet Hours",
  "🎨 ACC Paint Request",
  "🐕 Pet Leash Rules",
  "💳 Pay HOA Dues",
  "🏊 Amenity Bookings",
];

// Grounded local knowledge engine covering all official HOA community guidelines
export function getLocalBylawReply(query: string): string {
  const q = query.toLowerCase();

  if (q.includes("trash") || q.includes("recycle") || q.includes("garbage") || q.includes("bin") || q.includes("curb")) {
    return "🗑️ **Trash & Recycling Collection Schedule**:\n• **Collection Day**: Every **Tuesday morning**.\n• **Curb Placement**: Trash and recycling bins may be placed on the curb after **6:00 PM on Monday**.\n• **Bin Storage**: All bins must be returned and stored out of public street view by **Tuesday at 8:00 PM**.\n• **Bulk Waste**: Requires 48-hour advance notice to HOA management.";
  }

  if (q.includes("quiet") || q.includes("noise") || q.includes("party") || q.includes("hours") || q.includes("music") || q.includes("sound")) {
    return "🤫 **Community Quiet Hours**:\n• **Daily Quiet Hours**: Strictly observed from **10:00 PM to 7:00 AM daily**.\n• Outdoor stereo audio, loud pool activity, and power equipment are prohibited during these hours.\n• Please be respectful of neighbors. Noise complaints can be submitted via the **'Violations & Disputes'** tab or reported to overnight community security.";
  }

  if (q.includes("acc") || q.includes("paint") || q.includes("roof") || q.includes("fence") || q.includes("architectural") || q.includes("remodel") || q.includes("exterior") || q.includes("permit")) {
    return "🎨 **Architectural Control Committee (ACC) Rules**:\n• **Prior Approval Mandatory**: All exterior changes (house painting, fence replacement, roof work, solar panels, and tree removal) require an approved ACC application **before** starting work.\n• **How to Apply**: Submit your application with color samples or contractor specs under the **'Permits & Repairs'** tab.\n• **Review Timeline**: ACC committee reviews applications within **7 to 14 business days**.";
  }

  if (q.includes("pet") || q.includes("dog") || q.includes("cat") || q.includes("leash") || q.includes("bark") || q.includes("waste")) {
    return "🐕 **Pet & Animal Regulations**:\n• **Leash Law**: All dogs must be kept on a handheld leash under **6 feet** whenever in common greenways, walkways, or parks.\n• **Waste Clean-Up**: Owners must immediately clean up and bag all pet waste. Waste disposal stations are stocked along all walking paths.\n• **Fines**: Unaccompanied pets or failure to clean waste results in a **$50 courtesy fine**, escalating to $100 for repeat offenses.";
  }

  if (q.includes("due") || q.includes("assessment") || q.includes("fee") || q.includes("pay") || q.includes("balance") || q.includes("late") || q.includes("cost")) {
    return "💳 **HOA Dues & Assessments**:\n• **Amount**: Quarterly dues are **$250.00**, billed on the 1st of January, April, July, and October.\n• **Grace Period**: Due within 15 days; a **$25 late fee** is assessed after 15 calendar days.\n• **How to Pay**: You can pay electronically via **Stripe ACH direct debit ($1.95 fee)** or **Credit Card** in the **'Dues & Assessments'** tab, and generate an official printable PDF receipt instantly.";
  }

  if (q.includes("clubhouse") || q.includes("pool") || q.includes("tennis") || q.includes("court") || q.includes("cabana") || q.includes("amenity") || q.includes("reserve") || q.includes("book")) {
    return "🏊 **Amenity Reservations & Hours**:\n• **Community Pool**: Open 6:00 AM – 10:00 PM daily (electronic key fob required).\n• **Clubhouse**: Available for private resident parties and meetings under the **'Amenity Bookings'** tab ($100 refundable cleaning deposit).\n• **Tennis & Pickleball Courts**: Open 7:00 AM – 9:00 PM (1-hour slots available via in-app reservation).";
  }

  if (q.includes("park") || q.includes("parking") || q.includes("street") || q.includes("vehicle") || q.includes("towing") || q.includes("rv") || q.includes("trailer")) {
    return "🚗 **Parking & Vehicle Policies**:\n• **Street Parking**: Prohibited between **2:00 AM and 6:00 AM** without a temporary overnight guest permit.\n• **RVs, Boats & Trailers**: May not be parked in open driveways or on streets for longer than **48 consecutive hours** for loading/unloading.\n• **Fire Lanes**: Designated red curb fire lanes are subject to immediate towing at the owner's expense.";
  }

  if (q.includes("meeting") || q.includes("board") || q.includes("vote") || q.includes("minutes") || q.includes("election")) {
    return "🏛️ **Board Meetings & Community Governance**:\n• **Schedule**: Monthly board meetings take place on the **second Wednesday of every month at 7:00 PM** in the clubhouse and stream live.\n• **Resident Participation**: Homeowners are encouraged to attend the open resident forum at the start of each meeting.\n• **Minutes & Agendas**: Published 7 days prior in the **'Bylaws & Vault'** tab.";
  }

  if (q.includes("violation") || q.includes("dispute") || q.includes("fine") || q.includes("warning")) {
    return "⚠️ **Violation Resolution & Disputes**:\n• **10-Day Cure Period**: The board issues a courtesy warning notice providing 10 calendar days to correct minor infractions before fines are levied.\n• **Dispute Rights**: Homeowners can inspect violation photo evidence and file an official dispute statement with documentation in the **'Violations & Disputes'** tab.";
  }

  if (q.includes("contact") || q.includes("phone") || q.includes("email") || q.includes("help") || q.includes("support")) {
    return "📞 **HOA Management & Support Contacts**:\n• **Support Email**: boardvault@cogcoretech.com\n• **Governance Team**: Board & Committee contacts are available in the **'Board & Committees'** tab.\n• **Urgent Maintenance**: Submit an emergency ticket under the **'Permits & Repairs'** tab.";
  }

  return "👋 Hello! I am your 24/7 automated HOA Support Concierge. You can ask me any question about our community bylaws, including **trash collection schedules**, **quiet hours**, **pet leash rules**, **ACC paint requests**, **amenity reservations**, or **HOA dues deadlines**. How can I help you today?";
}

export default function SupportChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content: "Hello! I am your 24/7 HOA Support Concierge. You can ask me any questions about our community bylaws, trash schedules, quiet hours, pet rules, architectural guidelines (ACC), or quarterly dues deadlines. How can I help you today?",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const query = textToSend.trim();
    const userMsg: Message = {
      role: "user",
      content: query,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    let replyText = "";

    try {
      // Race remote backend with a 2500ms abort controller to guarantee sub-second mobile responsiveness
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const chatContext = [...messages, userMsg].map((m) => ({
        role: m.role === "user" ? "user" : "model",
        content: m.content,
      }));

      const response = await fetch(getApiUrl("/api/chatbot"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatContext }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.reply && !data.error) {
          replyText = data.reply;
        }
      }
    } catch {
      // Network timeout or offline — fall back smoothly
    }

    // High-fidelity instant local bylaws engine fallback if backend was unavailable
    if (!replyText) {
      replyText = getLocalBylawReply(query);
    }

    setMessages((prev) => [
      ...prev,
      {
        role: "bot",
        content: replyText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setLoading(false);
  };

  return (
    <>
      {/* Floating Action Toggle Button */}
      <div className="fixed bottom-6 right-6 z-40" id="hoa-chatbot-container">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close HOA Support Concierge" : "Open 24/7 HOA Support Concierge"}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-full flex items-center justify-center shadow-2xl transition-all duration-150 relative focus:outline-none focus:ring-4 focus:ring-blue-300"
          id="chatbot-toggle-btn"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <>
              <MessageSquare className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full animate-ping"></span>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
            </>
          )}
        </button>
      </div>

      {/* Responsive Chat Window */}
      {isOpen && (
        <div
          className="fixed z-50 inset-x-3 bottom-3 top-16 sm:top-auto sm:inset-x-auto sm:bottom-22 sm:right-6 sm:w-[380px] sm:h-[540px] max-h-[calc(100vh-80px)] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200"
          id="chatbot-window"
        >
          {/* Header */}
          <div className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between border-b border-slate-950 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-white">
                  HOA Concierge
                  <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">24/7 Automated Bylaws Concierge</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close Chatbot"
              className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 active:scale-95 transition-all text-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "bot" && (
                  <div className="w-7 h-7 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                  </div>
                )}
                <div className="space-y-1 max-w-[82%]">
                  <div
                    className={`p-3.5 rounded-2xl leading-relaxed whitespace-pre-line text-xs ${
                      m.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-none shadow-sm"
                        : "bg-white text-slate-900 border border-slate-200 rounded-tl-none shadow-xs"
                    }`}
                  >
                    {m.content}
                  </div>
                  <span className="text-[9px] text-slate-400 px-1 block text-right font-medium">{m.time}</span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 justify-start items-center">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center animate-spin text-blue-600 text-xs font-bold">
                  ↻
                </div>
                <div className="bg-white border border-slate-200 px-3.5 py-2.5 rounded-2xl text-[11px] text-slate-600 font-medium italic shadow-xs">
                  HOA Concierge is checking bylaws...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Common Inquiries Pills */}
          <div className="px-3.5 py-2.5 bg-slate-100/90 border-t border-slate-200 shrink-0 space-y-1.5" id="suggested-prompts">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Quick Inquiry Prompts:</p>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {CONCIERGE_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSendMessage(s.replace(/^[^\w]+/, ""))}
                  className="text-[10px] bg-white border border-slate-300 text-slate-800 font-semibold px-2.5 py-1.5 rounded-xl hover:border-blue-500 hover:text-blue-600 active:scale-95 active:bg-blue-50 transition-all text-left shadow-2xs"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }}
            className="p-3 border-t border-slate-200 flex items-center gap-2 bg-white shrink-0"
            id="chat-send-form"
          >
            <input
              type="text"
              required
              disabled={loading}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about trash, quiet hours, pets, dues..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send Inquiry"
              className="min-w-[42px] min-h-[42px] bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 active:scale-95 text-white font-bold rounded-xl flex items-center justify-center transition-all shadow-md shadow-blue-500/20"
              id="chatbot-submit-btn"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
