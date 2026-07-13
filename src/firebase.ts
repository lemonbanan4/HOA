import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";

// Read configuration from the auto-provisioned configuration parameters
const firebaseConfig = {
  apiKey: "AIzaSyB9g1oJycjRV6-zeIr2TB3inlKyRK6TCIc",
  authDomain: "hoa-tracker-e3316.firebaseapp.com",
  projectId: "hoa-tracker-e3316",
  storageBucket: "hoa-tracker-e3316.firebasestorage.app",
  messagingSenderId: "350407592063",
  appId: "1:350407592063:web:dfc08422ac336fc6a9974a",
  firestoreDatabaseId: "ai-studio-hoatracker-7ce99915-1128-4315-8a0a-7662d69d8678"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the custom database ID provisioned by the AI Studio environment
export const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

