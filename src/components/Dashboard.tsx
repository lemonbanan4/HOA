import { useState, useEffect } from "react";
import { Due, Violation, BehavioralLogItem, UserProfile } from "../types";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { DollarSign, ShieldAlert, FileText, Activity, Bell, ToggleLeft, Sparkles, CheckCircle2 } from "lucide-react";

interface DashboardProps {
  activeUser: UserProfile;
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ activeUser, onNavigate }: DashboardProps) {
  const [dues, setDues] = useState<Due[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [logs, setLogs] = useState<BehavioralLogItem[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Fetch Firestore Real-time Collections
  useEffect(() => {
    const unsubDues = onSnapshot(collection(db, "dues"), (snap) => {
      const data: Due[] = [];
      snap.forEach((doc) => data.push({ id: doc.id, ...doc.data() } as Due));
      setDues(data);
    });

    const unsubViolations = onSnapshot(collection(db, "violations"), (snap) => {
      const data: Violation[] = [];
      snap.forEach((doc) => data.push({ id: doc.id, ...doc.data() } as Violation));
      setViolations(data);
    });

    const unsubLogs = onSnapshot(collection(db, "behavioralLogs"), (snap) => {
      const data: BehavioralLogItem[] = [];
      snap.forEach((doc) => data.push({ id: doc.id, ...doc.data() } as BehavioralLogItem));
      setLogs(data);
    });

    return () => {
      unsubDues();
      unsubViolations();
      unsubLogs();
    };
  }, []);

  // Compute stats
  const totalDuesBilled = dues.reduce((acc, curr) => acc + curr.amount, 0);
  const totalDuesPaid = dues.filter((d) => d.status === "paid").reduce((acc, curr) => acc + curr.amount, 0);
  const totalDuesOutstanding = totalDuesBilled - totalDuesPaid;
  const duesCollectionRate = totalDuesBilled > 0 ? Math.round((totalDuesPaid / totalDuesBilled) * 100) : 0;

  const activeViolationsCount = violations.filter((v) => v.status !== "resolved").length;
  const resolvedViolationsCount = violations.filter((v) => v.status === "resolved").length;

  const threatLevel = logs.length > 0 && logs[0].analysis ? logs[0].analysis.threatLevel : "low";

  // Data for Charts
  const duesChartData = [
    { name: "Paid Dues", value: totalDuesPaid, color: "#2563eb" }, // Blue-600
    { name: "Outstanding Dues", value: totalDuesOutstanding, color: "#ef4444" }, // Red-500
  ];

  const violationsByStatus = [
    { status: "Reported", count: violations.filter((v) => v.status === "reported").length, fill: "#f97316" }, // Orange-500
    { status: "Under Review", count: violations.filter((v) => v.status === "under_review").length, fill: "#eab308" }, // Yellow-500
    { status: "Fine Issued", count: violations.filter((v) => v.status === "fine_issued").length, fill: "#dc2626" }, // Red-600
    { status: "Resolved", count: violations.filter((v) => v.status === "resolved").length, fill: "#10b981" }, // Emerald-500
  ];

  // Simulated push notifications trigger for board members
  const triggerNotificationTest = () => {
    const alerts = [
      { id: Date.now() + 1, title: "Dues Paid", body: "John Smith paid Q1 Dues of $250.", type: "success" },
      { id: Date.now() + 2, title: "New Violation", body: "Unapproved street construction noted near block 4B.", type: "warning" },
      { id: Date.now() + 3, title: "ACC Application", body: "Clara Barton filed roof repair ACC paperwork.", type: "info" }
    ];
    const picked = alerts[Math.floor(Math.random() * alerts.length)];
    setNotifications((prev) => [picked, ...prev.slice(0, 4)]);
  };

  return (
    <div className="space-y-6" id="dashboard-tab-view">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden" id="dashboard-hero-banner">
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Community Governance & Security</h2>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Welcome back, <strong className="text-white">{activeUser.name}</strong>. Here is the real-time status of your neighborhood's financial books, violation filings, and safety logs.
            </p>
          </div>
          {activeUser.role === "board_member" && (
            <button
              onClick={triggerNotificationTest}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-xs font-semibold backdrop-blur-md transition-colors duration-150 border border-white/10"
              id="trigger-test-push-btn"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              Test Push Alert
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="stats-grid">
        {/* Total Collected */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Dues Collected</span>
            <p className="text-2xl font-bold text-slate-900">${totalDuesPaid.toLocaleString()}</p>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 mt-1">
              <CheckCircle2 className="w-3 h-3" />
              {duesCollectionRate}% Collection Rate
            </div>
          </div>
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Outstanding Balance */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase">Outstanding Dues</span>
            <p className="text-2xl font-bold text-red-600">${totalDuesOutstanding.toLocaleString()}</p>
            <span className="text-[11px] text-slate-500 font-medium block mt-1">Billed: ${totalDuesBilled.toLocaleString()}</span>
          </div>
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Active Violations */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase">Active Violations</span>
            <p className="text-2xl font-bold text-slate-900">{activeViolationsCount}</p>
            <span className="text-[11px] text-emerald-600 font-medium block mt-1">{resolvedViolationsCount} Resolved Cases</span>
          </div>
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        {/* AI Security Log Summary */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase">AI Threat Level</span>
            <p className={`text-2xl font-bold capitalize ${threatLevel === "high" ? "text-red-600" : threatLevel === "medium" ? "text-amber-500" : "text-emerald-500"}`}>
              {threatLevel} Threat
            </p>
            <span className="text-[11px] text-slate-500 font-medium block mt-1">Based on {logs.length} evaluated logs</span>
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${threatLevel === "high" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-charts-grid">
        {/* Dues Ledger Pie Chart */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-2">Dues Ledger Distribution</h3>
            <p className="text-xs text-slate-500">Real-time status of quarterly membership fees and assessments.</p>
          </div>
          <div className="h-64 flex items-center justify-center">
            {totalDuesBilled > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={duesChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {duesChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value}`} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400 text-sm">No dues billed data available.</div>
            )}
          </div>
        </div>

        {/* Violations Status Bar Chart */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-2">Violations Log Tracker</h3>
            <p className="text-xs text-slate-500">Current status of rule violations and disputes in the community.</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={violationsByStatus} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="status" tick={{ fill: "#6b7280", fontSize: 11 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {violationsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lower Bento Grid: Notifications & AI Safety Brief */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-lower-bento">
        {/* Simulated Mobile Push Alerts */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-blue-600 animate-bounce" />
                Mobile Push Alerts
              </h3>
              <p className="text-xs text-slate-500">Board real-time notifications simulator</p>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
              Live Feed
            </span>
          </div>

          <div className="space-y-3 min-h-[220px]">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-150 ${
                    n.type === "success"
                      ? "bg-emerald-50/50 border-emerald-100 text-emerald-950"
                      : n.type === "warning"
                      ? "bg-rose-50/50 border-rose-100 text-rose-950"
                      : "bg-blue-50/50 border-blue-100 text-blue-950"
                  }`}
                >
                  <span className="text-lg">
                    {n.type === "success" ? "💳" : n.type === "warning" ? "⚠️" : "📋"}
                  </span>
                  <div className="flex-1 space-y-0.5">
                    <p className="text-xs font-bold leading-tight">{n.title}</p>
                    <p className="text-[11px] leading-relaxed text-slate-600">{n.body}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-full pt-10 text-slate-400">
                <Bell className="w-8 h-8 opacity-25 mb-2" />
                <p className="text-xs">No simulated push alerts yet.</p>
                {activeUser.role === "board_member" && (
                  <button
                    onClick={triggerNotificationTest}
                    className="text-xs text-blue-600 hover:underline font-semibold mt-2"
                  >
                    Click &quot;Test Push Alert&quot; above to trigger
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Latest AI Behavioral Analysis Summary */}
        <div className="bg-slate-50 border border-slate-100 p-5 rounded-xl shadow-sm lg:col-span-7 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-600" />
                AI Security Trends
              </span>
              <span className="text-[10px] text-slate-400">Last Evaluated</span>
            </div>

            {logs.length > 0 && logs[0].analysis ? (
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-950 flex items-center gap-1.5 capitalize">
                    {logs[0].analysis.summary}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Evaluated from logs submitted by <strong>{logs[0].submittedBy}</strong>
                  </p>
                </div>

                <div className="bg-white border border-slate-100 p-3.5 rounded-lg space-y-2">
                  <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Cognitive Behavioral Analysis</p>
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    &quot;{logs[0].analysis.behavioralAnalysis}&quot;
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-white border border-slate-100 rounded-lg">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Physical Recommendation</p>
                    <p className="text-xs text-slate-700 leading-normal mt-1 font-medium line-clamp-2">
                      {logs[0].analysis.securityRecommendations}
                    </p>
                  </div>
                  <div className="p-3 bg-white border border-slate-100 rounded-lg">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Social Fabric Repair</p>
                    <p className="text-xs text-slate-700 leading-normal mt-1 font-medium line-clamp-2">
                      {logs[0].analysis.socialFabricImpact}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-full py-10 text-slate-400">
                <Sparkles className="w-8 h-8 opacity-25 mb-2 text-blue-500" />
                <p className="text-xs">No cognitive behavioral logs analyzed yet.</p>
                <button
                  onClick={() => onNavigate("security")}
                  className="text-xs text-blue-600 hover:underline font-semibold mt-2"
                >
                  Go to AI Security Analyst to submit a log
                </button>
              </div>
            )}
          </div>

          {logs.length > 0 && (
            <button
              onClick={() => onNavigate("security")}
              className="text-xs text-slate-700 hover:text-slate-900 font-semibold border-t border-slate-200/50 pt-3 flex items-center justify-center gap-1 mt-4 hover:underline"
              id="view-all-security-logs-btn"
            >
              View Full Behavioral Safety Archives →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
