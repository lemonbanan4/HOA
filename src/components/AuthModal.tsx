import React, { useState } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";
import { auth } from "../firebase";
import { UserProfile } from "../types";
import { syncAndLinkUserProfile } from "../lib/authSync";
import { 
  Shield, Mail, Lock, User, MapPin, Phone, ArrowRight, CheckCircle, 
  AlertCircle, Eye, EyeOff, Sparkles, X, FileText 
} from "lucide-react";

interface AuthModalProps {
  onSuccess: (user: UserProfile) => void;
  onClose?: () => void;
}

export default function AuthModal({ onSuccess, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"resident" | "board_member">("resident");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Quick Demo Accounts list
  const DEMO_PRESETS = [
    {
      name: "Marcus Aurelius",
      email: "marcus.board@hoa-tracker.com",
      role: "board_member" as const,
      address: "101 Emperor Way",
      phone: "(555) 123-4567"
    },
    {
      name: "John Smith",
      email: "john.smith@gmail.com",
      role: "resident" as const,
      address: "204 Pine Needles Lane",
      phone: "(555) 987-6543"
    },
    {
      name: "Clara Barton",
      email: "clara.barton@yahoo.com",
      role: "resident" as const,
      address: "305 Red Cross Circle",
      phone: "(555) 456-7890"
    }
  ];

  // Sign in or Sign up submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (isForgot) {
        if (!email.trim()) {
          throw new Error("Please enter your email address to reset password.");
        }
        await sendPasswordResetEmail(auth, email.trim());
        setSuccessMessage("Password reset email sent! Please check your inbox.");
        setLoading(false);
        return;
      }

      if (isSignUp) {
        if (!fullName.trim() || !address.trim() || !email.trim() || !password) {
          throw new Error("Please fill in all required fields.");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }

        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: fullName.trim() });

        const profile = await syncAndLinkUserProfile(cred.user, {
          name: fullName.trim(),
          email: email.trim(),
          role,
          address: address.trim(),
          phone: phone.trim() || "(555) 123-4567"
        });

        setLoading(false);
        onSuccess(profile);
      } else {
        if (!email.trim() || !password) {
          throw new Error("Please enter both email and password.");
        }
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        const profile = await syncAndLinkUserProfile(cred.user);
        setLoading(false);
        onSuccess(profile);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let msg = err.message || "Authentication failed.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        msg = "Invalid email or password. Please verify your credentials or create a new account.";
      } else if (err.code === "auth/email-already-in-use") {
        msg = "This email is already registered. Please sign in instead.";
      }
      setError(msg);
      setLoading(false);
    }
  };

  // Quick-Fill Demo Sign-in
  const handleQuickFill = async (preset: typeof DEMO_PRESETS[0]) => {
    setError(null);
    setLoading(true);
    const demoPassword = "Password123!";

    try {
      let cred;
      try {
        cred = await signInWithEmailAndPassword(auth, preset.email, demoPassword);
      } catch (signInErr: any) {
        // If demo user doesn't exist yet in Auth, create it on the fly
        if (signInErr.code === "auth/user-not-found" || signInErr.code === "auth/invalid-credential") {
          cred = await createUserWithEmailAndPassword(auth, preset.email, demoPassword);
          await updateProfile(cred.user, { displayName: preset.name });
        } else {
          throw signInErr;
        }
      }

      // Sync and link profile + seeded records
      const profile = await syncAndLinkUserProfile(cred.user, {
        name: preset.name,
        email: preset.email,
        role: preset.role,
        address: preset.address,
        phone: preset.phone
      });

      setLoading(false);
      onSuccess(profile);
    } catch (err: any) {
      console.error("Quick fill login error:", err);
      setError(`Quick-login error: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in" 
      id="auth-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col relative">
        {/* Header Branding */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 text-center relative border-b border-slate-800">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors"
              id="auth-modal-close-btn"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30 mb-3">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-wider text-white">BoardVault</h2>
          <p className="text-xs text-slate-400 font-medium mt-1">HOA Community Portal &amp; Governance Platform</p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[85vh] overflow-y-auto">
          {/* Tab Switcher */}
          {!isForgot && (
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setError(null); }}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                  !isSignUp ? "bg-white text-slate-950 shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
                id="tab-sign-in"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setError(null); }}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                  isSignUp ? "bg-white text-slate-950 shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
                id="tab-sign-up"
              >
                Register Resident
              </button>
            </div>
          )}

          {/* Feedback alerts */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-start gap-2.5 text-xs">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Eleanor Vance"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Lot / Property Address</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g. 502 Oak Lane"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(555) 000-0000"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Account Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as "resident" | "board_member")}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-medium"
                  >
                    <option value="resident">Homeowner / Resident</option>
                    <option value="board_member">HOA Board Member / ACC Officer</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="resident@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            {!isForgot && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Password</label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => setIsForgot(true)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              id="auth-submit-btn"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : isForgot ? (
                "Send Reset Email"
              ) : isSignUp ? (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {isForgot && (
              <button
                type="button"
                onClick={() => setIsForgot(false)}
                className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-700 py-1"
              >
                Back to Sign In
              </button>
            )}
          </form>

          {/* Privacy Policy Disclaimer for Compliance */}
          <div className="text-center pt-1">
            <p className="text-[11px] text-slate-400">
              By continuing, you agree to our{" "}
              <a 
                href="/privacy.html" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:text-blue-700 underline font-semibold inline-flex items-center gap-1"
              >
                <span>Privacy Policy</span>
                <FileText className="w-3 h-3" />
              </a>
              .
            </p>
          </div>

          {/* Quick Demo Credentials helper */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>One-Click Test Accounts</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {DEMO_PRESETS.map((p) => (
                <button
                  key={p.email}
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickFill(p)}
                  className="bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 p-2.5 rounded-xl text-left transition-all group"
                >
                  <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 leading-tight">{p.name}</p>
                  <span className="text-[10px] text-slate-500 font-medium block capitalize mt-0.5">
                    {p.role === "board_member" ? "Board President" : "Homeowner"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
