// scripts/login.js
import { db, auth } from "./firebase-config.js";

// Attach event listeners
document.getElementById('adminLoginForm').addEventListener('submit', (e) => handleLogin(e, 'admin'));
// Use 'trainer' here to match your database role
document.getElementById('trainerLoginForm').addEventListener('submit', (e) => handleLogin(e, 'trainer'));
document.getElementById('userLoginForm').addEventListener('submit', (e) => handleLogin(e, 'user'));

function handleLogin(e, type) {
    e.preventDefault();
    console.log("Attempting login as:", type); // DEBUG

    const email = document.getElementById(`${type}Email`).value;
    const password = document.getElementById(`${type}Password`).value;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log("Auth success. UID:", user.uid); // DEBUG

            // Fetch user role from Firestore
            return db.collection("members").doc(user.uid).get();
        })
        .then((doc) => {
            if (doc.exists) {
                const role = doc.data().role;
                console.log("Firestore Role:", role); // DEBUG
                console.log("Expected Type:", type);   // DEBUG

                // SECURITY CHECK
                if (role !== type) {
                    alert(`This account is registered as a ${role}, not a ${type}.`);
                    auth.signOut();
                    return;
                }

                // Redirect
                if (role === 'admin') {
                    window.location.href = "admin-dashboard.html";
                } else if (role === 'trainer') {
                    window.location.href = "trainer-dashboard.html";
                } else {
                    window.location.href = "user-dashboard.html";
                }
            } else {
                console.error("No document found in Firestore for this user.");
                alert("Account data not found.");
            }
        })
        .catch((error) => {
            console.error("Login Error:", error); // DEBUG
            alert(error.message);
        });
}