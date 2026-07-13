import React, { useState, useEffect } from "react";
import { AmenityBooking, UserProfile } from "../types";
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { 
  Calendar, Check, X, CalendarCheck, Clock, ShieldAlert, PlusCircle, 
  Trash2, Home, Compass, Trees, Award, Info
} from "lucide-react";

interface AmenityBookingManagerProps {
  activeUser: UserProfile;
}

const AMENITIES = [
  { name: "Clubhouse", icon: Home, capacity: 50, location: "Main Office Complex", description: "Fully furnished indoor space with kitchen, dining area, fireplace, and lounge seats. Perfect for family parties and meetings." },
  { name: "Community Pavilion", icon: Trees, capacity: 40, location: "North Park", description: "Outdoor shaded park picnic area with wooden tables, BBQ grills, and garbage deposits. Great for warm weather barbecues." },
  { name: "Pool Lounge", icon: Compass, capacity: 25, location: "Center Pool Deck", description: "Semi-shaded private section on the pool deck with luxury deck chairs and sun canopies. Subject to seasonal pool rules." },
  { name: "Tennis Court", icon: Award, capacity: 4, location: "South Sports Courts", description: "Enclosed hard-court for tennis or pickleball matches. Equipped with net, benches, and automated floodlights." }
] as const;

const TIME_SLOTS = [
  "8:00 AM - 11:00 AM (Morning)",
  "12:00 PM - 3:00 PM (Afternoon)",
  "4:00 PM - 7:00 PM (Late Afternoon)",
  "8:00 PM - 11:00 PM (Evening)"
];

