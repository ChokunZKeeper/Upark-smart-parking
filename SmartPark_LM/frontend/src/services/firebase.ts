import { initializeApp, getApps, getApp } from "firebase/app"
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  type User,
} from "firebase/auth"

// Firebase Console > Project settings > Your apps (web config is not a secret).
const firebaseConfig = {
  apiKey: "AIzaSyBhxTC2apHTbUxgBIBiBKmaoJmYAW-_kYU",
  authDomain: "upark-59a7d.firebaseapp.com",
  projectId: "upark-59a7d",
  storageBucket: "upark-59a7d.firebasestorage.app",
  messagingSenderId: "797213955613",
  appId: "1:797213955613:web:21987536f985aa832918f4",
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
export const auth = getAuth(app)

export type SocialProviderName = "Google" | "Facebook"

function createProvider(name: SocialProviderName) {
  if (name === "Google") {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: "select_account" })
    return provider
  }
  const provider = new FacebookAuthProvider()
  provider.addScope("email")
  return provider
}

// Opens the provider's popup and resolves with the signed-in Firebase user.
export async function signInWithSocial(name: SocialProviderName): Promise<User> {
  const result = await signInWithPopup(auth, createProvider(name))
  return result.user
}
