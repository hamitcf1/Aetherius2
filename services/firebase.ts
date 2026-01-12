/// <reference types="vite/client" />

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User,
  sendEmailVerification,
  sendPasswordResetEmail,
  applyActionCode,
  verifyPasswordResetCode as firebaseVerifyPasswordResetCode,
  confirmPasswordReset as firebaseConfirmPasswordReset,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';

// Firebase konfigürasyonunuzu buraya yapıştırın
// https://console.firebase.google.com adresinden alın
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBizX0xLl7WP2ZVARs2U60ySTRJOQrkebo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "rugged-timer-384206.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://rugged-timer-384206-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "rugged-timer-384206",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "rugged-timer-384206.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "597660147755",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:597660147755:web:697953d3a398b2cbbcca6e",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Kimlik Doğrulama Fonksiyonları
export const registerUser = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const loginUser = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const logoutUser = () => {
  return signOut(auth);
};

export const loginAnonymously = () => {
  return signInAnonymously(auth);
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Email Verification Functions
export const sendVerificationEmail = async (user: User) => {
  if (!user.emailVerified) {
    try {
      await sendEmailVerification(user, {
        url: `${window.location.origin}/verify-email`,
        handleCodeInApp: true,
      });
      return { success: true };
    } catch (error) {
      console.error("Error sending verification email:", error);
      return { success: false, error: (error as FirebaseError).message };
    }
  }
  return { success: false, error: "Email already verified" };
};

export const verifyEmail = async (oobCode: string) => {
  try {
    await applyActionCode(auth, oobCode);
    return { success: true };
  } catch (error) {
    console.error("Error verifying email:", error);
    return { success: false, error: (error as FirebaseError).message };
  }
};

// Password Reset Functions
export const sendPasswordReset = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email, {
      url: `${window.location.origin}/login`,
      handleCodeInApp: false,
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return { success: false, error: (error as FirebaseError).message };
  }
};

export const verifyPasswordResetCodeFn = async (oobCode: string) => {
  try {
    const email = await firebaseVerifyPasswordResetCode(auth, oobCode);
    return { success: true, email };
  } catch (error) {
    console.error("Error verifying password reset code:", error);
    return { success: false, error: (error as FirebaseError).message };
  }
};

export const confirmPasswordResetFn = async (oobCode: string, newPassword: string) => {
  try {
    await firebaseConfirmPasswordReset(auth, oobCode, newPassword);
    return { success: true };
  } catch (error) {
    console.error("Error confirming password reset:", error);
    return { success: false, error: (error as FirebaseError).message };
  }
};

// User Profile Management
export const updateUserProfile = async (user: User, displayName: string, photoURL?: string) => {
  try {
    await updateProfile(user, { displayName, photoURL });
    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: (error as FirebaseError).message };
  }
};

export const updateUserEmail = async (user: User, newEmail: string, password: string) => {
  try {
    const credential = EmailAuthProvider.credential(user.email || '', password);
    await reauthenticateWithCredential(user, credential);
    await updateEmail(user, newEmail);
    return { success: true };
  } catch (error) {
    console.error("Error updating email:", error);
    return { success: false, error: (error as FirebaseError).message };
  }
};

export const updateUserPassword = async (user: User, currentPassword: string, newPassword: string) => {
  try {
    const credential = EmailAuthProvider.credential(user.email || '', currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
    return { success: true };
  } catch (error) {
    console.error("Error updating password:", error);
    return { success: false, error: (error as FirebaseError).message };
  }
};

// Security Rules Helper
export const getUserByEmail = async (email: string) => {
  console.warn('getUserByEmail: Legacy Realtime DB function. Use Firestore queries instead.');
  return { success: false, error: "Not implemented" };
};