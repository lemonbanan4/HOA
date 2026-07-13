import React, { useState, useEffect, useRef } from "react";
import { UserProfile, SecureMessage, MessageThread } from "../types";
import { collection, onSnapshot, query, where, orderBy, addDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { Send, Mail, Shield, User, Clock, ArrowLeft, Check, Lock } from "lucide-react";

interface SecureBoardMessagesProps {
  activeUser: UserProfile;
}

export default function SecureBoardMessages({ activeUser }: SecureBoardMessagesProps) {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SecureMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeThreadName, setActiveThreadName] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load message threads (Board members see all, residents only see their own thread)
  useEffect(() => {
    let q;
    if (activeUser.role === "board_member") {
      q = query(collection(db, "messageThreads"), orderBy("lastUpdated", "desc"));
    } else {
      q = query(collection(db, "messageThreads"), where("residentId", "==", activeUser.id));
    }

    const unsub = onSnapshot(q, (snap) => {
      const data: MessageThread[] = [];
      snap.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as MessageThread);
      });
      setThreads(data);

      // If resident, auto-select their own thread
      if (activeUser.role === "resident") {
        setActiveThreadId(activeUser.id);
        setActiveThreadName("HOA Board of Directors");
      }
    });

    return unsub;
  }, [activeUser]);

  // Load messages for the active thread
  useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, "secureMessages"),
      where("threadId", "==", activeThreadId),
      orderBy("date", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data: SecureMessage[] = [];
      snap.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as SecureMessage);
      });
      setMessages(data);
    });

    return unsub;
  }, [activeThreadId]);

  // Handle send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeThreadId) return;

    try {
      setLoading(true);
      const text = newMessageText.trim();
      setNewMessageText("");

      const msgId = `msg_${Date.now()}`;
      const timestamp = new Date().toISOString();

      const messageData: SecureMessage = {
        id: msgId,
        threadId: activeThreadId,
        senderId: activeUser.id,
        senderName: activeUser.name,
        senderRole: activeUser.role,
        recipientId: activeUser.role === "board_member" ? activeThreadId : "board",
        content: text,
        date: timestamp
      };

      // Add message to Firestore
      await addDoc(collection(db, "secureMessages"), messageData);

      // Update or Create Thread
      const threadRef = doc(db, "messageThreads", activeThreadId);
      
      const threadData: MessageThread = {
        id: activeThreadId,
        residentId: activeThreadId,
        residentName: activeUser.role === "board_member" ? activeThreadName : activeUser.name,
        residentAddress: activeUser.role === "board_member" ? "" : activeUser.address, // simple placeholder
        lastUpdated: timestamp,
        lastMessageSnippet: text.length > 60 ? text.substring(0, 60) + "..." : text
      };

      await setDoc(threadRef, threadData, { merge: true });

      setLoading(false);
    } catch (err) {
      console.error("Error sending secure message:", err);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-150 rounded-2xl shadow-xs overflow-hidden h-[600px] flex flex-col md:flex-row" id="secure-messages-container">
      {/* Sidebar for Board Members: list of threads */}
      {activeUser.role === "board_member" && (
        <div className={`w-full md:w-80 border-r border-gray-150 flex flex-col ${activeThreadId ? "hidden md:flex" : "flex"}`} id="board-threads-sidebar">
          <div className="p-4 border-b border-gray-100 bg-slate-50 flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Resident Threads</h3>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {threads.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 font-medium">
                No secure messages received.
              </div>
            ) : (
              threads.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveThreadId(t.id);
                    setActiveThreadName(t.residentName);
                  }}
                  className={`w-full p-4 text-left flex flex-col gap-1 hover:bg-slate-50 transition-colors ${
                    activeThreadId === t.id ? "bg-blue-50/50 border-l-4 border-blue-600" : ""
                  }`}
                  id={`thread-item-${t.id}`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs text-slate-900 uppercase">{t.residentName}</span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {new Date(t.lastUpdated).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold leading-none">{t.residentAddress}</span>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-1 font-medium">{t.lastMessageSnippet}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main chat viewport */}
      <div className={`flex-1 flex flex-col h-full bg-slate-50 ${activeUser.role === "board_member" && !activeThreadId ? "hidden md:flex justify-center items-center p-8 text-slate-400" : "flex"}`} id="secure-chat-viewport">
        {activeUser.role === "board_member" && !activeThreadId ? (
          <div className="text-center space-y-2 max-w-sm">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Mail className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-700 uppercase">Select Resident Thread</h4>
            <p className="text-xs text-gray-500">
              Board members can communicate with residents privately and securely regarding accounts, fines, or rules.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-150 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                {activeUser.role === "board_member" && (
                  <button
                    onClick={() => setActiveThreadId(null)}
                    className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
                    id="messages-back-btn"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900 uppercase">
                      {activeUser.role === "board_member" ? activeThreadName : "Confidential Board Liaison"}
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" /> SECURE SSL
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5 font-medium">
                    {activeUser.role === "board_member" 
                      ? "Direct encrypted communications with registered property owner"
                      : "Direct messaging to Board of Directors (Confidential & Encrypted)"}
                  </p>
                </div>
              </div>
            </div>

            {/* Chat History Canvas */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" id="chat-messages-history">
              {messages.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">
                    ✉
                  </div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase">Secure Message Vault Empty</h4>
                  <p className="text-[11px] text-gray-500 mt-1 max-w-xs mx-auto">
                    Type a message below to establish secure communications. Only you and the HOA board can access these logs.
                  </p>
                </div>
              ) : (
                messages.map((m) => {
                  const isOwnMessage = m.senderId === activeUser.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex gap-3 max-w-[80%] ${isOwnMessage ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                    >
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                        isOwnMessage 
                          ? "bg-blue-600 text-white" 
                          : "bg-slate-200 text-slate-700"
                      }`}>
                        {m.senderRole === "board_member" ? (
                          <Shield className="w-3.5 h-3.5" />
                        ) : (
                          <User className="w-3.5 h-3.5" />
                        )}
                      </div>

                      {/* Msg bubble */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400 px-1">
                          <span>{m.senderName}</span>
                          <span className="text-[8px] uppercase tracking-wider">
                            {new Date(m.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap shadow-xs ${
                          isOwnMessage 
                            ? "bg-blue-600 text-white rounded-tr-none" 
                            : "bg-white text-slate-850 border border-gray-150 rounded-tl-none"
                        }`}>
                          {m.content}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message composer input */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-150 flex gap-2 shrink-0">
              <input
                type="text"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                placeholder={activeUser.role === "board_member" ? "Write a private reply..." : "Write a confidential inquiry to the board..."}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-blue-500"
              />
              <button
                type="submit"
                disabled={loading || !newMessageText.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs px-4 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                id="submit-secure-message-btn"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
