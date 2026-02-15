// scripts/register.js
import { db, auth } from "./firebase-config.js";

document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('regRole').value;

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;

            // Save user role in Firestore under 'users' collection
            return db.collection("members").doc(user.uid).set({
                name: name,
                email: email,
                role: role // 'admin', 'trainer', or 'user'
            });
        })
        .then(() => {
            alert("Registration Successful!");
            window.location.href = "login.html";
        })
        .catch((error) => {
            alert(error.message);
        });
});