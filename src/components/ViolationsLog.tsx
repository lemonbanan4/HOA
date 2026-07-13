import React, { useState, useEffect } from "react";
import { Violation, UserProfile } from "../types";
import { collection, onSnapshot, doc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { ShieldAlert, CheckCircle, Scale, Eye, PlusCircle, User, Calendar, ExternalLink, HelpCircle } from "lucide-react";

interface ViolationsLogProps {
  activeUser: UserProfile;
}

const PRESET_EVIDENCE_IMAGES = [
  { label: "Unapproved Trash Cans", url: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=400&q=80" },
  { label: "Overgrown Lawns & Weeds", url: "https://images.unsplash.com/photo-1533460004989-cef01064af7e?auto=format&fit=crop&w=400&q=80" },
  { label: "Commercial Service Truck", url: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=400&q=80" },
  { label: "Unapproved Fencing/Construction", url: "https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=400&q=80" },
];

export default function ViolationsLog({ activeUser }: ViolationsLogProps) {
  const [violationsList, setViolationsList] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "reported" | "under_review" | "fine_issued" | "resolved">("all");

  // New Violation Form State (Board Member only)
  const [showAddForm, setShowAddForm] = useState(false);
  const [targetResidentId, setTargetResidentId] = useState("user_john");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fineAmount, setFineAmount] = useState(0);
  const [evidenceUrl, setEvidenceUrl] = useState(PRESET_EVIDENCE_IMAGES[0].url);

  // Dispute Modal (Resident only)
  const [disputingViolation, setDisputingViolation] = useState<Violation | null>(null);
  const [disputeText, setDisputeText] = useState("");

  // Detailed Modal View (both roles)
  const [viewingViolation, setViewingViolation] = useState<Violation | null>(null);
  const [boardNote, setBoardNote] = useState("");

  // Real-time listener for violations
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "violations"), (snap) => {
      const data: Violation[] = [];
      snap.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Violation);
      });
      setViolationsList(data);
    });
    return unsub;
  }, []);

  // Filter based on active session & status filter
  const displayedViolations = violationsList.filter((v) => {
    const matchesUser = activeUser.role === "board_member" || v.residentId === activeUser.id;
    const matchesStatus = filterStatus === "all" || v.status === filterStatus;
    return matchesUser && matchesStatus;
  });

  // 1. Board issues a new violation record
  const handleCreateViolation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

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

      const newViolation = {
        residentId: targetResidentId,
        residentName: residentNames[targetResidentId] || "Resident",
        residentAddress: residentAddresses[targetResidentId] || "Community Block",
        title,
        description,
        fineAmount: Number(fineAmount),
        evidenceUrl,
        reportedDate: new Date().toISOString().split("T")[0],
        status: "reported",
        notes: "Violation filed by board member. Formal warning issued.",
      };

      await addDoc(collection(db, "violations"), newViolation);

      // If fine is issued initially, increase resident balance
      if (fineAmount > 0) {
        const userRef = doc(db, "users", targetResidentId);
        await updateDoc(userRef, {
          balance: Number(fineAmount)
        });
      }

      setShowAddForm(false);
      setTitle("");
      setDescription("");
      setFineAmount(0);
      setLoading(false);
    } catch (err) {
      console.error("Error creating violation log:", err);
      setLoading(false);
    }
  };

  // 2. Resident submits dispute letter
  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputingViolation || !disputeText) return;

    try {
      setLoading(true);
      const violationRef = doc(db, "violations", disputingViolation.id);
      const updatedNotes = `${disputingViolation.notes || ""}\n\n[RESIDENT DISPUTE - ${new Date().toLocaleDateString()}]: ${disputeText}`;

      await updateDoc(violationRef, {
        status: "under_review",
        notes: updatedNotes
      });

      setDisputingViolation(null);
      setDisputeText("");
      setLoading(false);
    } catch (err) {
      console.error("Error submitting dispute:", err);
      setLoading(false);
    }
  };

  // 3. Board updates violation state / fine amount
  const handleUpdateStatus = async (violation: Violation, newStatus: Violation["status"], finalBoardNotes: string) => {
    try {
      setLoading(true);
      const violationRef = doc(db, "violations", violation.id);

      await updateDoc(violationRef, {
        status: newStatus,
        notes: finalBoardNotes
      });

      setViewingViolation(null);
      setLoading(false);
    } catch (err) {
      console.error("Error updating violation status:", err);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" id="violations-log-view">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Community Code Violation Register</h2>
          <p className="text-xs text-gray-500">
            {activeUser.role === "board_member"
              ? "Oversee compliance cases, review resident dispute filings, and adjust assessed fines."
              : "Review architectural compliance details, trash regulations warnings, or file formal disputes."}
          </p>
        </div>

        {activeUser.role === "board_member" && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors duration-150"
            id="report-violation-btn"
          >
            <PlusCircle className="w-4 h-4" />
            File New Violation
          </button>
        )}
      </div>

      {/* Board Form to File Violation */}
      {showAddForm && (
        <form onSubmit={handleCreateViolation} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4 animate-slide-down" id="add-violation-form">
          <h3 className="text-sm font-bold text-slate-900 uppercase">Log Rule Compliance Case</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Target Resident & Title */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Resident Account</label>
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

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Violation Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Trash Cans Left on Street"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Fine Amount (optional warning = $0)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">$</span>
                  <input
                    type="number"
                    value={fineAmount}
                    onChange={(e) => setFineAmount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-6 pr-3 py-2 text-xs text-slate-800 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Description & Evidence */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Incident Details & Evidence Description</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Describe location, timing, and rule broken..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Simulate Photo Evidence Attachment</label>
                <select
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                >
                  {PRESET_EVIDENCE_IMAGES.map((img) => (
                    <option key={img.url} value={img.url}>{img.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3.5 py-2 border border-slate-200 rounded-xl text-slate-600 text-xs font-semibold hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-slate-950 hover:bg-slate-900 text-white text-xs font-semibold px-4.5 py-2 rounded-xl"
            >
              {loading ? "Filing..." : "Register Violation Case"}
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex gap-2 border-b border-gray-100 pb-3" id="violation-filters">
        {(["all", "reported", "under_review", "fine_issued", "resolved"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`text-xs px-3.5 py-1.5 rounded-full capitalize font-semibold transition-all duration-150 ${
              filterStatus === status ? "bg-slate-950 text-white" : "text-gray-500 hover:bg-slate-50"
            }`}
            id={`filter-viol-tab-${status}`}
          >
            {status === "all" ? "All Cases" : status.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Grid of Violations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="violations-grid">
        {displayedViolations.length > 0 ? (
          displayedViolations.map((v) => (
            <div key={v.id} className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-shadow duration-250 flex flex-col justify-between" id={`violation-card-${v.id}`}>
              {/* Image Evidence Thumbnail */}
              {v.evidenceUrl && (
                <div className="h-44 bg-slate-100 relative overflow-hidden">
                  <img src={v.evidenceUrl} alt="evidence" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <span className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest text-white shadow-sm ${
                    v.status === "resolved" ? "bg-emerald-600" : v.status === "fine_issued" ? "bg-red-600 animate-pulse" : "bg-amber-500"
                  }`}>
                    {v.status.replace("_", " ")}
                  </span>
                </div>
              )}

              {/* Body */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                    Reported on {v.reportedDate}
                  </span>
                  <h4 className="text-sm font-bold text-gray-900 leading-tight">{v.title}</h4>
                  <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">{v.description}</p>
                </div>

                {/* Resident Details Footer */}
                <div className="border-t border-gray-50 pt-3.5 mt-2 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-gray-900">{v.residentName}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{v.residentAddress}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Assessment</p>
                    <p className={`font-mono font-extrabold ${v.fineAmount > 0 ? "text-red-600 text-sm" : "text-emerald-600"}`}>
                      {v.fineAmount > 0 ? `$${v.fineAmount}` : "Warning"}
                    </p>
                  </div>
                </div>

                {/* Actions Button */}
                <div className="pt-3 flex gap-2">
                  <button
                    onClick={() => {
                      setViewingViolation(v);
                      setBoardNote(v.notes || "");
                    }}
                    className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    Case History
                  </button>

                  {v.status !== "resolved" && activeUser.role === "resident" && (
                    <button
                      onClick={() => setDisputingViolation(v)}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1 transition-colors"
                      id={`dispute-btn-${v.id}`}
                    >
                      <Scale className="w-3.5 h-3.5" />
                      Dispute Fine
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white border border-dashed border-gray-200 py-12 text-center text-gray-400 text-xs rounded-2xl flex flex-col items-center justify-center gap-2">
            <ShieldAlert className="w-8 h-8 opacity-25" />
            No compliance issues noted under this status.
          </div>
        )}
      </div>

      {/* Case Details & Action Dialog Modal */}
      {viewingViolation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="case-history-modal">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-gray-150 shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Case ID: {viewingViolation.id}
                </span>
                <h3 className="text-sm font-bold text-gray-900 mt-1 uppercase">Compliance Dossier</h3>
              </div>
              <button onClick={() => setViewingViolation(null)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">×</button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Evidence Photo */}
              {viewingViolation.evidenceUrl && (
                <div className="h-44 bg-slate-100 rounded-xl overflow-hidden border border-slate-150">
                  <img src={viewingViolation.evidenceUrl} alt="evidence" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              )}

              {/* Basic Dossier details */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <p className="text-slate-400 uppercase font-bold text-[10px]">Resident Account</p>
                  <p className="font-bold text-slate-900 mt-0.5">{viewingViolation.residentName}</p>
                  <p className="text-slate-500">{viewingViolation.residentAddress}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 uppercase font-bold text-[10px]">Assessment Fine</p>
                  <p className="text-sm font-mono font-extrabold text-red-600 mt-0.5">
                    {viewingViolation.fineAmount > 0 ? `$${viewingViolation.fineAmount}` : "Formal Warning ($0)"}
                  </p>
                  <p className="text-slate-500">Filed {viewingViolation.reportedDate}</p>
                </div>
              </div>

              {/* Case Notes Log */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Board & Dispute Notes Log</p>
                <div className="bg-slate-950 text-slate-100 p-4 rounded-xl font-mono text-xs max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {viewingViolation.notes}
                </div>
              </div>

              {/* Board Control Box (Board Members only) */}
              {activeUser.role === "board_member" && viewingViolation.status !== "resolved" && (
                <div className="space-y-2 border-t border-slate-150 pt-4" id="board-compliance-control-box">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Board Resolution Actions</p>
                  <textarea
                    rows={2}
                    value={boardNote}
                    onChange={(e) => setBoardNote(e.target.value)}
                    placeholder="Add operational notes or dispute resolutions before status transition..."
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus(viewingViolation, "under_review", boardNote)}
                      className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold py-2 rounded-lg border border-amber-200"
                    >
                      Set Under Review
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(viewingViolation, "fine_issued", boardNote)}
                      className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-800 text-[11px] font-bold py-2 rounded-lg border border-rose-200"
                    >
                      Issue Assessment Fine
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(viewingViolation, "resolved", boardNote)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold py-2 rounded-lg"
                    >
                      ✓ Mark Resolved
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 bg-slate-50 text-right">
              <button
                onClick={() => setViewingViolation(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-xl"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resident dispute filing modal */}
      {disputingViolation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="dispute-modal">
          <form onSubmit={handleSubmitDispute} className="bg-white rounded-2xl max-w-md w-full border border-gray-150 shadow-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5 border-b border-gray-100 pb-3">
              <Scale className="w-5 h-5 text-blue-600" />
              File Formal Case Dispute
            </h3>
            <p className="text-xs text-gray-500">
              Submit your dispute argument regarding the violation <strong>&quot;{disputingViolation.title}&quot;</strong>.
              Your appeal will immediately put the violation status into <strong>&quot;Under Review&quot;</strong> for board evaluation at the next monthly hearing.
            </p>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Reasoning / Dispute Statement</label>
              <textarea
                required
                rows={4}
                value={disputeText}
                onChange={(e) => setDisputeText(e.target.value)}
                placeholder="Explain any mitigating circumstances or if the issue has already been corrected..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDisputingViolation(null)}
                className="flex-1 py-2 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-100 text-slate-600 text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center"
                id="submit-dispute-btn"
              >
                {loading ? "Submitting..." : "Submit Case Dispute"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
