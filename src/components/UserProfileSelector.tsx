import { UserProfile } from "../types";
import { MOCK_USERS } from "../lib/seeder";
import { User, Shield, Check } from "lucide-react";

interface UserProfileSelectorProps {
  activeUser: UserProfile;
  setActiveUser: (user: UserProfile) => void;
}

export default function UserProfileSelector({ activeUser, setActiveUser }: UserProfileSelectorProps) {
  return (
    <div className="relative group inline-block text-left" id="profile-selector-container">
      <div className="flex items-center gap-3 bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-xs cursor-pointer hover:bg-gray-50 transition-colors duration-150">
        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 relative">
          {activeUser.role === "board_member" ? (
             <Shield className="w-5 h-5 text-blue-600" id="shield-icon" />
          ) : (
            <User className="w-5 h-5 text-gray-600" id="user-icon" />
          )}
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold text-slate-900 leading-tight flex items-center gap-1.5">
            {activeUser.name}
          </p>
          <span className="text-xs text-slate-500 font-medium capitalize flex items-center gap-1">
            {activeUser.role === "board_member" ? "Board Member" : "Resident Profile"} • {activeUser.address}
          </span>
        </div>
      </div>

      <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-lg ring-1 ring-black/5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Select Resident Session</p>
          <p className="text-xs text-gray-500 mt-0.5">Simulate multi-tenant roles</p>
        </div>
        <div className="py-1">
          {MOCK_USERS.map((user) => (
            <button
              key={user.id}
              onClick={() => setActiveUser(user)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-slate-50 transition-colors duration-150 ${
                activeUser.id === user.id ? "bg-slate-50 font-medium text-blue-600" : "text-gray-700"
              }`}
              id={`switch-user-${user.id}`}
            >
              <div className="flex flex-col">
                <span className="font-semibold flex items-center gap-1">
                  {user.name}
                  {user.role === "board_member" && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-bold">ACC</span>}
                </span>
                <span className="text-xs text-gray-500">{user.address}</span>
              </div>
              {activeUser.id === user.id && <Check className="w-4 h-4 text-blue-600" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
