// js/user.js
import { auth, db } from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const contentArea = document.querySelector('.scrollable-content');
    const menuToggle = document.getElementById('menuToggle');
    
    // DOM Elements to update
    const userNameDisplay = document.querySelector('.user-name');
    const welcomeNoteSpan = document.querySelector('.header-user-name'); 

    let currentUserData = null;
    let userId = null;

    // --- 1. SESSION CHECK ---
    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = "login.html";
        } else {
            userId = user.uid;
            fetchAndSetUserData(userId);
            setupSidebarNavigation();
            setupLogout();
        }
    });

    // --- 2. FETCH AND DISPLAY CURRENT USER DATA ---
    async function fetchAndSetUserData(uid) {
        try {
            const doc = await db.collection("members").doc(uid).get();
            if (doc.exists) {
                currentUserData = doc.data();
                userNameDisplay.innerText = currentUserData.name;
                welcomeNoteSpan.innerText = currentUserData.name;
                loadPage('user-dashboard'); // Load dashboard initially
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    }

    // --- 3. LOGOUT FUNCTIONALITY ---
    function setupLogout() {
        const logoutLinks = document.querySelectorAll('.logout');
        logoutLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                auth.signOut().then(() => {
                    window.location.href = "login.html";
                }).catch(error => console.error("Logout Error:", error));
            });
        });
    }

    // --- 4. NAVIGATION FUNCTIONALITY ---
    function setupSidebarNavigation() {
        sidebar.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;
            e.preventDefault();
            
            document.querySelectorAll('.sidebar a').forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const pageName = link.getAttribute('data-page');
            loadPage(pageName);
            
            if (window.innerWidth <= 992) sidebar.classList.remove('active');
        });
    }

    // --- 5. PAGE CONTENT LOADING (Dynamic) ---
    async function loadPage(pageName) {
        if (!currentUserData) return;
        contentArea.innerHTML = ''; // Clear current content

        // --- Correct field name: planType ---
        const planName = currentUserData.planType || 'None';

        if (pageName === 'user-dashboard') {
            renderDashboard(planName);
        } else if (pageName === 'my-trainer') {
            renderTrainers();
        } else if (pageName === 'fee-payment') {
            renderFees(planName);
        } else if (pageName === 'my-plan') {
            // Render specific plan details
            contentArea.innerHTML = `
                <div class="detail-card">
                    <h2>My Current Plan</h2>
                    <p style="font-size: 24px; color: var(--accent-color); font-weight: bold;">${planName}</p>
                    <p>Details about your ${planName} plan will be shown here.</p>
                </div>
            `;
        } else if (pageName === 'user-notifications') {
            renderNotifications();
        } else {
            contentArea.innerHTML = `<div class="detail-card"><h2>${pageName.replace('-', ' ')}</h2><p>Page loading...</p></div>`;
        }
    }

    // --- RENDER FUNCTIONS ---

    function renderDashboard(planName) {
        contentArea.innerHTML = `
            <section class="stats-grid">
                <div class="stat-card gradient-1"><i class="fas fa-calendar-check icon"></i>
                    <div class="data"><h3>Active Plan</h3><p class="stat-number">${planName}</p></div>
                </div>
                <div class="stat-card gradient-3"><i class="fas fa-exclamation-triangle icon"></i>
                    <div class="data"><h3>Due Amount</h3><p class="stat-number">₹<span>${currentUserData.billAmount || '0'}</span></p></div>
                </div>
                <div class="stat-card gradient-4"><i class="fas fa-utensils icon"></i>
                    <div class="data"><h3>Today's Diet</h3><p class="stat-number" style="font-size: 20px;">${currentUserData.dietPlan || 'None'}</p></div>
                </div>
            </section>
        `;
    }

    async function renderTrainers() {
        contentArea.innerHTML = `<div class="detail-card"><h2>Available Trainers</h2><div id="trainer-list">Loading...</div></div>`;
        const trainerContainer = document.getElementById('trainer-list');
        
        try {
            const snapshot = await db.collection("members").where("role", "==", "trainer").get();
            
            if (snapshot.empty) {
                trainerContainer.innerHTML = "No trainers available.";
                return;
            }

            let html = '<table class="data-table"><thead><tr><th>Name</th><th>Specialty</th><th>Action</th></tr></thead><tbody>';
            snapshot.forEach(doc => {
                const trainer = doc.data();
                html += `<tr>
                    <td>${trainer.name}</td>
                    <td>${trainer.specialty || 'General'}</td>
                    <td><button class="btn-choose" data-id="${doc.id}">Choose</button></td>
                </tr>`;
            });
            html += '</tbody></table>';
            trainerContainer.innerHTML = html;

            document.querySelectorAll('.btn-choose').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const trainerId = e.target.getAttribute('data-id');
                    await db.collection("members").doc(userId).update({ trainerId: trainerId });
                    alert("Trainer updated!");
                });
            });
        } catch (error) {
            console.error(error);
            trainerContainer.innerHTML = "Error loading trainers.";
        }
    }

    function renderFees(planName) {
        contentArea.innerHTML = `
            <div class="detail-card">
                <h2>Fee Payment</h2>
                <p><strong>Current Plan:</strong> ${planName}</p>
                <p><strong>Amount Due:</strong> ₹${currentUserData.billAmount || '0'}</p>
                <p><strong>Status:</strong> <span class="status ${currentUserData.feeStatus === 'Paid' ? 'paid' : 'pending'}">${currentUserData.feeStatus || 'Pending'}</span></p>
                ${currentUserData.feeStatus !== 'Paid' && currentUserData.billAmount > 0 ? '<button id="payBtn" class="btn-pay">Pay Now</button>' : ''}
            </div>
        `;

        const payBtn = document.getElementById('payBtn');
        if (payBtn) {
            payBtn.addEventListener('click', async () => {
                await db.collection("members").doc(userId).update({ feeStatus: 'Paid', billAmount: 0 });
                alert("Payment Successful!");
                currentUserData.feeStatus = 'Paid';
                currentUserData.billAmount = 0;
                renderFees(planName); // Refresh view
            });
        }
    }

    async function renderNotifications() {
        contentArea.innerHTML = `<div class="detail-card"><h2>Notifications</h2><div id="notification-list">Loading...</div></div>`;
        const container = document.getElementById('notification-list');
        
        try {
            const snapshot = await db.collection("notifications").orderBy('timestamp', 'desc').get();
            let html = '<ul class="notif-list">';
            snapshot.forEach(doc => {
                const note = doc.data();
                html += `<li class="notif-item"><strong>${note.title}</strong><br>${note.message}</li>`;
            });
            html += '</ul>';
            container.innerHTML = html;
        } catch (error) {
            container.innerHTML = "Error loading notifications.";
        }
    }

    menuToggle.addEventListener('click', () => sidebar.classList.toggle('active'));
});