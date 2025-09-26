# 🚨 Safe Path – One Tap Emergency Safety App

Safe Path is a **Progressive Web App (PWA)** designed to provide instant emergency alerts with just **one tap**. Whether you’re traveling, walking alone, or in an unexpected situation, Safe Path helps you notify others and find help — all directly from your browser, without needing to install a heavy mobile app.

🔗 **Live Demo:** [Safe Path](https://tourmaline-paletas-4e69f7.netlify.app/)

---

## ✨ Features

- 🆘 **Panic Button** – One tap sends an emergency alert with your live location  
- ⏱️ **5-Second Cancel Countdown** – Prevents accidental alerts  
- 🔊 **Loud Alert Sound** – Plays instantly on activation  
- 📍 **Real-Time Location Tracking** – Continuously updates your position  
- 🏥 **Nearby Help Centers** – Find hospitals, police stations & embassies  
- 🧭 **Directions** – Walking routes & distance to help centers  
- 📡 **Offline Fallback** – Shows cached location when internet is lost  
- 📊 **Admin Dashboard** – Review all emergency alerts securely  
- 📱 **PWA Install** – Works offline and can be added to your home screen like a native app  

---

## 🛠️ Tech Stack

- **Google Maps JavaScript API** – Interactive live map  
- **Geolocation API** – Continuous real-time location tracking  
- **Places API** – Locates nearby hospitals, police stations & embassies  
- **Directions API** – Provides routes to help centers  
- **Formspree** – Sends email alerts with location & Google Maps link  
- **Firebase Realtime Database** – Stores alerts with timestamp & address  
- **Firebase Authentication** – Admin-only access for reviewing alerts  
- **PWA Technology** – App-like installation & offline functionality  

---

## 🚀 Getting Started

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/msaad732/One-Tap-Alert
cd safe-path
2️⃣ Install Dependencies
bash
Copy code
npm install
3️⃣ Setup Environment Variables
Create a .env file in the root directory and add your API keys:

env
Copy code
REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key_here
REACT_APP_FIREBASE_API_KEY=your_firebase_key_here
4️⃣ Run the Project
bash
Copy code
npm start
The app will run at http://localhost:3000.

📦 Deployment
You can deploy Safe Path on:

Firebase Hosting

Vercel

Netlify

Any static hosting service

👨‍💻 Built By
Muhammad Saad

Eman Khaliq

💡 Inspiration
We built Safe Path during the Google Maps Platform Award Hackathon to help travelers, students, and anyone needing quick help.

Our goal: provide a lightweight, reliable, and fast emergency app that works even offline.
