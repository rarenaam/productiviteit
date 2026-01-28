// Importeer de functies die je nodig hebt van de SDK's
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
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
// const analytics = getAnalytics(app); // Initialiseer Analytics als je dat wilt gebruiken
const auth = getAuth(app);
const db = getFirestore(app);

console.log("Firebase is geïnitialiseerd!");

// Referenties naar de HTML-elementen
const authContainer = document.getElementById('auth-container');
const appContent = document.getElementById('app-content');
const userNameSpan = document.getElementById('userName');
const signOutButton = document.getElementById('signOutButton');
const loginForm = document.getElementById('loginForm');
const authErrorElement = document.getElementById('authError'); // Element voor foutmeldingen

// Functie om de UI aan te passen op basis van de authenticatiestatus
function updateUI(user) {
    if (user) {
        // Gebruiker is aangemeld
        authContainer.style.display = 'none'; // Verberg het aanmeldformulier
        appContent.style.display = 'block';   // Toon de app content
        userNameSpan.textContent = user.email || user.displayName || 'Gebruiker'; // Toon de naam/email
        console.log("Gebruiker is aangemeld:", user.email);
    } else {
        // Gebruiker is NIET aangemeld
        authContainer.style.display = 'block'; // Toon het aanmeldformulier
        appContent.style.display = 'none';   // Verberg de app content
        console.log("Geen gebruiker aangemeld.");
    }
}

// Listener voor authenticatiestatusveranderingen
onAuthStateChanged(auth, (user) => {
    updateUI(user); // Pas de UI aan zodra de authenticatiestatus bekend is
});

// Functie om een gebruiker aan te melden met e-mail en wachtwoord
async function signInUser(email, password) {
  authErrorElement.textContent = ''; // Maak eventuele eerdere foutmeldingen leeg

  try {
    await signInWithEmailAndPassword(auth, email, password);
    // UI wordt automatisch bijgewerkt door onAuthStateChanged
  } catch (error) {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.error("Fout bij aanmelden:", errorCode, errorMessage);
    // Toon een specifieke foutmelding aan de gebruiker
    switch (errorCode) {
      case 'auth/user-not-found':
        authErrorElement.textContent = 'Geen gebruiker gevonden met dit e-mailadres.';
        break;
      case 'auth/wrong-password':
        authErrorElement.textContent = 'Het ingevoerde wachtwoord is onjuist.';
        break;
      case 'auth/invalid-email':
        authErrorElement.textContent = 'Het e-mailadres is ongeldig.';
        break;
      default:
        authErrorElement.textContent = `Fout bij aanmelden: ${errorMessage}`;
    }
  }
}

// Functie om af te melden
async function signOutUser() {
    try {
        await signOut(auth);
        // UI wordt automatisch bijgewerkt door onAuthStateChanged
        alert("Je bent succesvol afgemeld.");
    } catch (error) {
        console.error("Fout bij afmelden:", error);
        alert("Fout bij afmelden: " + error.message);
    }
}

// Voeg event listeners toe na DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Voorkom dat de pagina opnieuw laadt

            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');

            const email = emailInput.value;
            const password = passwordInput.value;

            if (email && password) {
                signInUser(email, password);
            } else {
                authErrorElement.textContent = 'Vul alstublieft zowel e-mail als wachtwoord in.';
            }
        });
    }

    if (signOutButton) {
        signOutButton.addEventListener('click', signOutUser);
    }
});
