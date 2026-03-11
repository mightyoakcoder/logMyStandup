import { createContext, useContext } from "react";
// import { onAuthStateChanged, signOut } from "firebase/auth";
// import { auth } from "../firebase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Auth disabled — stub provider
  const value = { user: null, token: null, logout: () => {}, loading: false };
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// useEffect(() => {
//   const unsub = onAuthStateChanged(auth, async (u) => {
//     setUser(u ?? null);
//     if (u) {
//       const t = await u.getIdToken();
//       setToken(t);
//     } else {
//       setToken(null);
//     }
//   });
//   return unsub;
// }, []);

// useEffect(() => {
//   if (!user) return;
//   const interval = setInterval(async () => {
//     const t = await user.getIdToken(true);
//     setToken(t);
//   }, 55 * 60 * 1000);
//   return () => clearInterval(interval);
// }, [user]);

// async function logout() {
//   await signOut(auth);
// }

export function useAuth() {
  return useContext(AuthContext);
}
