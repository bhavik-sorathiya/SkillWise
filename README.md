# SkillWise 🚀

**SkillWise** is a full-stack web application built using the **MERN stack**, currently leveraging **Node.js** for the backend and **React (Vite)** for the frontend.

---

## 📁 Project Structure
```yml copy code
SkillWise/  
├── client/ # React frontend (powered by Vite)  
├── server/ # Node.js & Express backend  
├── package.json  
└── other configuration & automation scripts  
```

---

## 🚀 Getting Started

Follow the steps below to set up the project locally on your machine.

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/bhavik-sorathiya/SkillWise.git
cd SkillWise
```
## 2️⃣ One-Time Setup

Instead of installing dependencies separately in each folder, run the following command from the **root directory** to install dependencies for the **root**, **client**, and **server**:

```bash
npm run setup
```
## 3️⃣ Development Mode/Run the Application
To start both the React frontend and the Node.js backend simultaneously with a single command, run:
```bash
npm run dev
```
### Local URLs
- Frontend: `http://localhost:5173/`
- Backend: `http://localhost:5000/`
---
## 🛠️ Available Scripts

| Command           | Description                                                   |
|-------------------|---------------------------------------------------------------|
| `npm run setup`   | Installs dependencies for root, client, and server folders    |
| `npm run dev`     | Runs both frontend and backend concurrently                   |
| `npm run client`  | Runs only the React frontend [First open client folder in terminal]                                  |
| `npm run server`  | Runs only the Node.js backend (with auto-restart) [First open server folder in terminal]             |
