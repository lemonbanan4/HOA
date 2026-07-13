import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, Sparkles } from "lucide-react";
import { getApiUrl } from "../lib/api";

interface Message {
  role: "user" | "bot";
  content: string;
  time: string;
}

const CONCIERGE_SUGGESTIONS = [
  "When are trash bins collected?",
  "What are quiet hours?",
  "How do I submit an ACC paint request?",
  "Tell me about pet leash rules.",
];

export default function SupportChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content: "Hello! I am your 24/7 HOA Support Concierge. You can ask me any questions about our community bylaws, trash schedules, architectural control committee (ACC) guidelines, pet rules, or dues deadlines. How can I help you streamline your community tasks today?",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      role: "user",
      content: textToSend.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Create a mapped array for the server context
      const chatContext = [...messages, userMsg].map((m) => ({
        role: m.role === "user" ? "user" : "model",
        content: m.content,
      }));

      const response = await fetch(getApiUrl("/api/chatbot"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatContext }),
      });

      if (!response.ok) {
        throw new Error("Could not fetch automated chat reply.");
      }

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: data.reply || "I am available to assist you. Could you rephrase your question?",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err) {
      console.error("Chatbot communication error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: "I apologize, but I am experiencing temporary connectivity issues accessing the bylaws database. Please check your network or try asking again in a moment.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end" id="hoa-chatbot-container">
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all duration-150 relative"
        id="chatbot-toggle-btn"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageSquare className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full"></span>
          </>
        )}
      </button>

      {/* Chat window panel */}
      {isOpen && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-[360px] h-[500px] flex flex-col overflow-hidden mt-3 animate-fade-in relative" id="chatbot-window">
          {/* Header */}
          <div className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between border-b border-slate-950">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  HOA Concierge
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                </h4>
                <p className="text-[10px] text-slate-400">24/7 Automated Support Bot</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white text-lg">×</button>
          </div>

          {/* Message log */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "bot" && (
                  <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                )}
                <div className="space-y-0.5 max-w-[75%]">
                  <div
                    className={`p-3 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-white text-slate-850 border border-gray-150 rounded-tl-none"
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
                <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center animate-spin">
                  ↻
                </div>
                <div className="bg-white border border-gray-150 px-3 py-2 rounded-2xl text-[11px] text-gray-500 font-semibold italic">
                  HOA Concierge is searching bylaws...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested prompts list (if no user text yet) */}
          {messages.length === 1 && !loading && (
            <div className="px-4 py-2 bg-slate-50 border-t border-gray-100 space-y-1.5" id="suggested-prompts">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Common Inquiries:</p>
              <div className="flex flex-wrap gap-1.5">
                {CONCIERGE_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSendMessage(s)}
                    className="text-[10px] bg-white border border-gray-200 text-slate-700 font-semibold px-2.5 py-1 rounded-full hover:border-blue-500 hover:text-blue-600 transition-colors duration-150 text-left"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat input box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }}
            className="p-3 border-t border-gray-100 flex gap-2 bg-white"
            id="chat-send-form"
          >
            <input
              type="text"
              required
              disabled={loading}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about bylaws, quiet hours, pets..."
              className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-blue-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-350 text-white font-semibold rounded-xl px-3 flex items-center justify-center transition-colors shadow-xs"
              id="chatbot-submit-btn"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
