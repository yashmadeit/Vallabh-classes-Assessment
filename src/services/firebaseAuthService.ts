import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleAuthProvider } from './firebase';
import { UserProfile, UserRole } from '../types/assessment';

const BOOTSTRAP_ADMIN_EMAILS = [
  'nikhilprasad9797@gmail.com',
  'admin@vallabhclasses.com',
];

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  error: string | null;
}

class FirebaseAuthService {
  private currentAuthState: AuthState = {
    user: null,
    profile: null,
    role: null,
    isLoading: true,
    error: null,
  };

  private listeners: Array<(state: AuthState) => void> = [];
  private isSigningIn = false;

  constructor() {
    this.initAuthListener();
  }

  private initAuthListener() {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        this.currentAuthState = {
          user: null,
          profile: null,
          role: null,
          isLoading: false,
          error: null,
        };
        this.notifyListeners();
        return;
      }

      try {
        const isBootstrapAdmin =
          user.email && BOOTSTRAP_ADMIN_EMAILS.includes(user.email.toLowerCase());

        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        let profile: UserProfile;
        let role: UserRole = isBootstrapAdmin ? 'admin' : 'faculty';

        if (userDocSnap.exists()) {
          const data = userDocSnap.data() as UserProfile;
          role = isBootstrapAdmin ? 'admin' : data.role || 'faculty';
          profile = {
            ...data,
            lastLoginAt: new Date().toISOString(),
            role,
          };
          // Update lastLoginAt
          await setDoc(userDocRef, profile, { merge: true });
        } else {
          // New User Registration
          profile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || (role === 'admin' ? 'Administrator' : 'Hemang Shah Sir'),
            role,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          };
          await setDoc(userDocRef, profile);
        }

        // If admin, ensure admin doc exists for security rules check
        if (role === 'admin') {
          const adminDocRef = doc(db, 'admins', user.uid);
          await setDoc(
            adminDocRef,
            { uid: user.uid, email: user.email, role: 'admin' },
            { merge: true }
          );
        }

        this.currentAuthState = {
          user,
          profile,
          role,
          isLoading: false,
          error: null,
        };
      } catch (err) {
        console.warn('Error resolving user profile in Firestore:', err);
        // Fallback to basic auth state if firestore document read fails
        const fallbackRole: UserRole =
          user.email && BOOTSTRAP_ADMIN_EMAILS.includes(user.email.toLowerCase())
            ? 'admin'
            : 'faculty';

        this.currentAuthState = {
          user,
          profile: {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'Authorized Faculty',
            role: fallbackRole,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          },
          role: fallbackRole,
          isLoading: false,
          error: null,
        };
      }

      this.notifyListeners();
    });
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener({ ...this.currentAuthState }));
  }

  public subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    listener({ ...this.currentAuthState });
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public getAuthState(): AuthState {
    return { ...this.currentAuthState };
  }

  public async signInWithGoogle(): Promise<User | null> {
    if (this.isSigningIn) {
      return null;
    }
    this.isSigningIn = true;
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      return result.user;
    } catch (error: any) {
      const errorCode = error?.code || '';
      const errorMessage = error?.message || (typeof error === 'string' ? error : '');

      // Common non-fatal user cancellation/dismissal codes in Firebase Auth & browser popup environments
      if (
        errorCode === 'auth/popup-closed-by-user' ||
        errorCode === 'auth/cancelled-popup-request' ||
        errorCode === 'auth/popup-blocked' ||
        errorMessage.includes('Pending promise was never set') ||
        errorMessage.includes('popup-closed-by-user') ||
        errorMessage.includes('cancelled-popup-request')
      ) {
        // User closed or cancelled the popup; return null gracefully without throwing an unhandled exception
        return null;
      }

      console.warn('Firebase Auth sign-in encountered error:', error);
      throw error;
    } finally {
      this.isSigningIn = false;
    }
  }

  public async signOut(): Promise<void> {
    await signOut(auth);
  }

  public isAdmin(): boolean {
    return this.currentAuthState.role === 'admin';
  }

  public isFaculty(): boolean {
    return this.currentAuthState.role === 'faculty' || this.currentAuthState.role === 'admin';
  }
}

export const firebaseAuthService = new FirebaseAuthService();
