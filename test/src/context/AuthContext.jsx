import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase';

// Create context
const AuthContext = createContext();

// Export the context hook for easy usage
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Register function
  const register = async (name, email, password) => {
    try {
      setError('');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update the user profile with the name
      await updateProfile(userCredential.user, {
        displayName: name
      });
      return userCredential.user;
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message);
      throw error;
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      setError('');
      console.log('Attempting login with:', { email, password });
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful:', userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setError('');
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      setError(error.message);
      throw error;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    console.log('Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user);
      setCurrentUser(user);
      setLoading(false);
    });

    // Cleanup subscription
    return unsubscribe;
  }, []);

  // Create value object with all auth functions and state
  const value = {
    currentUser,
    login,
    register,
    logout,
    error,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
