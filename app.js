// Importeer de functies die je nodig hebt van de SDK's
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js"; // Uitgecommentarieerd, indien niet gebruikt
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
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
const loadingScreen = document.getElementById('loading-screen'); // Voor de laadtoestand

// Functie om de UI aan te passen op basis van de authenticatiestatus
function updateUI(user) {
    console.log("updateUI called. User object:", user); // Log het hele user object

    if (user) {
        // Gebruiker is aangemeld
        authContainer.style.display = 'none'; // Verberg de authenticatiecontainer
        appContent.style.display = 'block'; // Toon de applicatie-inhoud

        // Log de waarden die gebruikt worden voor de naam
        console.log("User email:", user.email);
        console.log("User display name:", user.displayName);

        // Toon de weergavenaam of het e-mailadres van de gebruiker, anders 'Gebruiker'
        userNameSpan.textContent = user.displayName || user.email || 'Gebruiker';
        console.log("userNameSpan na toewijzing:", userNameSpan.textContent);

        console.log("Gebruiker is aangemeld:", user.email);
    } else {
        // Gebruiker is NIET aangemeld
        authContainer.style.display = 'flex'; // Gebruik flexbox om de inhoud te centreren en full screen te maken via CSS
        appContent.style.display = 'none'; // Verberg de applicatie-inhoud
        userNameSpan.textContent = ''; // Wis de gebruikersnaam bij afmelden
        console.log("Geen gebruiker aangemeld.");
    }
    // Verberg het laadscherm zodra de authenticatiestatus bekend is en de UI is bijgewerkt
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
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
    // Optioneel: wis de invoervelden na succesvol inloggen
    if (loginForm) {
      loginForm.reset();
    }
  } catch (error) {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.error("Fout bij aanmelden:", errorCode, errorMessage);
    // Toon een specifieke foutmelding aan de gebruiker
    switch (errorCode) {
      case 'auth/user-not-found':
      case 'auth/invalid-credential': // Nieuwer Firebase error code voor ongeldige referenties (wachtwoord of e-mail)
        authErrorElement.textContent = 'Ongeldige e-mail of wachtwoord.';
        break;
      case 'auth/wrong-password': // Oudere code, kan nog voorkomen
        authErrorElement.textContent = 'Het ingevoerde wachtwoord is onjuist.';
        break;
      case 'auth/invalid-email':
        authErrorElement.textContent = 'Het e-mailadres is ongeldig.';
        break;
      case 'auth/too-many-requests':
        authErrorElement.textContent = 'Te veel mislukte inlogpogingen. Probeer het later opnieuw.';
        break;
      case 'auth/network-request-failed':
        authErrorElement.textContent = 'Netwerkfout. Controleer uw internetverbinding.';
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
        console.log("Gebruiker succesvol afgemeld.");
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

    // Toon initieel het laadscherm totdat onAuthStateChanged is afgehandeld
    if (loadingScreen) {
        loadingScreen.style.display = 'flex'; // Zorg ervoor dat het laadscherm zichtbaar is bij het laden
    }
});
