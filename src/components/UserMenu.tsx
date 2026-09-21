import { useState, useRef, useEffect } from "react";
import { UserProfile } from "../types";
import { User, Shield, LogOut, CheckCircle2, AlertCircle, Phone, MapPin, Mail, KeyRound, ChevronDown, FileText, ExternalLink } from "lucide-react";

interface UserMenuProps {
  activeUser: UserProfile;
  onOpenAuth: () => void;
  onSignOut: () => void;
}

export default function UserMenu({ activeUser, onOpenAuth, onSignOut }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isBoard = activeUser.role === "board_member";

  return (
    <div className="relative inline-block text-left" ref={menuRef} id="user-menu-container">
      {/* Profile Header Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-white border border-slate-200 px-3.5 py-2 rounded-2xl shadow-xs hover:border-slate-300 hover:shadow-sm transition-all text-left focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
        id="user-profile-menu-button"
        aria-expanded={isOpen}
      >
        <div className="relative">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
            isBoard ? "bg-blue-600 text-white shadow-xs" : "bg-slate-100 text-slate-700 border border-slate-200"
          }`}>
            {isBoard ? <Shield className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-slate-600" />}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
        </div>

        <div className="hidden sm:block">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-black text-slate-900 leading-tight tracking-tight">{activeUser.name}</p>
            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md tracking-wider ${
              isBoard ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"
            }`}>
              {isBoard ? "Board" : "Resident"}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 truncate max-w-[140px]">{activeUser.address}</p>
        </div>

        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Profile Dropdown Sheet */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-3xl shadow-xl ring-1 ring-slate-900/5 p-4 z-50 animate-fade-in"
          id="user-profile-dropdown"
        >
          {/* Top User Card */}
          <div className="pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                isBoard ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "bg-slate-100 text-slate-700"
              }`}>
                {isBoard ? <Shield className="w-6 h-6 text-white" /> : <User className="w-6 h-6 text-slate-700" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-slate-900 truncate">{activeUser.name}</h4>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    isBoard ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                  }`}>
                    {isBoard ? "Board Director" : "Resident"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                  <Mail className="w-3 h-3 shrink-0" />
                  {activeUser.email}
                </p>
              </div>
            </div>

            {/* Resident / Account details */}
            <div className="mt-3 bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs text-slate-600 border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Unit / Lot
                </span>
                <span className="font-bold text-slate-900">{activeUser.address}</span>
              </div>
              {activeUser.phone && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    Phone
                  </span>
                  <span className="font-semibold text-slate-700">{activeUser.phone}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                <span className="text-slate-500">Account Status</span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                  <CheckCircle2 className="w-3 h-3" />
                  Active Verified
                </span>
              </div>
              {typeof activeUser.balance === "number" && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Current Ledger Due</span>
                  <span className={`text-xs font-black ${activeUser.balance > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    ${activeUser.balance.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 space-y-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenAuth();
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
              id="btn-switch-account"
            >
              <span className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-slate-400" />
                Switch Account / Sign In As Another
              </span>
            </button>

            <a
              href="/privacy.html"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
              id="link-privacy-policy"
            >
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                Privacy Policy &amp; Legal
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onSignOut();
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              id="btn-user-signout"
            >
              <span className="flex items-center gap-2">
                <LogOut className="w-4 h-4 text-rose-500" />
                Sign Out
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