export default function AmenityBookingManager({ activeUser }: AmenityBookingManagerProps) {
  const [bookings, setBookings] = useState<AmenityBooking[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedAmenity, setSelectedAmenity] = useState<AmenityBooking["amenityName"]>("Clubhouse");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingSlot, setBookingSlot] = useState(TIME_SLOTS[0]);
  const [bookingNotes, setBookingNotes] = useState("");
  
  // Notification Toast State
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch bookings in real-time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "amenityBookings"), (snap) => {
      const data: AmenityBooking[] = [];
      snap.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as AmenityBooking);
      });
      // Sort bookings by date and time
      data.sort((a, b) => a.bookingDate.localeCompare(b.bookingDate));
      setBookings(data);
    });
    return unsub;
  }, []);

  // Filter bookings (Residents see all bookings for availability, but can only manage their own!)
  const myBookings = bookings.filter((b) => b.residentId === activeUser.id);
  const otherBookings = bookings.filter((b) => b.residentId !== activeUser.id);

  // Submit Booking request
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDate || !bookingSlot) return;

    // Check for double booking conflicts in DB
    const isConflict = bookings.some(
      (b) => 
        b.amenityName === selectedAmenity && 
        b.bookingDate === bookingDate && 
        b.timeSlot === bookingSlot &&
        b.status === "confirmed"
    );

    if (isConflict) {
      setErrorMessage(`The ${selectedAmenity} is already reserved for ${bookingDate} during the ${bookingSlot} slot. Please select a different date or time.`);
      setTimeout(() => setErrorMessage(null), 6000);
      return;
    }

    try {
      setLoading(true);
      const newBooking: Omit<AmenityBooking, "id"> = {
        residentId: activeUser.id,
        residentName: activeUser.name,
        amenityName: selectedAmenity,
        bookingDate,
        timeSlot: bookingSlot,
        status: "confirmed",
        notes: bookingNotes.trim() || undefined
      };

      await addDoc(collection(db, "amenityBookings"), newBooking);
      
      setBookingNotes("");
      setBookingDate("");
      setShowAddForm(false);
    } catch (err) {
      console.error("Error creating amenity reservation:", err);
    } finally {
      setLoading(false);
    }
  };

  // Cancel reservation
  const handleCancelBooking = async (id: string) => {
    try {
      setLoading(true);
      const docRef = doc(db, "amenityBookings", id);
      // For auditing, we can just delete the document or change status to cancelled
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Error cancelling booking:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" id="amenity-bookings-view">
      {/* Toast Notification Banner */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-950 px-4 py-3 rounded-xl flex items-start gap-2.5 shadow-sm animate-fade-in" id="booking-conflict-banner">
          <ShieldAlert className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
          <div className="text-xs">
            <p className="font-bold">Reservation Conflict Identified</p>
            <p className="text-rose-700/90 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Community Amenity Reservations</h2>
          <p className="text-xs text-gray-500">
            Book neighborhood assets and check real-time schedule calendars to avoid scheduling conflicts.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors duration-150 shadow-xs"
          id="make-reservation-btn"
        >
          <CalendarCheck className="w-4 h-4" />
          Reserve an Amenity
        </button>
      </div>

      {/* Amenity Directory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="amenities-directory">
        {AMENITIES.map((item) => {
          const IconComp = item.icon;
          const currentBookings = bookings.filter((b) => b.amenityName === item.name && b.status === "confirmed").length;

          return (
            <div key={item.name} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <IconComp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 flex justify-between items-center">
                    {item.name}
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">Cap: {item.capacity}</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">{item.location}</p>
                  <p className="text-[11px] text-slate-500 leading-normal mt-1.5 font-medium">{item.description}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                <span>Active Bookings</span>
                <span className="text-blue-600 font-black">{currentBookings} reserved</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Reservation Form */}
      {showAddForm && (
        <form onSubmit={handleCreateBooking} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4 animate-slide-down" id="booking-form">
          <h3 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-1.5">
            <PlusCircle className="w-4 h-4 text-blue-600" />
            Book a Facility
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Select Facility</label>
              <select
                value={selectedAmenity}
                onChange={(e) => setSelectedAmenity(e.target.value as AmenityBooking["amenityName"])}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold"
              >
                <option value="Clubhouse">Clubhouse Assembly Room</option>
                <option value="Community Pavilion">North Picnic Pavilion</option>
                <option value="Pool Lounge">East Pool Lounge Space</option>
                <option value="Tennis Court">South Sports Tennis Court</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Booking Calendar Date</label>
              <input
                type="date"
                required
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Time Slot Duration</label>
              <select
                value={bookingSlot}
                onChange={(e) => setBookingSlot(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold"
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1 md:col-span-3">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Booking Purpose / Host Details</label>
              <input
                type="text"
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                placeholder="e.g. Host family gathering of 15 members, Private tennis training slot..."
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-600 text-xs font-semibold hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs"
            >
              {loading ? "Locking reservation..." : "Confirm Secure Booking"}
            </button>
          </div>
        </form>
      )}

      {/* Bookings Lists Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="bookings-listings-grid">
        {/* Resident Bookings Column */}
        <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-blue-600" />
                My Reservations
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Manage your booked events</p>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
              {myBookings.length} Active
            </span>
          </div>

          <div className="space-y-3 min-h-[220px]">
            {myBookings.length > 0 ? (
              myBookings.map((b) => (
                <div key={b.id} className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1 flex-1">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      📅 {b.amenityName}
                    </p>
                    <p className="text-slate-500 font-semibold text-[10px] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {b.bookingDate} • {b.timeSlot.split(" (")[0]}
                    </p>
                    {b.notes && (
                      <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100 font-medium leading-relaxed italic mt-1">&quot;{b.notes}&quot;</p>
                    )}
                  </div>

                  <button
                    onClick={() => handleCancelBooking(b.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                    title="Cancel Booking"
                    id={`cancel-booking-btn-${b.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-full pt-10 text-slate-400">
                <Calendar className="w-8 h-8 opacity-25 mb-2 text-blue-500" />
                <p className="text-xs">You have no active amenity bookings.</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="text-xs text-blue-600 hover:underline font-semibold mt-2"
                >
                  Click &quot;Reserve an Amenity&quot; to make one.
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Master Community Schedule Schedule List */}
        <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <CalendarCheck className="w-4 h-4 text-slate-800" />
                Master Community Reservation Schedule
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Real-time occupancy planner</p>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
              {bookings.length} Total Registered
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1.5">
            {bookings.length > 0 ? (
              bookings.map((b) => (
                <div
                  key={b.id}
                  className={`border p-3 rounded-xl flex items-center justify-between gap-3 text-xs ${
                    b.residentId === activeUser.id 
                      ? "border-blue-200 bg-blue-50/20" 
                      : "border-slate-100 bg-white"
                  }`}
                  id={`schedule-row-${b.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm">
                      🏛️
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                        {b.amenityName}
                        {b.residentId === activeUser.id && (
                          <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-black uppercase">My Slot</span>
                        )}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-bold">
                        Reserved for <strong className="text-slate-700 font-extrabold">{b.bookingDate}</strong> during {b.timeSlot}
                      </p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Host: <strong>{b.residentName}</strong></p>
                    </div>
                  </div>

                  {/* Board Override controls */}
                  {activeUser.role === "board_member" && (
                    <button
                      onClick={() => handleCancelBooking(b.id)}
                      className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-2.5 py-1 rounded-lg border border-rose-100 flex items-center gap-1 ml-auto"
                      title="Board Override: Cancel Booking"
                    >
                      <X className="w-3.5 h-3.5" />
                      Override
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-full py-12 text-slate-400">
                <Info className="w-8 h-8 opacity-25 mb-2 text-slate-400" />
                <p className="text-xs">No reservations scheduled on the master calendar yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
