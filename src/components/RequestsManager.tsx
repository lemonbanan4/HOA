import React, { useState, useEffect } from "react";
import { ACCRequest, WorkOrder, UserProfile } from "../types";
import { collection, onSnapshot, doc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { 
  FileText, Check, X, ShieldAlert, PlusCircle, Wrench, Clock, 
  Paintbrush, Construction, FileCheck, Hammer, HelpCircle, User, MapPin
} from "lucide-react";

interface RequestsManagerProps {
  activeUser: UserProfile;
}

export default function RequestsManager({ activeUser }: RequestsManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<"acc" | "maintenance">("acc");
  const [accRequests, setAccRequests] = useState<ACCRequest[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(false);

  // Forms State
  const [showAddAcc, setShowAddAcc] = useState(false);
  const [accType, setAccType] = useState<ACCRequest["projectType"]>("painting");
  const [accDesc, setAccDesc] = useState("");
  const [accMaterials, setAccMaterials] = useState("");

  const [showAddMaintenance, setShowAddMaintenance] = useState(false);
  const [maintenanceTitle, setMaintenanceTitle] = useState("");
  const [maintenanceLoc, setMaintenanceLoc] = useState("");
  const [maintenanceDesc, setMaintenanceDesc] = useState("");
  const [maintenanceCategory, setMaintenanceCategory] = useState<WorkOrder["category"]>("lighting");

  // Board review notes state
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [vendorAssignment, setVendorAssignment] = useState<Record<string, string>>({});

  // Fetch Firestore Real-time Collections
  useEffect(() => {
    const unsubAcc = onSnapshot(collection(db, "accRequests"), (snap) => {
      const data: ACCRequest[] = [];
      snap.forEach((doc) => data.push({ id: doc.id, ...doc.data() } as ACCRequest));
      setAccRequests(data);
    });

    const unsubWO = onSnapshot(collection(db, "workOrders"), (snap) => {
      const data: WorkOrder[] = [];
      snap.forEach((doc) => data.push({ id: doc.id, ...doc.data() } as WorkOrder));
      setWorkOrders(data);
    });

    return () => {
      unsubAcc();
      unsubWO();
    };
  }, []);

  // Filter requests (Residents only see their own!)
  const displayedAcc = accRequests.filter((req) => {
    return activeUser.role === "board_member" || req.residentId === activeUser.id;
  });

  const displayedWO = workOrders.filter((wo) => {
    return activeUser.role === "board_member" || wo.reportedBy === activeUser.id;
  });

  // Submit ACC Request (Resident)
  const handleSubmitAcc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accDesc.trim() || !accMaterials.trim()) return;

    try {
      setLoading(true);
      const newRequest: Omit<ACCRequest, "id"> = {
        residentId: activeUser.id,
        residentName: activeUser.name,
        residentAddress: activeUser.address,
        projectType: accType,
        description: accDesc.trim(),
        materialsDetails: accMaterials.trim(),
        submittedDate: new Date().toISOString().split("T")[0],
        status: "pending"
      };

      await addDoc(collection(db, "accRequests"), newRequest);
      setAccDesc("");
      setAccMaterials("");
      setShowAddAcc(false);
    } catch (err) {
      console.error("Error submitting ACC application:", err);
    } finally {
      setLoading(false);
    }
  };

  // Submit Work Order (Resident)
  const handleSubmitMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintenanceTitle.trim() || !maintenanceLoc.trim() || !maintenanceDesc.trim()) return;

    try {
      setLoading(true);
      const newWO: Omit<WorkOrder, "id"> = {
        reportedBy: activeUser.id,
        reporterName: activeUser.name,
        title: maintenanceTitle.trim(),
        location: maintenanceLoc.trim(),
        description: maintenanceDesc.trim(),
        category: maintenanceCategory,
        submittedDate: new Date().toISOString().split("T")[0],
        status: "submitted"
      };

      await addDoc(collection(db, "workOrders"), newWO);
      setMaintenanceTitle("");
      setMaintenanceLoc("");
      setMaintenanceDesc("");
      setShowAddMaintenance(false);
    } catch (err) {
      console.error("Error logging work order:", err);
    } finally {
      setLoading(false);
    }
  };

  // Update ACC status (Board)
  const handleReviewAcc = async (id: string, status: "approved" | "rejected") => {
    try {
      setLoading(true);
      const notes = reviewNotes[id] || `Decision processed by Board on ${new Date().toLocaleDateString()}`;
      const docRef = doc(db, "accRequests", id);
      await updateDoc(docRef, {
        status,
        boardNotes: notes,
        decisionDate: new Date().toISOString().split("T")[0]
      });
      // clear notes state
      setReviewNotes((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } catch (err) {
      console.error("Error updating ACC status:", err);
    } finally {
      setLoading(false);
    }
  };

  // Update Work Order status (Board)
  const handleUpdateWO = async (id: string, status: "in_progress" | "completed") => {
    try {
      setLoading(true);
      const vendor = vendorAssignment[id] || "In-house Maintenance Staff";
      const docRef = doc(db, "workOrders", id);
      const updates: any = { status };
      
      if (status === "in_progress") {
        updates.assignedVendor = vendor;
      } else if (status === "completed") {
        updates.completionDate = new Date().toISOString().split("T")[0];
      }

      await updateDoc(docRef, updates);
      
      setVendorAssignment((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } catch (err) {
      console.error("Error updating Work Order status:", err);
    } finally {
      setLoading(false);
    }
  };

  // Project Type Icons
  const getAccIcon = (type: ACCRequest["projectType"]) => {
    switch (type) {
      case "painting": return <Paintbrush className="w-4 h-4" />;
      case "roofing": return <Construction className="w-4 h-4" />;
      case "fence": return <Hammer className="w-4 h-4" />;
      case "landscaping": return <Wrench className="w-4 h-4" />;
      default: return <FileCheck className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6" id="requests-manager-view">
      {/* Sub Tabs */}
      <div className="flex border-b border-gray-150 gap-1 pb-px" id="requests-subtabs">
        <button
          onClick={() => setActiveSubTab("acc")}
          className={`px-4 py-2.5 text-xs uppercase tracking-wider font-extrabold border-b-2 transition-all duration-150 flex items-center gap-2 ${
            activeSubTab === "acc"
              ? "border-blue-600 text-blue-600 font-black"
              : "border-transparent text-gray-400 hover:text-slate-700"
          }`}
          id="acc-tab-btn"
        >
          <FileCheck className="w-3.5 h-3.5" />
          ACC Permits & Architectural Review
        </button>
        <button
          onClick={() => setActiveSubTab("maintenance")}
          className={`px-4 py-2.5 text-xs uppercase tracking-wider font-extrabold border-b-2 transition-all duration-150 flex items-center gap-2 ${
            activeSubTab === "maintenance"
              ? "border-blue-600 text-blue-600 font-black"
              : "border-transparent text-gray-400 hover:text-slate-700"
          }`}
          id="maintenance-tab-btn"
        >
          <Wrench className="w-3.5 h-3.5" />
          Common Area Maintenance
        </button>
      </div>

      {/* Overview Statistics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6" id="requests-stats-grid">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase">Pending ACC Reviews</span>
            <p className="text-2xl font-bold text-slate-900">
              {accRequests.filter((r) => r.status === "pending").length}
            </p>
          </div>
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase">Active Repairs</span>
            <p className="text-2xl font-bold text-amber-600">
              {workOrders.filter((w) => w.status !== "completed").length}
            </p>
          </div>
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase">Completed Maintenance</span>
            <p className="text-2xl font-bold text-emerald-600">
              {workOrders.filter((w) => w.status === "completed").length}
            </p>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
            <Check className="w-5 h-5" />
          </div>
        </div>
      </div>

      {activeSubTab === "acc" ? (
        // ----------------------------------------------------
        // ACC SYSTEM
        // ----------------------------------------------------
        <div className="space-y-6" id="acc-portal">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Architectural Review Committee (ACC) Applications</h2>
              <p className="text-xs text-gray-500">
                {activeUser.role === "board_member"
                  ? "Audit, approve, or deny modification request forms filed by community homeowners."
                  : "Submit formal request forms for structural, painting, landscaping, or fencing revisions before breaking ground."}
              </p>
            </div>
            {activeUser.role === "resident" && (
              <button
                onClick={() => setShowAddAcc(!showAddAcc)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors duration-150 shadow-xs"
                id="apply-acc-btn"
              >
                <PlusCircle className="w-4 h-4" />
                New ACC Application
              </button>
            )}
          </div>

          {/* New ACC Application Form */}
          {showAddAcc && (
            <form onSubmit={handleSubmitAcc} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4 animate-slide-down" id="new-acc-form">
              <h3 className="text-sm font-bold text-slate-900 uppercase">Apply for Architectural Exterior Permit</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Project Category</label>
                  <select
                    value={accType}
                    onChange={(e) => setAccType(e.target.value as ACCRequest["projectType"])}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                  >
                    <option value="painting">Exterior Painting & Hues</option>
                    <option value="roofing">Roof Replacement / Shingles</option>
                    <option value="fence">Fence Installation / Boundary Wall</option>
                    <option value="landscaping">Major Backyard/Frontyard Landscaping</option>
                    <option value="deck_patio">Deck, Patio, or Gazebo Extension</option>
                    <option value="other">Other Modifications</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Materials & Brand Specifications</label>
                  <input
                    type="text"
                    required
                    value={accMaterials}
                    onChange={(e) => setAccMaterials(e.target.value)}
                    placeholder="e.g. Sherwin Williams Satin Paint #SW2811, Pressure Treated Cedar wood"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Detailed Project Description</label>
                  <textarea
                    required
                    rows={3}
                    value={accDesc}
                    onChange={(e) => setAccDesc(e.target.value)}
                    placeholder="Provide dimensions, visual plans, colors, and exact locations of the proposed revision..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAcc(false)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-slate-600 text-xs font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs"
                >
                  {loading ? "Submitting..." : "Submit Application to Board"}
                </button>
              </div>
            </form>
          )}

          {/* ACC Applications List */}
          <div className="space-y-4" id="acc-applications-list">
            {displayedAcc.length > 0 ? (
              displayedAcc.map((req) => (
                <div
                  key={req.id}
                  className="bg-white border border-slate-150 p-5 rounded-xl shadow-xs space-y-4 hover:border-slate-300 transition-colors"
                  id={`acc-card-${req.id}`}
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-50 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        {getAccIcon(req.projectType)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 capitalize flex items-center gap-2">
                          {req.projectType.replace("_", " ")} Permit Request
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              req.status === "approved"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : req.status === "rejected"
                                ? "bg-rose-50 text-rose-700 border border-rose-100"
                                : "bg-blue-50 text-blue-700 border border-blue-100"
                            }`}
                          >
                            {req.status}
                          </span>
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                          Filed by <strong>{req.residentName}</strong> ({req.residentAddress}) on {req.submittedDate}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Description Box */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <p className="font-bold text-slate-500 uppercase text-[9px] tracking-wider mb-1">Project Details</p>
                      <p className="text-slate-800 leading-relaxed font-medium">{req.description}</p>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <p className="font-bold text-slate-500 uppercase text-[9px] tracking-wider mb-1">Proposed Materials / Spec Sheet</p>
                      <p className="text-slate-800 leading-relaxed font-semibold">{req.materialsDetails}</p>
                    </div>
                  </div>

                  {/* Decisions notes or review actions */}
                  {req.status !== "pending" ? (
                    <div className="bg-slate-100/50 p-3.5 rounded-xl border border-slate-200/50 text-xs">
                      <p className="font-bold text-slate-500 uppercase text-[9px] tracking-wider mb-1">Official Board Review Decisions & Notes</p>
                      <p className="text-slate-700 leading-relaxed italic">&quot;{req.boardNotes}&quot;</p>
                      {req.decisionDate && (
                        <p className="text-[10px] text-slate-400 mt-1 font-semibold">Decision Date: {req.decisionDate}</p>
                      )}
                    </div>
                  ) : activeUser.role === "board_member" ? (
                    // Board Actions Panel
                    <div className="bg-blue-50/50 border border-blue-100/50 p-4 rounded-xl space-y-3" id={`review-panel-${req.id}`}>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Board Assessment Notes</label>
                        <input
                          type="text"
                          value={reviewNotes[req.id] || ""}
                          onChange={(e) => setReviewNotes({ ...reviewNotes, [req.id]: e.target.value })}
                          placeholder="e.g. Approved. Modification meets the paint code charter under clause 4.2..."
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleReviewAcc(req.id, "rejected")}
                          disabled={loading}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-rose-100 flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          Deny Modification
                        </button>
                        <button
                          onClick={() => handleReviewAcc(req.id, "approved")}
                          disabled={loading}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve Permit
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-50/30 p-3 rounded-xl border border-blue-100/30 text-xs flex items-center gap-2 text-blue-800">
                      <Clock className="w-4 h-4 text-blue-600 animate-spin" />
                      <span>This application is awaiting board member review. You will receive an alert once decision parameters are configured.</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white border border-dashed border-gray-200 py-12 text-center text-gray-400 text-xs rounded-2xl flex flex-col items-center justify-center gap-2">
                <FileText className="w-8 h-8 opacity-25" />
                No modification requests filed.
              </div>
            )}
          </div>
        </div>
      ) : (
        // ----------------------------------------------------
        // MAINTENANCE / WORK ORDERS
        // ----------------------------------------------------
        <div className="space-y-6" id="maintenance-portal">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Common Area Maintenance Work Orders</h2>
              <p className="text-xs text-gray-500">
                {activeUser.role === "board_member"
                  ? "Assign vendors, dispatch repair technicians, and close maintenance reports."
                  : "Report broken neighborhood assets like pool locks, street lights, broken fences, or sidewalk hazards."}
              </p>
            </div>
            {activeUser.role === "resident" && (
              <button
                onClick={() => setShowAddMaintenance(!showAddMaintenance)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors duration-150 shadow-xs"
                id="report-maintenance-btn"
              >
                <PlusCircle className="w-4 h-4" />
                Report Common Area Issue
              </button>
            )}
          </div>

          {/* New Maintenance Request Form */}
          {showAddMaintenance && (
            <form onSubmit={handleSubmitMaintenance} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4 animate-slide-down" id="new-maintenance-form">
              <h3 className="text-sm font-bold text-slate-900 uppercase">Submit Maintenance Incident Report</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Brief Title</label>
                  <input
                    type="text"
                    required
                    value={maintenanceTitle}
                    onChange={(e) => setMaintenanceTitle(e.target.value)}
                    placeholder="e.g. Broken gate lock at main pool"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Exact Location</label>
                  <input
                    type="text"
                    required
                    value={maintenanceLoc}
                    onChange={(e) => setMaintenanceLoc(e.target.value)}
                    placeholder="e.g. Next to community court 2 bench"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Category</label>
                  <select
                    value={maintenanceCategory}
                    onChange={(e) => setMaintenanceCategory(e.target.value as WorkOrder["category"])}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                  >
                    <option value="lighting">Public Streetlights & Electrical</option>
                    <option value="pool">Community Pool & Facilities</option>
                    <option value="landscaping">Commons Tree Trim / Lawn Mowing</option>
                    <option value="roads_sidewalks">Neighborhood Potholes & Sidewalks</option>
                    <option value="clubhouse">Clubhouse Repairs</option>
                    <option value="other">Other Incident Repairs</option>
                  </select>
                </div>

                <div className="space-y-1 md:col-span-3">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Incident Explanation & Details</label>
                  <textarea
                    required
                    rows={3}
                    value={maintenanceDesc}
                    onChange={(e) => setMaintenanceDesc(e.target.value)}
                    placeholder="Provide exact details of the damage, how long it has been broken, and if there are immediate safety risks..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMaintenance(false)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-slate-600 text-xs font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs"
                >
                  {loading ? "Submitting..." : "Log Maintenance Issue"}
                </button>
              </div>
            </form>
          )}

          {/* Maintenance list */}
          <div className="space-y-4" id="maintenance-workorders-list">
            {displayedWO.length > 0 ? (
              displayedWO.map((wo) => (
                <div
                  key={wo.id}
                  className="bg-white border border-slate-150 p-5 rounded-xl shadow-xs space-y-4 hover:border-slate-300 transition-colors"
                  id={`wo-card-${wo.id}`}
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-50 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                        ⚒
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          {wo.title}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              wo.status === "completed"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : wo.status === "in_progress"
                                ? "bg-amber-50 text-amber-700 border border-amber-100 animate-pulse"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {wo.status === "in_progress" ? "In Progress" : wo.status}
                          </span>
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-semibold flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          Location: <strong className="text-slate-600">{wo.location}</strong>
                          <span>•</span>
                          Category: <span className="text-slate-600 capitalize">{wo.category.replace("_", " ")}</span>
                          <span>•</span>
                          Reported: <span className="text-slate-500">{wo.submittedDate}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Incident Description */}
                  <div className="text-xs space-y-3">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <p className="font-bold text-slate-500 uppercase text-[9px] tracking-wider mb-1">Resident Incident Log</p>
                      <p className="text-slate-800 leading-relaxed font-medium">{wo.description}</p>
                      <p className="text-[10px] text-slate-400 mt-2 font-medium">Logged by homeowner: <strong>{wo.reporterName}</strong></p>
                    </div>

                    {/* Assigned vendor or completion details */}
                    {(wo.assignedVendor || wo.completionDate) && (
                      <div className="bg-slate-100/50 p-3.5 rounded-xl border border-slate-200/50 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {wo.assignedVendor && (
                          <div>
                            <p className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">Assigned Contractor</p>
                            <p className="text-slate-800 font-semibold mt-0.5 flex items-center gap-1">
                              🔩 {wo.assignedVendor}
                            </p>
                          </div>
                        )}
                        {wo.completionDate && (
                          <div>
                            <p className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">Date Resolved & Closed</p>
                            <p className="text-slate-800 font-semibold mt-0.5 flex items-center gap-1">
                              ✓ {wo.completionDate}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Board Management Control */}
                  {activeUser.role === "board_member" && wo.status !== "completed" && (
                    <div className="bg-amber-50/40 border border-amber-100/40 p-4 rounded-xl space-y-3" id={`maint-panel-${wo.id}`}>
                      {wo.status === "submitted" && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                          <div className="sm:col-span-2 space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Assign Specialized Vendor / Tech Agency</label>
                            <input
                              type="text"
                              value={vendorAssignment[wo.id] || ""}
                              onChange={(e) => setVendorAssignment({ ...vendorAssignment, [wo.id]: e.target.value })}
                              placeholder="e.g. VoltStar Electrical, ProShield Plumbing..."
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                            />
                          </div>
                          <button
                            onClick={() => handleUpdateWO(wo.id, "in_progress")}
                            disabled={loading}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-xs"
                          >
                            Dispatch Work Order
                          </button>
                        </div>
                      )}

                      {wo.status === "in_progress" && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleUpdateWO(wo.id, "completed")}
                            disabled={loading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4.5 rounded-xl flex items-center gap-1 shadow-xs"
                          >
                            <Check className="w-4 h-4" />
                            Sign-Off & Close Work Order
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white border border-dashed border-gray-200 py-12 text-center text-gray-400 text-xs rounded-2xl flex flex-col items-center justify-center gap-2">
                <Wrench className="w-8 h-8 opacity-25" />
                No active maintenance logs reported.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
