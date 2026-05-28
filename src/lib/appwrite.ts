/**
 * Appwrite client configuration for browser-based auth.
 * 
 * Required .env.local values:
 * NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
 * NEXT_PUBLIC_APPWRITE_PROJECT_ID=6a17fcce00126cada71f
 *
 * Do not expose Appwrite secret keys on the frontend. For server-side Appwrite operations,
 * use a private key such as APPWRITE_API_KEY in a server-only environment.
 */
import { Account, Client } from "appwrite";

const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

function buildAppwriteClient() {
  if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID) {
    throw new Error(
      "Missing Appwrite configuration. Set NEXT_PUBLIC_APPWRITE_ENDPOINT and NEXT_PUBLIC_APPWRITE_PROJECT_ID in .env.local."
    );
  }

  return new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);
}

const appwriteClient = typeof window !== "undefined" ? buildAppwriteClient() : undefined;
export const account = typeof window !== "undefined" && appwriteClient ? new Account(appwriteClient) : undefined;

export enum OAuthProvider {
  Google = "google",
}

export async function logout(): Promise<void> {
  if (!account) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return;
  }

  try {
    await account.deleteSession("current");
  } catch (error) {
    console.error("Appwrite logout failed:", error);
  } finally {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }
}
