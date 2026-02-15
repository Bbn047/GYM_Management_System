Mr. FIT - Trainer Dashboard
This repository contains the frontend dashboard application for trainers at Mr. FIT gym. It is a web-based application built with HTML, CSS, and JavaScript, powered by Firebase for authentication and data management.

🚀 Features
Secure Authentication: Secure login and session management via Firebase Auth.

Dynamic Dashboard: Overview of trainee counts and pending payments.

My Trainees Management: View lists of assigned trainees and their payment statuses.

Notifications System: Real-time notifications sent from the admin panel.

Diet Plan Management: View and edit active diet plans for trainees.

Responsive Design: Optimized for desktop and mobile devices.

🛠️ Tech Stack
Frontend: HTML5, CSS3 (Flexbox/Grid), Vanilla JavaScript (ES6 Modules).

Backend/Database: Firebase Firestore.

Authentication: Firebase Authentication.

📂 Project Structure
Plaintext
├── index.html          # Login page
├── trainer-dashboard.html # Main trainer panel
├── styles/
│   └── trainer.css     # Styling for dashboard
├── js/
│   ├── firebase-config.js # Firebase initialization
│   └── trainer.js      # Core dashboard logic
└── README.md
⚙️ Setup and Installation
Clone the repository:

Bash
git clone <repository-url>
Firebase Configuration:

Create a project in the Firebase Console.

Enable Email/Password authentication.

Create a Firestore Database.

Copy your web app configuration from Firebase and paste it into js/firebase-config.js.

Firestore Structure Requirements:
The application expects a members collection with documents containing the following fields for functional data binding:

role (string) - "user" or "trainer"

trainerId (string) - UID of the trainer assigned to the user

feeStatus (string) - "Paid" or "Unpaid"

dietPlan (string) - Name of the diet plan

Run the application:
Use a local server extension (like Live Server in VS Code) to view the files, as ES6 modules require a server context.

🔐 Functional Logout
The logout functionality is implemented in js/trainer.js using auth.signOut(). It ensures the user session is cleared and redirects back to the login page.