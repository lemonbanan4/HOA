import React, { useState, useEffect } from "react";
import { Due, UserProfile } from "../types";
import { collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { DollarSign, Send, Check, ShieldAlert, CreditCard, PlusCircle, User, Calendar, Receipt, BarChart2 } from "lucide-react";
import FinancialLedger from "./FinancialLedger";

interface DuesManagerProps {
  activeUser: UserProfile;
}

export default function DuesManager({ activeUser }: DuesManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<"dues" | "ledger">("dues");
  const [duesList, setDuesList] = useState<Due[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "unpaid" | "paid" | "overdue">("all");

  // Assessment Form State (Board Member only)
  const [showAddDue, setShowAddDue] = useState(false);
  const [targetResidentId, setTargetResidentId] = useState("user_john");
  const [dueAmount, setDueAmount] = useState(250);
  const [dueDate, setDueDate] = useState("2026-07-15");
  const [dueDesc, setDueDesc] = useState("Q3 2026 HOA Assessment Dues");

  // Payment Modal State (Resident only)
  const [payingDue, setPayingDue] = useState<Due | null>(null);
  const [cardNumber, setCardNumber] = useState("4111 2222 3333 4444");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCVC, setCardCVC] = useState("123");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  // Email Notification Banner State
  const [reminderSentTo, setReminderSentTo] = useState<string | null>(null);

  // Load real-time dues list
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "dues"), (snap) => {
      const data: Due[] = [];
      snap.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Due);
      });
      setDuesList(data);
    });
    return unsub;
  }, []);

  // Filter dues based on selector and active user's role (Residents only see their own!)
  const displayedDues = duesList.filter((d) => {
    const matchesUser = activeUser.role === "board_member" || d.residentId === activeUser.id;
    const matchesStatus = filterStatus === "all" || d.status === filterStatus;
    return matchesUser && matchesStatus;
  });

  // 1. Submit Automated Payment Reminder (Simulated)
  const sendAutomatedReminder = async (due: Due) => {
    setLoading(true);
    // Find the resident email
    const emails: Record<string, string> = {
      user_john: "john.smith@gmail.com",
      user_clara: "clara.barton@yahoo.com",
      user_sophie: "sophie.g@math.org",
      user_marcus: "marcus.board@hoa-tracker.com"
    };
    const residentEmail = emails[due.residentId] || "resident@hoa-tracker.com";

    // Simulate server action
    await new Promise((resolve) => setTimeout(resolve, 800));
    setReminderSentTo(`Email reminders queued and dispatched! Formal demand for $${due.amount} sent to ${residentEmail}`);
    setLoading(false);

    setTimeout(() => {
      setReminderSentTo(null);
    }, 5000);
  };

  // 2. Add New Dues/Fine Assessment (Board Member only)
  const handleAddDue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueAmount || !dueDesc) return;

    try {
      setLoading(true);
      const residentNames: Record<string, string> = {
        user_john: "John Smith",
        user_clara: "Clara Barton",
        user_sophie: "Sophie Germain",
        user_marcus: "Marcus Aurelius"
      };
      const residentAddresses: Record<string, string> = {
        user_john: "204 Pine Needles Lane",
        user_clara: "305 Red Cross Circle",
        user_sophie: "412 Prime Avenue",
        user_marcus: "101 Emperor Way"
      };

      const newDue = {
        residentId: targetResidentId,
        residentName: residentNames[targetResidentId] || "Resident",
        residentAddress: residentAddresses[targetResidentId] || "Community Block",
        amount: Number(dueAmount),
        dueDate,
        status: "unpaid",
        description: dueDesc,
      };

      await addDoc(collection(db, "dues"), newDue);

      // Also update the resident user profile balance in firestore
      const residentRef = doc(db, "users", targetResidentId);
      await updateDoc(residentRef, {
        balance: Number(dueAmount)
      });

      setShowAddDue(false);
      setLoading(false);
    } catch (err) {
      console.error("Error issuing dues assessment:", err);
      setLoading(false);
    }
  };

  // 3. Pay Dues (Resident click "Pay Dues" opens Credit Card Modal, updates Database in real-time)
  const executePayment = async () => {
    if (!payingDue) return;

    try {
      setLoading(true);
      // Simulate credit card processing delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Update Due Record
      const dueRef = doc(db, "dues", payingDue.id);
      await updateDoc(dueRef, {
        status: "paid",
        paidDate: new Date().toISOString()
      });

      // Update User balance
      const residentRef = doc(db, "users", activeUser.id);
      await updateDoc(residentRef, {
        balance: 0 // Assume clear balance for simulation simplicity
      });

      // Show receipt popup
      setReceiptUrl(`REC-${Math.floor(100000 + Math.random() * 900000)}`);
      setLoading(false);
    } catch (err) {
      console.error("Error paying dues:", err);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" id="dues-manager-view">
      {/* Sub tabs switcher */}
      <div className="flex border-b border-gray-150 gap-1 pb-px" id="dues-subtabs-nav">
        <button
          onClick={() => setActiveSubTab("dues")}
          className={`px-4 py-2.5 text-xs uppercase tracking-wider font-extrabold border-b-2 transition-all duration-150 flex items-center gap-2 ${
            activeSubTab === "dues"
              ? "border-blue-600 text-blue-600 font-black"
              : "border-transparent text-gray-400 hover:text-slate-700"
          }`}
          id="dues-subtab-btn"
        >
          <DollarSign className="w-3.5 h-3.5" />
          Resident Assessments Ledger
        </button>
        <button
          onClick={() => setActiveSubTab("ledger")}
          className={`px-4 py-2.5 text-xs uppercase tracking-wider font-extrabold border-b-2 transition-all duration-150 flex items-center gap-2 ${
            activeSubTab === "ledger"
              ? "border-blue-600 text-blue-600 font-black"
              : "border-transparent text-gray-400 hover:text-slate-700"
          }`}
          id="ledger-subtab-btn"
        >
          <BarChart2 className="w-3.5 h-3.5" />
          HOA Budget & Financial Reports
        </button>
      </div>

      {activeSubTab === "ledger" ? (
        <FinancialLedger activeUser={activeUser} />
      ) : (
        <>
          {/* Reminder Banner Success Alert */}
          {reminderSentTo && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 px-4 py-3.5 rounded-xl flex items-start gap-2.5 shadow-sm animate-fade-in" id="reminder-success-banner">
          <Check className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          <div className="text-xs">
            <p className="font-bold">Automated Reminder Dispatch Successful</p>
            <p className="text-emerald-700/90 mt-0.5">{reminderSentTo}</p>
          </div>
        </div>
      )}

      {/* Main Ledger Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">HOA Assessment & Dues Ledger</h2>
          <p className="text-xs text-gray-500">
            {activeUser.role === "board_member"
              ? "All active billing statements, fines, and automated communication logs."
              : "Verify your open account balance and complete standard secure credit card payments."}
          </p>
        </div>

        <div className="flex gap-2">
          {activeUser.role === "board_member" && (
            <button
              onClick={() => setShowAddDue(!showAddDue)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors duration-150"
              id="assess-dues-btn"
            >
              <PlusCircle className="w-4 h-4" />
              Assess Dues / Fine
            </button>
          )}
        </div>
      </div>

      {/* Add Due Form (Board Member only) */}
      {showAddDue && (
        <form onSubmit={handleAddDue} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4 animate-slide-down" id="add-due-form">
          <h3 className="text-sm font-bold text-slate-900 uppercase">Create New Community Billing Statement</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Target Resident */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Resident Profile</label>
              <select
                value={targetResidentId}
                onChange={(e) => setTargetResidentId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              >
                <option value="user_john">John Smith (204 Pine Needles Lane)</option>
                <option value="user_clara">Clara Barton (305 Red Cross Circle)</option>
                <option value="user_sophie">Sophie Germain (412 Prime Avenue)</option>
              </select>
            </div>

            {/* Assessment Type / Description */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Description</label>
              <input
                type="text"
                required
                value={dueDesc}
                onChange={(e) => setDueDesc(e.target.value)}
                placeholder="e.g. Q3 2026 Dues"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              />
            </div>

            {/* Amount & Due Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">$</span>
                  <input
                    type="number"
                    required
                    value={dueAmount}
                    onChange={(e) => setDueAmount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-6 pr-3 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Due Date</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setShowAddDue(false)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-600 text-xs font-semibold hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-xl"
            >
              {loading ? "Processing..." : "Create Billing Entry"}
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-100 pb-3" id="dues-filters">
        {(["all", "unpaid", "paid", "overdue"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`text-xs px-3.5 py-1.5 rounded-full capitalize font-semibold transition-all duration-150 ${
              filterStatus === status ? "bg-slate-950 text-white" : "text-gray-500 hover:bg-slate-50"
            }`}
            id={`filter-dues-tab-${status}`}
          >
            {status === "all" ? "All Statements" : status}
          </button>
        ))}
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-xs" id="ledger-table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                <th className="px-5 py-3">Resident / Address</th>
                <th className="px-5 py-3">Billing Description</th>
                <th className="px-5 py-3">Due Date</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
              {displayedDues.length > 0 ? (
                displayedDues.map((due) => (
                  <tr key={due.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                          {due.residentName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{due.residentName}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{due.residentAddress}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-850">{due.description}</p>
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-500">
                      {due.status === "paid" && due.paidDate ? (
                        <div>
                          <p className="text-slate-400 line-through">{due.dueDate}</p>
                          <p className="text-[10px] text-emerald-600 font-bold">Paid on {due.paidDate.slice(0, 10)}</p>
                        </div>
                      ) : (
                        due.dueDate
                      )}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">${due.amount}</td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${
                          due.status === "paid"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : due.status === "overdue"
                            ? "bg-rose-50 text-rose-700 border border-rose-100"
                            : "bg-amber-50 text-amber-700 border border-amber-100"
                        }`}
                      >
                        {due.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {due.status !== "paid" ? (
                        activeUser.role === "board_member" ? (
                          <button
                            onClick={() => sendAutomatedReminder(due)}
                            disabled={loading}
                            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ml-auto"
                            id={`reminder-btn-${due.id}`}
                          >
                            <Send className="w-3.5 h-3.5 text-blue-600" />
                            Email Reminder
                          </button>
                        ) : (
                          <button
                            onClick={() => setPayingDue(due)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ml-auto shadow-xs"
                            id={`pay-btn-${due.id}`}
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Pay Statement
                          </button>
                        )
                      ) : (
                        <div className="flex items-center gap-1 text-emerald-600 font-bold justify-end">
                          <Check className="w-4 h-4 text-emerald-600" />
                          Settled
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                    No matching billing records identified for this session filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Checkout Modal (Resident card billing) */}
      {payingDue && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="checkout-modal">
          <div className="bg-white rounded-2xl max-w-md w-full border border-gray-100 shadow-2xl p-6 relative">
            <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b border-gray-100 pb-3">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Secure Payment Checkout
            </h3>

            {receiptUrl ? (
              // Receipt View
              <div className="space-y-5 py-6 text-center" id="payment-receipt">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl">
                  ✓
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900">Payment Completed!</h4>
                  <p className="text-xs text-gray-500 mt-1">Thank you for supporting community maintenance programs.</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl text-left text-xs font-mono border border-slate-100 space-y-1">
                  <p className="flex justify-between"><span>Receipt ID:</span> <span className="font-bold">{receiptUrl}</span></p>
                  <p className="flex justify-between"><span>Settled:</span> <span className="font-bold">${payingDue.amount}</span></p>
                  <p className="flex justify-between"><span>Description:</span> <span className="font-bold">{payingDue.description}</span></p>
                  <p className="flex justify-between"><span>Date:</span> <span className="font-bold">{new Date().toLocaleDateString()}</span></p>
                </div>
                <button
                  onClick={() => {
                    setPayingDue(null);
                    setReceiptUrl(null);
                  }}
                  className="w-full bg-slate-950 hover:bg-slate-900 text-white font-semibold py-2.5 rounded-xl text-xs"
                >
                  Close & Refresh Ledger
                </button>
              </div>
            ) : (
              // Payment Form
              <div className="space-y-4 py-4" id="payment-form">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100/50 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{payingDue.description}</p>
                    <p className="text-slate-400 text-[10px]">Due Deadline: {payingDue.dueDate}</p>
                  </div>
                  <span className="text-base font-extrabold text-slate-900">${payingDue.amount}</span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Cardholder Name</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                      value={activeUser.name}
                      disabled
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Credit Card Number</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400">💳</span>
                      <input
                        type="text"
                        required
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4111 2222 3333 4444"
                        className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Expiration</label>
                      <input
                        type="text"
                        required
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Security CVC</label>
                      <input
                        type="password"
                        required
                        value={cardCVC}
                        onChange={(e) => setCardCVC(e.target.value)}
                        placeholder="***"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setPayingDue(null)}
                    className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold hover:bg-gray-50 text-gray-600 text-center"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executePayment}
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
                    id="submit-card-pay-btn"
                  >
                    {loading ? (
                      <span className="animate-spin text-sm">↻</span>
                    ) : (
                      <>
                        <Receipt className="w-4 h-4" />
                        Authorize ${payingDue.amount}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
