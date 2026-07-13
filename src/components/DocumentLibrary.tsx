import React, { useState, useEffect } from "react";
import { DocumentItem, UserProfile } from "../types";
import { collection, onSnapshot, doc, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { FileText, Download, Upload, AlertCircle, Check, HelpCircle, ArrowRight } from "lucide-react";

interface DocumentLibraryProps {
  activeUser: UserProfile;
}

export default function DocumentLibrary({ activeUser }: DocumentLibraryProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<"all" | "bylaws" | "financials" | "meeting_minutes" | "guidelines">("all");

  // Drag and Drop uploads state
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Form fields for board uploading
  const [docTitle, setDocTitle] = useState("");
  const [docCategory, setDocCategory] = useState<DocumentItem["category"]>("bylaws");
  const [docDesc, setDocDesc] = useState("");

  // Simulated Document Reader Modal
  const [viewingDoc, setViewingDoc] = useState<DocumentItem | null>(null);

  // Download Alert State
  const [downloadAlertText, setDownloadAlertText] = useState<string | null>(null);

  // Fetch real-time documents list
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "documents"), (snap) => {
      const data: DocumentItem[] = [];
      snap.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as DocumentItem);
      });
      setDocuments(data);
    });
    return unsub;
  }, []);

  const displayedDocs = documents.filter((d) => {
    return filterCategory === "all" || d.category === filterCategory;
  });

  // Drag and Drop event handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setDocTitle(e.dataTransfer.files[0].name.split(".")[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setDocTitle(e.target.files[0].name.split(".")[0]);
    }
  };

  // Submit/upload new document to Firestore
  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle || !docDesc) return;

    try {
      setLoading(true);

      const newDoc = {
        title: docTitle,
        description: docDesc,
        category: docCategory,
        uploadDate: new Date().toISOString().split("T")[0],
        version: "v1.0",
      };

      await addDoc(collection(db, "documents"), newDoc);

      setUploadSuccess(true);
      setDocTitle("");
      setDocDesc("");
      setSelectedFile(null);
      setLoading(false);

      setTimeout(() => {
        setUploadSuccess(false);
      }, 4000);
    } catch (err) {
      console.error("Error logging document:", err);
      setLoading(false);
    }
  };

  // Simulated PDF Downloader
  const handleDownload = (docItem: DocumentItem) => {
    setDownloadAlertText(`Initiating secure SSL transmission and downloading: ${docItem.title} (${docItem.version})`);
    setTimeout(() => {
      setDownloadAlertText(null);
    }, 4000);
  };

  return (
    <div className="space-y-6" id="documents-tab-view">
      {/* Success notification banner */}
      {uploadSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in" id="doc-upload-success-banner">
          <Check className="w-5 h-5 text-emerald-600" />
          <p className="text-xs font-semibold">Document uploaded and indexed successfully into HOA Document Vault.</p>
        </div>
      )}

      {/* Download toast notification banner */}
      {downloadAlertText && (
        <div className="bg-blue-50 border border-blue-200 text-blue-950 px-4 py-3.5 rounded-xl flex items-start gap-2.5 shadow-md fixed bottom-6 right-6 z-55 max-w-sm animate-fade-in" id="doc-download-toast">
          <Check className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-xs">
            <p className="font-bold">Downloading Document</p>
            <p className="text-blue-700/90 mt-0.5">{downloadAlertText}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">HOA Vault & Bylaws Document Library</h2>
          <p className="text-xs text-gray-500">
            Official community charters, rules, architectural applications, and audit reports compiled for transparency.
          </p>
        </div>
      </div>

      {/* Bento Grid: Upload Form (Board only) & Document List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="documents-grid-layout">
        {/* Upload Panel (Board Members only) */}
        {activeUser.role === "board_member" && (
          <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-xs lg:col-span-5 space-y-4" id="board-upload-vault-panel">
            <h3 className="text-sm font-bold text-slate-900 uppercase">Index New Governing Document</h3>
            <p className="text-xs text-slate-500">
              Drag-and-drop minutes, amendments, ACC manuals, or finance updates to index them securely.
            </p>

            <form onSubmit={handleUploadDocument} className="space-y-4">
              {/* Drag and Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors relative ${
                  dragActive ? "border-blue-600 bg-blue-50/50" : "border-slate-200 bg-slate-50 hover:bg-slate-100/50"
                }`}
                id="drag-and-drop-container"
              >
                <input
                  type="file"
                  id="vault-file-picker"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                />
                <label htmlFor="vault-file-picker" className="cursor-pointer space-y-2 block">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto text-lg">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-slate-600">
                    {selectedFile ? (
                      <p className="font-semibold text-slate-900 flex items-center justify-center gap-1">
                        📎 {selectedFile.name}
                      </p>
                    ) : (
                      <p>
                        <span className="text-blue-600 font-bold hover:underline">Choose a file</span> or drag & drop here
                      </p>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">PDF, DOCX, or XLSX formats up to 25MB</p>
                </label>
              </div>

              {/* Form details */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Document Title</label>
                  <input
                    type="text"
                    required
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="e.g. Roof Modification Standards"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Category Tag</label>
                  <select
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value as DocumentItem["category"])}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs text-slate-800"
                  >
                    <option value="bylaws">Master Bylaws & Charters</option>
                    <option value="financials">Budgets & Audited Financials</option>
                    <option value="guidelines">ACC Standards & Handbooks</option>
                    <option value="meeting_minutes">Board Meeting Minutes</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Brief Summary / Description</label>
                  <textarea
                    required
                    rows={2}
                    value={docDesc}
                    onChange={(e) => setDocDesc(e.target.value)}
                    placeholder="Provide a search summary for the index..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-950 hover:bg-slate-900 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                id="submit-doc-upload-btn"
              >
                <FileText className="w-4 h-4" />
                {loading ? "Indexing..." : "Index and Publish Document"}
              </button>
            </form>
          </div>
        )}

        {/* Document Listing Vault */}
        <div className={`space-y-4 ${activeUser.role === "board_member" ? "lg:col-span-7" : "lg:col-span-12"}`} id="document-catalog-panel">
          {/* Category Filter Pills */}
          <div className="flex gap-2 border-b border-gray-100 pb-3 overflow-x-auto" id="doc-filters">
            {(["all", "bylaws", "financials", "meeting_minutes", "guidelines"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-full capitalize font-semibold whitespace-nowrap transition-all duration-150 ${
                  filterCategory === cat ? "bg-slate-950 text-white" : "text-gray-500 hover:bg-slate-50"
                }`}
                id={`filter-doc-tab-${cat}`}
              >
                {cat === "all" ? "All Vaults" : cat.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* List of Docs */}
          <div className="space-y-3" id="document-list-container">
            {displayedDocs.length > 0 ? (
              displayedDocs.map((docItem) => (
                <div
                  key={docItem.id}
                  onClick={() => setViewingDoc(docItem)}
                  className="bg-white border border-gray-150 hover:border-gray-300 p-4 rounded-xl flex items-center justify-between gap-4 cursor-pointer hover:shadow-xs transition-all duration-150"
                  id={`doc-row-${docItem.id}`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-blue-600">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">{docItem.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{docItem.description}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <span>{docItem.category.replace("_", " ")}</span>
                        <span>•</span>
                        <span>{docItem.version}</span>
                        <span>•</span>
                        <span>Added {docItem.uploadDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(docItem);
                      }}
                      className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors border border-slate-100"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-dashed border-gray-200 py-12 text-center text-gray-400 text-xs rounded-2xl flex flex-col items-center justify-center gap-2">
                <FileText className="w-8 h-8 opacity-25" />
                No governing documents mapped under this classification.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Simulated Document Reader Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="doc-viewer-modal">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-gray-150 shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-gray-900 uppercase">{viewingDoc.title}</h3>
              </div>
              <button onClick={() => setViewingDoc(null)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">×</button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="bg-blue-50/50 p-3.5 rounded-xl text-blue-950 flex items-start gap-2 border border-blue-100">
                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <p className="font-semibold">HOA Vault Security Protocol Active</p>
                  <p className="text-[11px] text-blue-900 mt-0.5">
                    This document is officially indexed under version <strong>{viewingDoc.version}</strong>. Last updated on <strong>{viewingDoc.uploadDate}</strong>.
                  </p>
                </div>
              </div>

              <div>
                <p className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1">Index Summary</p>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100 font-medium">
                  {viewingDoc.description}
                </p>
              </div>

              {/* Simulated Document Text */}
              <div className="space-y-3 pt-2">
                <p className="font-bold text-slate-900 uppercase text-[10px] tracking-wider border-b border-slate-100 pb-1.5">Governing Regulations Clause Preview</p>
                <div className="space-y-2 text-slate-600 font-serif leading-relaxed italic p-3">
                  <p>&quot;[1.1] The Association shall maintain an Architectural Control Committee (ACC) comprising of at least three (3) active Board delegates. Any modifications to any parcel exterior visual aspect (including roofing shingles, vinyl siding hues, gate placements, and deck extensions) require written ACC approval.&quot;</p>
                  <p>&quot;[1.2] All quarterly assessments are billed on the first business calendar day and are subject to severe collection procedures if delinquent past fifteen (15) solar days.&quot;</p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-slate-50 flex justify-end gap-2.5">
              <button
                onClick={() => handleDownload(viewingDoc)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
                id="modal-download-doc-btn"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
              <button
                onClick={() => setViewingDoc(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-xl"
              >
                Close Vault
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
