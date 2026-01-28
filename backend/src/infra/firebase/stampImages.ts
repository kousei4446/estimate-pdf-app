import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

type StampImages = {
  stamp?: string;
  staff?: string;
  creator?: string;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
let cached: { fetchedAt: number; data: StampImages } | null = null;

function getFirestoreIfConfigured() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) return undefined;

  if (!getApps().length) {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    });
  }

  return getFirestore();
}

export async function getStampImagesFromFirestore(): Promise<StampImages | undefined> {
  const db = getFirestoreIfConfigured();
  if (!db) return undefined;

  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  const collection = process.env.FIRESTORE_STAMP_COLLECTION || "stamp_img";
  const field = process.env.FIRESTORE_STAMP_FIELD || "url";

  const stampRef = db.collection(collection).doc("DEFAULT_STAMP_DATA_URL");
  const staffRef = db.collection(collection).doc("DEFAULT_STAFF_STAMP_DATA_URL");
  const creatorRef = db.collection(collection).doc("DEFAULT_CREATOR_STAMP_DATA_URL");

  try {
    const [stampSnap, staffSnap, creatorSnap] = await db.getAll(
      stampRef,
      staffRef,
      creatorRef
    );

    const data: StampImages = {
      stamp: stampSnap.exists ? (stampSnap.get(field) as string | undefined) : undefined,
      staff: staffSnap.exists ? (staffSnap.get(field) as string | undefined) : undefined,
      creator: creatorSnap.exists ? (creatorSnap.get(field) as string | undefined) : undefined,
    };

    cached = { fetchedAt: Date.now(), data };
    return data;
  } catch (error) {
    console.error("Failed to fetch stamp images from Firestore:", error);
    return undefined;
  }
}
