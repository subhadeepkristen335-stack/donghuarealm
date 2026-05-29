import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// Your web app's Firebase configuration
// It's recommended to load these from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize App Check
// Make sure to replace 'YOUR_RECAPTCHA_V3_SITE_KEY' with your actual public key
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6LeD1AItAAAAAJppvPJTxOHGOG6r6_HZB40BfK4n'),

  // Set to true to allow auto-refresh of App Check tokens
  isTokenAutoRefreshEnabled: true
});

/*
* For local development on http://localhost, you must use a debug token.
* 1. In your browser's developer console, you will see a message like:
*    "App Check debug token: <DEBUG_TOKEN_HERE>"
* 2. Copy that token.
* 3. In the same console, set this global variable:
*    self.FIREBASE_APPCHECK_DEBUG_TOKEN = "<PASTE_YOUR_TOKEN_HERE>";
* 4. Refresh the page. The App Check SDK will now use the debug token.
*/

const db = getFirestore(app);
const auth = getAuth(app);
const firebaseReady = true;

export { db, auth, firebaseReady, appCheck };