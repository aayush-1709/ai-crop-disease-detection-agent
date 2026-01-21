// ------------------------------------------------------------------
// Firebase Configuration
// ------------------------------------------------------------------
// TODO: Replace the following config with your YOUR FIREBASE PROJECT configuration.
// You can get this from the Firebase Console -> Project Settings -> General -> Your apps -> SDK setup/configuration
// Config is passed from Flask template via window.FIREBASE_CONFIG
const firebaseConfig = window.FIREBASE_CONFIG || {
    apiKey: "PLACEHOLDER",
    authDomain: "PLACEHOLDER",
    projectId: "PLACEHOLDER",
    storageBucket: "PLACEHOLDER",
    messagingSenderId: "PLACEHOLDER",
    appId: "PLACEHOLDER",
    measurementId: "PLACEHOLDER"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
} else {
    console.error("Firebase SDK not loaded.");
}

// ------------------------------------------------------------------
// Auth Logic
// ------------------------------------------------------------------

const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// DOM Elements
const loginFrame = document.getElementById('loginFrame');
const mainContent = document.getElementById('mainContent');
const userAvatar = document.getElementById('user-avatar');
const userNameDisplay = document.getElementById('user-name-display');
const loginBtn = document.getElementById('google-login-btn');
const logoutBtn = document.getElementById('logout-btn');

// Login Function
function signInWithGoogle() {
    auth.signInWithPopup(googleProvider)
        .then((result) => {
            // User signed in
            const user = result.user;
            console.log("User signed in: ", user.displayName);
            updateUIForSignedInUser(user);
            transitionToMainContent();
        })
        .catch((error) => {
            console.error("Error signing in: ", error);
            alert("Login failed: " + error.message);
        });
}

// Logout Function
function signOut() {
    auth.signOut().then(() => {
        console.log("User signed out");
        window.location.reload(); // Reload to show login screen again
    }).catch((error) => {
        console.error("Sign out error", error);
    });
}

// UI Updates
function updateUIForSignedInUser(user) {
    if (userAvatar) {
        userAvatar.src = user.photoURL || 'https://cdn-icons-png.flaticon.com/512/847/847969.png';
        userAvatar.classList.remove('hidden');
    }
    if (userNameDisplay) {
        userNameDisplay.innerText = `Hi, ${user.displayName.split(' ')[0]}`;
        userNameDisplay.classList.remove('hidden');
    }
}

function transitionToMainContent() {
    if (loginFrame && mainContent) {
        loginFrame.classList.add('hidden');
        mainContent.classList.remove('hidden');
    }
}

// Event Listeners
if (loginBtn) {
    loginBtn.addEventListener('click', signInWithGoogle);
}

// Check Auth State on Load
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is already signed in
        console.log("Auth state change: Signed in");
        updateUIForSignedInUser(user);
        // If the window is currently showing the login frame, move past it
        // We check this to avoid conflicting with the initial animation sequence
        if (!loginFrame.classList.contains('hidden') && mainContent.classList.contains('hidden')) {
            transitionToMainContent();
        }
    } else {
        console.log("Auth state change: Signed out");
    }
});
