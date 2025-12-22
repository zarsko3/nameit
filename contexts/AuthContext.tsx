import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../firebase';
import { getUserProfile, UserProfile } from '../services/firestoreService';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null; // User profile including hasCompletedOnboarding
  loading: boolean;
  initialized: boolean; // New: tracks if auth state has been checked
  signUp: (email: string, password: string, displayName: string) => Promise<User>;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  logout: () => Promise<void>;
}

const googleProvider = new GoogleAuthProvider();

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Sign up with email and password
  const signUp = async (email: string, password: string, displayName: string): Promise<User> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update the user's display name
      await updateProfile(userCredential.user, { displayName });
      return userCredential.user;
    } finally {
      setLoading(false);
    }
  };

  // Login with email and password
  const login = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } finally {
      setLoading(false);
    }
  };

  // Login with Google
  const loginWithGoogle = async (): Promise<User> => {
    setLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      return userCredential.user;
    } finally {
      setLoading(false);
    }
  };

  // Logout - only way to clear the session
  const logout = async (): Promise<void> => {
    console.log('🚪 User logging out...');
    await signOut(auth);
    setCurrentUser(null);
    console.log('✅ Logout successful');
  };

  // Auth State Observer - listens for persistent session
  // This fires immediately on app load if user was previously logged in
  // CRITICAL: We must wait for BOTH Firebase auth AND user profile (including hasCompletedOnboarding) before setting loading to false
  useEffect(() => {
    console.log('🔐 Setting up auth state observer...');
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('✅ User session restored:', user.email);
        // Fetch user profile to get hasCompletedOnboarding
        try {
          const profile = await getUserProfile(user.uid);
          console.log('📋 User profile loaded:', profile ? 'exists' : 'new user');
          setUserProfile(profile);
        } catch (error) {
          console.error('❌ Failed to load user profile:', error);
          setUserProfile(null);
        }
      } else {
        console.log('👤 No active session');
        setUserProfile(null);
      }
      setCurrentUser(user);
      setLoading(false);
      setInitialized(true);
    });

    return () => {
      console.log('🔓 Cleaning up auth observer');
      unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    initialized,
    signUp,
    login,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

