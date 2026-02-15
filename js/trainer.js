// js/trainer.js
import { db, auth } from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', () => {
    const sidebarLinks = document.querySelectorAll('.sidebar a');
    const mainContent = document.getElementById('mainContent');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // --- 1. AUTH CHECK ---
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = "login.html";
        } else {
            // Load dashboard data
            fetchTrainerData(user.uid);
            fetchDashboardStats(user.uid);
        }
    });

    // --- 2. FIX DROPDOWN CLICK ISSUE ---
    const dropdown = document.querySelector('.dropdown');
    const dropdownContent = document.querySelector('.dropdown-content');

    if (dropdown && dropdownContent) {
        dropdown.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevents click from bubbling up to document
            dropdownContent.classList.toggle('show');
            dropdown.classList.toggle('active');
        });

        // Close dropdown if clicking outside
        document.addEventListener('click', () => {
            dropdownContent.classList.remove('show');
            dropdown.classList.remove('active');
        });
    }

    // --- 3. FUNCTIONAL LOGOUT BUTTON ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevents navigating to "#"
            
            auth.signOut().then(() => {
                window.location.href = "login.html";
            }).catch((error) => {
                console.error("Logout Error:", error);
                alert("Failed to log out. Please try again.");
            });
        });
    }

    // --- 4. SIDEBAR NAVIGATION HANDLING ---
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            const page = link.getAttribute('data-page');
            loadPageContent(page);
        });
    });

    // --- 5. DYNAMIC PAGE LOADING ---
    function loadPageContent(page) {
        const trainerUid = auth.currentUser.uid;
        
        if (page === 'trainer-dashboard') {
            location.reload(); 
        } else if (page === 'my-trainees') {
            mainContent.innerHTML = `
                <div class="page-title"><h2>My Trainees</h2></div>
                <div class="detail-card">
                    <table id="trainees-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="trainees-list-body">
                            <tr><td colspan="3">Loading trainees...</td></tr>
                        </tbody>
                    </table>
                </div>
            `;
            fetchTraineesList(trainerUid);
        } else if (page === 'notifications') {
            mainContent.innerHTML = `
                <div class="page-title"><h2>Notifications</h2></div>
                <div class="detail-card">
                    <div id="notifications-list" style="padding: 20px;">
                        <p>Loading notifications...</p>
                    </div>
                </div>
            `;
            fetchNotifications();
        }
    }

    // --- 6. DATA FETCHING FUNCTIONS ---
    async function fetchTrainerData(trainerUid) {
        try {
            const doc = await db.collection("members").doc(trainerUid).get();
            if (doc.exists) {
                const data = doc.data();
                document.getElementById('trainer-welcome-name').innerText = `Welcome, ${data.name}`;
                document.getElementById('trainer-profile-name').innerText = data.name;
            }
        } catch (error) {
            console.error("Error fetching trainer data:", error);
        }
    }

    async function fetchDashboardStats(trainerUid) {
        try {
            const snapshot = await db.collection("members")
                .where("role", "==", "user")
                .where("trainerId", "==", trainerUid)
                .get();

            let traineeCount = 0;
            let pendingPayments = 0;
            let paymentTableHtml = '';
            let dietPlansHtml = '';

            snapshot.forEach(doc => {
                const trainee = doc.data();
                traineeCount++;
                if (trainee.feeStatus !== "Paid") pendingPayments++;
                
                // Payment Table Rows
                paymentTableHtml += `
                    <tr>
                        <td>${trainee.name}</td>
                        <td><span class="status ${trainee.feeStatus === 'Paid' ? 'paid' : 'pending'}">${trainee.feeStatus || 'Unpaid'}</span></td>
                    </tr>
                `;

                // Diet Plan Table Rows
                dietPlansHtml += `
                    <tr>
                        <td>${trainee.name}</td>
                        <td><span style="color: #3498db;">${trainee.dietPlan || 'Not Set'}</span></td>
                        <td>${trainee.goal || 'N/A'}</td>
                        <td><button class="action-btn" onclick="window.location.href='${trainee.actionLink || '#'}'">View</button></td>
                    </tr>
                `;
            });

            // Update DOM Elements
            document.getElementById('trainee-count').innerText = traineeCount;
            document.getElementById('pending-payments').innerText = pendingPayments;
            document.getElementById('payment-status-body').innerHTML = paymentTableHtml || '<tr><td colspan="2">No trainees found.</td></tr>';
            document.getElementById('active-plans-body').innerHTML = dietPlansHtml || '<tr><td colspan="4">No diet plans found.</td></tr>';

        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    }

    async function fetchTraineesList(trainerUid) {
        try {
            const snapshot = await db.collection("members")
                .where("role", "==", "user")
                .where("trainerId", "==", trainerUid)
                .get();

            let traineesHtml = '';
            snapshot.forEach(doc => {
                const trainee = doc.data();
                traineesHtml += `
                    <tr>
                        <td>${trainee.name}</td>
                        <td>${trainee.email}</td>
                        <td><span class="status ${trainee.feeStatus === 'Paid' ? 'paid' : 'pending'}">${trainee.feeStatus || 'Unpaid'}</span></td>
                    </tr>
                `;
            });

            document.getElementById('trainees-list-body').innerHTML = traineesHtml || '<tr><td colspan="3">No trainees found.</td></tr>';
        } catch (error) {
            console.error("Error fetching trainees:", error);
            document.getElementById('trainees-list-body').innerHTML = '<tr><td colspan="3">Error loading data.</td></tr>';
        }
    }

    function fetchNotifications() {
        const listContainer = document.getElementById('notifications-list');
        
        db.collection("notifications")
            .orderBy("timestamp", "desc")
            .onSnapshot((snapshot) => {
                let html = '';
                snapshot.forEach((doc) => {
                    const note = doc.data();
                    html += `
                        <div class="notification-item" style="border-bottom: 1px solid #eee; padding: 15px 0;">
                            <h3 style="margin: 0 0 5px 0; color: #333;">${note.title || 'Notification'}</h3>
                            <p style="margin: 0; color: #666;">${note.message}</p>
                            <small style="color: #999;">${note.timestamp ? note.timestamp.toDate().toLocaleString() : ''}</small>
                        </div>
                    `;
                });
                listContainer.innerHTML = html || '<p>No notifications at this time.</p>';
            }, (error) => {
                console.error("Error fetching notifications:", error);
                listContainer.innerHTML = '<p>Error loading notifications.</p>';
            });
    }
});