import { User } from "firebase/auth";
import { 
  doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs 
} from "firebase/firestore";
import { db } from "../firebase";
import { UserProfile } from "../types";

/**
 * Synchronizes a Firebase Authentication user with Firestore.
 * 
 * If the user's email matches a seeded demo account (e.g. John Smith or Marcus Aurelius),
 * this automatically links and migrates their seeded dues, violations, bookings,
 * and ACC permits to their real Firebase Auth UID.
 */
export async function syncAndLinkUserProfile(
  firebaseUser: User, 
  profileOverrides?: Partial<UserProfile>
): Promise<UserProfile> {
  const userDocRef = doc(db, "users", firebaseUser.uid);
  const snap = await getDoc(userDocRef);

  if (snap.exists()) {
    const existing = snap.data() as UserProfile;
    if (profileOverrides && Object.keys(profileOverrides).length > 0) {
      const merged: UserProfile = { ...existing, ...profileOverrides, id: firebaseUser.uid };
      await setDoc(userDocRef, merged, { merge: true });
      return merged;
    }
    return existing;
  }

  // Not found by firebaseUser.uid: Check if this user was seeded by email
  const userEmail = (firebaseUser.email || profileOverrides?.email || "").toLowerCase().trim();
  let seededProfile: UserProfile | null = null;
  let seededDocId: string | null = null;

  if (userEmail) {
    try {
      const q = query(collection(db, "users"), where("email", "==", userEmail));
      const querySnap = await getDocs(q);
      querySnap.forEach((d) => {
        if (d.id !== firebaseUser.uid && !seededProfile) {
          seededDocId = d.id;
          seededProfile = d.data() as UserProfile;
        }
      });
    } catch (queryErr) {
      console.warn("Could not query seeded users by email:", queryErr);
    }
  }

  if (seededProfile && seededDocId) {
    const oldId = seededDocId;
    const newUid = firebaseUser.uid;

    const newProfile: UserProfile = {
      ...seededProfile,
      id: newUid,
      name: profileOverrides?.name || seededProfile.name || firebaseUser.displayName || (userEmail ? userEmail.split("@")[0] : "Member"),
      email: userEmail,
      role: profileOverrides?.role || seededProfile.role || "resident",
      address: profileOverrides?.address || seededProfile.address || "Community Lot",
      phone: profileOverrides?.phone || seededProfile.phone || "(555) 123-4567",
      status: "active",
      balance: seededProfile.balance ?? (profileOverrides?.role === "board_member" ? 0 : 250)
    };

    await setDoc(userDocRef, newProfile);

    // Re-link all related collections from oldId to newUid
    try {
      // 1. Dues
      const duesSnap = await getDocs(query(collection(db, "dues"), where("residentId", "==", oldId)));
      for (const d of duesSnap.docs) {
        await updateDoc(doc(db, "dues", d.id), { residentId: newUid });
      }

      // 2. Violations
      const violSnap = await getDocs(query(collection(db, "violations"), where("residentId", "==", oldId)));
      for (const v of violSnap.docs) {
        await updateDoc(doc(db, "violations", v.id), { residentId: newUid });
      }

      // 3. ACC Requests
      const accSnap = await getDocs(query(collection(db, "accRequests"), where("residentId", "==", oldId)));
      for (const a of accSnap.docs) {
        await updateDoc(doc(db, "accRequests", a.id), { residentId: newUid });
      }

      // 4. Work Orders
      const woSnap = await getDocs(query(collection(db, "workOrders"), where("reportedBy", "==", oldId)));
      for (const w of woSnap.docs) {
        await updateDoc(doc(db, "workOrders", w.id), { reportedBy: newUid });
      }

      // 5. Amenity Bookings
      const bookSnap = await getDocs(query(collection(db, "amenityBookings"), where("residentId", "==", oldId)));
      for (const b of bookSnap.docs) {
        await updateDoc(doc(db, "amenityBookings", b.id), { residentId: newUid });
      }

      // 6. Message Threads & Secure Messages
      const threadDoc = await getDoc(doc(db, "messageThreads", oldId));
      if (threadDoc.exists()) {
        await setDoc(doc(db, "messageThreads", newUid), {
          ...threadDoc.data(),
          id: newUid,
          residentId: newUid
        });
      }
      const msgSnap = await getDocs(query(collection(db, "secureMessages"), where("threadId", "==", oldId)));
      for (const m of msgSnap.docs) {
        const data = m.data();
        await updateDoc(doc(db, "secureMessages", m.id), {
          threadId: newUid,
          ...(data.senderId === oldId ? { senderId: newUid } : {})
        });
      }

      // Mark the old seeded user document as migrated so it doesn't duplicate in directories
      await updateDoc(doc(db, "users", oldId), {
        status: "suspended",
        email: `migrated_${oldId}@internal.migrated`
      });
    } catch (relinkErr) {
      console.warn("Notice: some seeded documents could not be re-linked:", relinkErr);
    }

    return newProfile;
  }

  // Purely new user registration with no prior seeded record
  const defaultRole = profileOverrides?.role || (userEmail.includes("board") ? "board_member" : "resident");
  const freshProfile: UserProfile = {
    id: firebaseUser.uid,
    name: profileOverrides?.name || firebaseUser.displayName || (userEmail ? userEmail.split("@")[0] : "Resident Member"),
    email: userEmail,
    role: defaultRole,
    address: profileOverrides?.address || "Community Lot",
    phone: profileOverrides?.phone || "(555) 123-4567",
    joinedDate: new Date().toISOString(),
    status: "active",
    balance: defaultRole === "board_member" ? 0 : 250
  };

  await setDoc(userDocRef, freshProfile);

  // If this is a new resident, seed an initial assessment due so Google Play reviewers and new users can test payments
  if (defaultRole === "resident") {
    try {
      const sampleDueId = `due_${firebaseUser.uid.slice(0, 10)}`;
      await setDoc(doc(db, "dues", sampleDueId), {
        id: sampleDueId,
        residentId: firebaseUser.uid,
        residentName: freshProfile.name,
        residentAddress: freshProfile.address,
        amount: 250,
        dueDate: "2026-10-15",
        status: "unpaid",
        description: "Q3 2026 HOA Assessment Dues"
      });
    } catch (dueErr) {
      console.warn("Could not pre-seed initial due for reviewer:", dueErr);
    }
  }

  return freshProfile;
}
