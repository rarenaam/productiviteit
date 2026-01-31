// Importeer de functies die je nodig hebt van de SDK's
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
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

console.log("Firebase is geïnitialiseerd!");

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

// UI toggle links
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');

// App content elements
const appContent = document.getElementById('app-content');
const userNameSpanTopBar = document.getElementById('userName');
const userNameSpanMainContent = document.getElementById('userName-content');
const signOutButton = document.getElementById('signOutButton');


// Functie om de UI aan te passen op basis van de authenticatiestatus
function updateUI(user) {
    console.log("updateUI called. User object:", user);

    if (user) {
        // Gebruiker is aangemeld
        authContainer.style.display = 'none'; // Verberg de authenticatiecontainer
        appContent.style.display = 'block'; // Toon de gehele applicatie-inhoud

        const displayUserName = user.displayName || user.email || 'Gebruiker';
        if (userNameSpanTopBar) {
            userNameSpanTopBar.textContent = displayUserName;
        }
        if (userNameSpanMainContent) {
            userNameSpanMainContent.textContent = displayUserName;
        }
        console.log("Gebruikersnaam na toewijzing:", displayUserName);
        console.log("Gebruiker is aangemeld:", user.email);
    } else {
        // Gebruiker is NIET aangemeld
        authContainer.style.display = 'flex'; // Toon de authenticatiecontainer
        appContent.style.display = 'none'; // Verberg de gehele applicatie-inhoud
        
        // Wis de gebruikersnaam bij afmelden
        if (userNameSpanTopBar) {
            userNameSpanTopBar.textContent = '';
        }
        if (userNameSpanMainContent) {
            userNameSpanMainContent.textContent = '';
        }
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
  authErrorLogin.textContent = ''; // Maak eventuele eerdere foutmeldingen leeg

  try {
    await signInWithEmailAndPassword(auth, email, password);
    // UI wordt automatisch bijgewerkt door onAuthStateChanged
    loginForm.reset(); // Wis de invoervelden na succesvol inloggen
  } catch (error) {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.error("Fout bij aanmelden:", errorCode, errorMessage);
    // Toon een specifieke foutmelding aan de gebruiker
    switch (errorCode) {
      case 'auth/user-not-found':
      case 'auth/invalid-credential':
        authErrorLogin.textContent = 'Ongeldige e-mail of wachtwoord.';
        break;
      case 'auth/wrong-password':
        authErrorLogin.textContent = 'Het ingevoerde wachtwoord is onjuist.';
        break;
      case 'auth/invalid-email':
        authErrorLogin.textContent = 'Het e-mailadres is ongeldig.';
        break;
      case 'auth/too-many-requests':
        authErrorLogin.textContent = 'Te veel mislukte inlogpogingen. Probeer het later opnieuw.';
        break;
      case 'auth/network-request-failed':
        authErrorLogin.textContent = 'Netwerkfout. Controleer uw internetverbinding.';
        break;
      default:
        authErrorLogin.textContent = `Fout bij aanmelden: ${errorMessage}`;
    }
  }
}

// Functie om een nieuwe gebruiker te registreren
async function signUpUser(email, password, displayName = null) {
    authErrorRegister.textContent = ''; // Maak eerdere foutmeldingen leeg

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Stel de weergavenaam in als deze is opgegeven
        if (displayName) {
            await updateProfile(user, { displayName: displayName });
            console.log("Display name set:", displayName);
        }

        // UI wordt automatisch bijgewerkt door onAuthStateChanged
        registerForm.reset(); // Wis de invoervelden na succesvolle registratie
        console.log("Gebruiker succesvol geregistreerd:", user.email);
    } catch (error) {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error("Fout bij registreren:", errorCode, errorMessage);
        switch (errorCode) {
            case 'auth/email-already-in-use':
                authErrorRegister.textContent = 'Dit e-mailadres is al in gebruik.';
                break;
            case 'auth/invalid-email':
                authErrorRegister.textContent = 'Het e-mailadres is ongeldig.';
                break;
            case 'auth/weak-password':
                authErrorRegister.textContent = 'Het wachtwoord is te zwak. Gebruik minimaal 6 tekens.';
                break;
            case 'auth/operation-not-allowed':
                authErrorRegister.textContent = 'E-mail/wachtwoord registratie is niet ingeschakeld in Firebase Console.';
                break;
            default:
                authErrorRegister.textContent = `Fout bij registreren: ${errorMessage}`;
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
    // Schakel tussen login en registratie formulieren
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginSection.style.display = 'none';
            registerSection.style.display = 'flex'; // Gebruik flex om het formulier te centreren
            authErrorLogin.textContent = ''; // Wis eventuele fouten van login
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            registerSection.style.display = 'none';
            loginSection.style.display = 'flex'; // Gebruik flex om het formulier te centreren
            authErrorRegister.textContent = ''; // Wis eventuele fouten van registratie
        });
    }

    // Event listener voor het login formulier
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = loginEmailInput.value;
            const password = loginPasswordInput.value;

            if (email && password) {
                signInUser(email, password);
            } else {
                authErrorLogin.textContent = 'Vul alstublieft zowel e-mail als wachtwoord in.';
            }
        });
    }

    // Event listener voor het registratie formulier
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const displayName = registerDisplayNameInput.value;
            const email = registerEmailInput.value;
            const password = registerPasswordInput.value;
            const passwordConfirm = registerPasswordConfirmInput.value;

            authErrorRegister.textContent = ''; // Wis eerdere foutmeldingen

            if (!email || !password || !passwordConfirm) {
                authErrorRegister.textContent = 'Vul alle verplichte velden in.';
                return;
            }

            if (password !== passwordConfirm) {
                authErrorRegister.textContent = 'Wachtwoorden komen niet overeen.';
                return;
            }

            if (password.length < 6) {
                authErrorRegister.textContent = 'Wachtwoord moet minimaal 6 tekens lang zijn.';
                return;
            }

            await signUpUser(email, password, displayName);
        });
    }

    if (signOutButton) {
        signOutButton.addEventListener('click', signOutUser);
    }

    // Toon initieel het laadscherm totdat onAuthStateChanged is afgehandeld
    if (loadingScreen) {
        loadingScreen.style.display = 'flex';
    }
});
