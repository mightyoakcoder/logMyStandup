import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Values come from .env — prefix VITE_ makes them available in the browser build
const firebaseConfig = {
  apiKey:    import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:  import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId:      import.meta.env.VITE_FIREBASE_APP_ID,
};

const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
