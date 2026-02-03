// Importeer de functies die je nodig hebt van de SDK's
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Jouw web-app's Firebase configuratie
const firebaseConfig = {
  apiKey: "AIzaSyDxCYAfIidmglAcgAbfgSPOtZ2HRHDHo7Q",
  authDomain: "productivitiet2.firebaseapp.com",
  projectId: "productivitiet2",
  storageBucket: "productivitiet2.firebasestorage.app",
  messagingSenderId: "492077829856",
  appId: "1:492077829856:web:7ca946d2d325ecfc724a85",
  measurementId: "G-EFCMG6X53K"
};

// Initialiseer Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Referenties naar de HTML-elementen
const loadingScreen = document.getElementById('loading-screen');
const authContainer = document.getElementById('auth-container');

// Login form elements
const loginSection = document.getElementById('login-section');
const loginForm = document.getElementById('loginForm');
const loginEmailInput = document.getElementById('loginEmail');
const loginPasswordInput = document.getElementById('loginPassword');
const authErrorLogin = document.getElementById('authErrorLogin');

// Register form elements
const registerSection = document.getElementById('register-section');
const registerForm = document.getElementById('registerForm');
const registerDisplayNameInput = document.getElementById('registerDisplayName');
const registerEmailInput = document.getElementById('registerEmail');
const registerPasswordInput = document.getElementById('registerPassword');
const registerPasswordConfirmInput = document.getElementById('registerPasswordConfirm');
const authErrorRegister = document.getElementById('authErrorRegister');

// UI toggle links (tussen aanmelden en registreren)
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');

// App content elements
const appContent = document.getElementById('app-content');
const userNameSpanTopBar = document.getElementById('userName');
const userNameSpanMainContent = document.getElementById('userName-content');
const signOutButton = document.getElementById('signOutButton');

// Functie om de UI aan te passen op basis van de authenticatiestatus
function updateUI(user) {
    if (user) {
        // Gebruiker is aangemeld
        authContainer.style.display = 'none';
        appContent.style.display = 'block';

        const displayUserName = user.displayName || user.email || 'Gebruiker';
        if (userNameSpanTopBar) userNameSpanTopBar.textContent = displayUserName;
        if (userNameSpanMainContent) userNameSpanMainContent.textContent = displayUserName;
    } else {
        // Gebruiker is NIET aangemeld
        authContainer.style.display = 'flex';
        appContent.style.display = 'none';
        
        if (userNameSpanTopBar) userNameSpanTopBar.textContent = '';
        if (userNameSpanMainContent) userNameSpanMainContent.textContent = '';
    }
    
    if (loadingScreen) loadingScreen.style.display = 'none';
}

// Listener voor authenticatiestatusveranderingen
onAuthStateChanged(auth, (user) => {
    updateUI(user);
});

// Functie om een gebruiker aan te melden
async function signInUser(email, password) {
  authErrorLogin.textContent = '';
  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginForm.reset();
  } catch (error) {
    const errorCode = error.code;
    console.error("Fout bij aanmelden:", errorCode);
    // Foutmeldingen voor de gebruiker
    if (errorCode === 'auth/user-not-found' || errorCode === 'auth/invalid-credential') {
        authErrorLogin.textContent = 'Ongeldige e-mail of wachtwoord.';
    } else {
        authErrorLogin.textContent = 'Er is iets misgegaan. Probeer het opnieuw.';
    }
  }
}

// Functie om een nieuwe gebruiker te registreren
async function signUpUser(email, password, displayName = null) {
    authErrorRegister.textContent = '';
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        if (displayName) {
            await updateProfile(user, { displayName: displayName });
        }
        registerForm.reset();
    } catch (error) {
        console.error("Fout bij registreren:", error.code);
        authErrorRegister.textContent = 'Registratie mislukt. Gebruik een geldig e-mailadres.';
    }
}

// Functie om af te melden
async function signOutUser() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Fout bij afmelden:", error);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Wisselen tussen Login en Registratie schermen
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginSection.style.display = 'none';
            registerSection.style.display = 'flex';
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            registerSection.style.display = 'none';
            loginSection.style.display = 'flex';
        });
    }

    // Submit logica
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            signInUser(loginEmailInput.value, loginPasswordInput.value);
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (registerPasswordInput.value !== registerPasswordConfirmInput.value) {
                authErrorRegister.textContent = 'Wachtwoorden komen niet overeen.';
                return;
            }
            await signUpUser(registerEmailInput.value, registerPasswordInput.value, registerDisplayNameInput.value);
        });
    }

    if (signOutButton) {
        signOutButton.addEventListener('click', signOutUser);
    }

    // Toon laadscherm bij opstarten
    if (loadingScreen) loadingScreen.style.display = 'flex';
});
