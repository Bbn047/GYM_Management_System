// js/admin.js
import { auth, db } from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', () => {
    const contentArea = document.querySelector('.scrollable-content');
    const sidebarLinks = document.querySelectorAll('.sidebar a');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');

    auth.onAuthStateChanged((user) => {
        if (!user) window.location.href = "login.html";
        else {
            // Initial load of dashboard
            updateDashboardStats();
            setupLogout();
            setupSidebarNavigation();
        }
    });

    function setupLogout() {
        const logoutBtn = document.querySelector('.logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                auth.signOut().then(() => window.location.href = "login.html").catch(error => console.error(error));
            });
        }
    }

    // --- 1. DASHBOARD & STATS UPDATE (Main Table Sync) ---
    async function updateDashboardStats() {
        try {
            const membersSnapshot = await db.collection("members").get();
            let trainerCount = 0, userCount = 0, pendingFees = 0, totalIncome = 0;
            let trainersTableHTML = '', billsTableHTML = '';

            membersSnapshot.forEach(doc => {
                const member = doc.data();
                
                if (member.role === 'trainer') {
                    trainerCount++;
                    // Populate Trainer Status Table
                    trainersTableHTML += `
                        <tr>
                            <td><img src="${member.photoUrl || 'assets/images/default-avatar.png'}" class="table-img" style="width:40px;height:40px;border-radius:50%;"></td>
                            <td>${member.name || 'Unknown'}</td>
                            <td>₹${member.salary || '0'}</td>
                            <td><span class="status ${member.salaryStatus === 'Paid' ? 'paid' : 'pending'}">${member.salaryStatus || 'Pending'}</span></td>
                        </tr>
                    `;
                } 
                
                if (member.role === 'user') {
                    userCount++;
                    // Populate Recent Bills Table
                    billsTableHTML += `
                        <tr>
                            <td><img src="${member.photoUrl || 'assets/images/default-avatar.png'}" class="table-img" style="width:40px;height:40px;border-radius:50%;"></td>
                            <td>${member.name || 'Unknown'}</td>
                            <td>₹${member.billAmount || '0'}</td>
                            <td><span class="status ${member.paymentStatus === 'Paid' ? 'paid' : 'pending'}">${member.paymentStatus || 'Unpaid'}</span></td>
                        </tr>
                    `;

                    // Calculate Financials based on status
                    if (member.paymentStatus === 'Paid') {
                        totalIncome += Number(member.billAmount || 0);
                    } else {
                        pendingFees += Number(member.billAmount || 0);
                    }
                }
            });

            // Update DOM Cards
            const card1 = document.querySelector('.gradient-1 .stat-number');
            const card2 = document.querySelector('.gradient-2 .stat-number');
            const card3 = document.querySelector('.gradient-3 .stat-number');
            const card4 = document.querySelector('.gradient-4 .stat-number');

            if(card1) card1.innerText = trainerCount;
            if(card2) card2.innerText = userCount;
            if(card3) card3.innerText = `₹${pendingFees}`;
            if(card4) card4.innerText = `₹${totalIncome}`;

            // Update Tables if we are on the dashboard
            const trainerTableBody = document.querySelector('.details-grid .detail-card:first-child tbody');
            const billsTableBody = document.querySelector('.details-grid .detail-card:last-child tbody');
            
            if (trainerTableBody) trainerTableBody.innerHTML = trainersTableHTML;
            if (billsTableBody) billsTableBody.innerHTML = billsTableHTML;

        } catch (error) { console.error(error); }
    }

    // --- NAVIGATION ---
    function setupSidebarNavigation() {
        sidebarLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelector('.sidebar a.active').classList.remove('active');
                link.classList.add('active');
                loadContent(link.getAttribute('data-page'));
                if (window.innerWidth <= 992) sidebar.classList.remove('active');
            });
        });
    }

    function loadContent(page) {
        if (page === 'members') loadMembersPage();
        else if (page === 'billing') loadBillingPage();
        else if (page === 'notifications') loadNotificationsPage();
        else if (page === 'dashboard') location.reload();
    }

    // --- 2. MEMBERS PAGE ---
    async function loadMembersPage() {
        contentArea.innerHTML = `<h2>Loading Members...</h2>`;
        try {
            const snapshot = await db.collection("members").get();
            let trainersHTML = '', usersHTML = '';

            snapshot.forEach(doc => {
                const member = doc.data();
                if (member.role === 'trainer') {
                    trainersHTML += `
                        <div class="member-item" style="background:#2a2a2a; padding:10px; margin-bottom:5px; border-radius:5px; display:flex; justify-content:space-between; align-items:center;">
                            <div><strong>${member.name}</strong><br>Salary: ₹${member.salary || 0}</div>
                            <button class="action-btn-small" onclick="window.editMember('${doc.id}', 'trainer')">Edit</button>
                        </div>
                    `;
                } else if (member.role === 'user') {
                    usersHTML += `
                        <div class="member-item" style="background:#2a2a2a; padding:10px; margin-bottom:5px; border-radius:5px; display:flex; justify-content:space-between; align-items:center;">
                            <div><strong>${member.name}</strong><br>Plan: ${member.planType || 'None'} | Bill: ₹${member.billAmount || 0}</div>
                            <button class="action-btn-small" onclick="window.editMember('${doc.id}', 'user')">Edit</button>
                        </div>
                    `;
                }
            });

            contentArea.innerHTML = `
                <div class="members-container" style="display: flex; gap: 20px;">
                    <div class="detail-card" style="flex:1;">
                        <h2>Trainers</h2>
                        <div class="scrollable-box" style="max-height: 60vh; overflow-y: auto;">${trainersHTML}</div>
                    </div>
                    <div class="detail-card" style="flex:1;">
                        <h2>Users</h2>
                        <div class="scrollable-box" style="max-height: 60vh; overflow-y: auto;">${usersHTML}</div>
                    </div>
                </div>
            `;
        } catch (error) { contentArea.innerHTML = `<h2>Error loading members.</h2>`; }
    }

    // --- 3. EDIT FUNCTIONALITY ---
    window.editMember = async (id, role) => {
        const doc = await db.collection("members").doc(id).get();
        const data = doc.data();
        
        let newAmount = prompt(`Enter new ${role === 'trainer' ? 'Salary' : 'Bill Amount'}`, role === 'trainer' ? data.salary : data.billAmount);
        
        if (newAmount !== null) {
            let updateData = {};
            if (role === 'trainer') updateData.salary = Number(newAmount);
            else {
                updateData.billAmount = Number(newAmount);
                let newPlan = prompt("Enter Plan Type", data.planType);
                if (newPlan !== null) updateData.planType = newPlan;
            }
            
            await db.collection("members").doc(id).update(updateData);
            loadMembersPage(); // Refresh current view
            updateDashboardStats(); // Refresh stats in background
        }
    }

    // --- 4. BILLING PAGE ---
    async function loadBillingPage() {
        contentArea.innerHTML = `<h2>Loading Billing...</h2>`;
        try {
            const snapshot = await db.collection("members").get();
            let tableRows = '';
            snapshot.forEach(doc => {
                const member = doc.data();
                if (member.role === 'trainer') {
                    tableRows += `<tr><td>${member.name}</td><td>Trainer</td><td>₹${member.salary || 0}</td>
                    <td><button class="action-btn-small ${member.salaryStatus === 'Paid' ? 'gradient-2' : ''}" onclick="window.payTrainer('${doc.id}', this)" ${member.salaryStatus === 'Paid' ? 'disabled' : ''}>${member.salaryStatus === 'Paid' ? 'Paid' : 'Pay'}</button></td></tr>`;
                } else if (member.role === 'user') {
                    tableRows += `<tr><td>${member.name}</td><td>User</td><td>₹${member.billAmount || 0}</td>
                    <td><button class="action-btn-small" onclick="window.sendReminder('${doc.id}')">Reminder</button></td></tr>`;
                }
            });
            contentArea.innerHTML = `<div class="detail-card"><h2>Billing</h2><div style="max-height: 60vh; overflow-y: auto;"><table class="data-table"><thead><tr><th>Name</th><th>Role</th><th>Amount</th><th>Action</th></tr></thead><tbody>${tableRows}</tbody></table></div></div>`;
        } catch (error) { contentArea.innerHTML = `<h2>Error loading billing.</h2>`; }
    }

    // --- HELPER ACTIONS ---
    window.payTrainer = async (id, btn) => {
        await db.collection("members").doc(id).update({ salaryStatus: 'Paid' });
        btn.innerText = 'Paid'; btn.classList.add('gradient-2'); btn.disabled = true;
        updateDashboardStats();
    };
    window.sendReminder = (id) => alert("Reminder Sent to User");

    // --- 5. NOTIFICATIONS PAGE ---
    function loadNotificationsPage() {
        contentArea.innerHTML = `
            <div class="detail-card">
                <h2>Send Notification</h2>
                <textarea id="noteInput" placeholder="Type notification message here..." style="width:100%; height:100px; background:#2a2a2a; color:white; border:1px solid #444; padding:10px; border-radius:5px;"></textarea>
                <div style="margin-top:10px; display:flex; gap:10px;">
                    <button id="sendNoteBtn" class="action-btn gradient-1">Send to All</button>
                    <button id="clearNotesBtn" class="action-btn" style="background:#e74c3c;">Clear All</button>
                </div>
            </div>
            <div class="detail-card" style="margin-top:20px;">
                <h2>History</h2>
                <div id="notification-history" style="max-height: 40vh; overflow-y: auto;">Loading...</div>
            </div>
        `;

        // Action: Send Notification
        document.getElementById('sendNoteBtn').addEventListener('click', async () => {
            const message = document.getElementById('noteInput').value;
            if (!message) return alert("Please enter a message.");

            try {
                await db.collection("notifications").add({
                    message: message,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                alert("Notification sent to all members!");
                document.getElementById('noteInput').value = '';
            } catch (error) {
                console.error("Error sending:", error);
                alert("Failed to send.");
            }
        });

        // Action: Clear All Notifications
        document.getElementById('clearNotesBtn').addEventListener('click', async () => {
            if (!confirm("Are you sure? This will delete all sent notifications.")) return;

            try {
                const snapshot = await db.collection("notifications").get();
                const batch = db.batch();
                snapshot.forEach((doc) => batch.delete(doc.ref));
                await batch.commit();
                alert("History cleared!");
            } catch (error) {
                console.error("Error clearing:", error);
                alert("Failed to clear.");
            }
        });

        // Load History
        db.collection("notifications").orderBy("timestamp", "desc").onSnapshot(snapshot => {
            let html = '';
            snapshot.forEach(doc => {
                const note = doc.data();
                html += `
                    <div style="border-bottom:1px solid #444; padding:10px 0;">
                        <p style="margin:0;">${note.message}</p>
                        <small style="color:#aaa;">${note.timestamp ? note.timestamp.toDate().toLocaleString() : 'Just now'}</small>
                    </div>
                `;
            });
            document.getElementById('notification-history').innerHTML = html || 'No notifications sent yet.';
        });
    }

    menuToggle.addEventListener('click', () => sidebar.classList.toggle('active'));
});