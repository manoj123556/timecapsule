# TimeCapsule 🕰️
Your life is a collection of moments.  
Preserve them in a sacred, private sanctuary designed for reflection.

> *Your private digital diary — beautifully designed, AI-powered, and completely yours.*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-blue?style=for-the-badge)](https://timecapsule-two-olive.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-manoj123556-black?style=for-the-badge&logo=github)](https://github.com/manoj123556/timecapsule)
[![Built with React](https://img.shields.io/badge/React-TypeScript-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Realtime%20DB-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Claude API](https://img.shields.io/badge/Claude%20API-AI%20Powered-8B5CF6?style=for-the-badge)](https://anthropic.com/)

---

## 🌟 Overview

TimeCapsule is a **privacy-first digital diary** that lets you capture your life's moments with rich media, emotional context, and location tagging — enhanced by AI that understands your entries and helps you reflect.

Built with React + TypeScript, Firebase, and the Claude API, it delivers a journaling experience that feels personal, intelligent, and secure.

**🔗 [Try it live →](https://timecapsule-two-olive.vercel.app/)**

---

## ✨ Features

### 📝 Rich Entry Creation
- Full rich text editor with customizable fonts and formatting
- **16 emotional states** to tag how you're feeling
- Drag-and-drop media attachments (images, video, audio, files)
- Location tagging with map visualization
- Focus mode for distraction-free writing
- Custom tags for personal organization

### 🤖 AI-Powered Intelligence
- **Auto-title generation** — AI reads your entry and suggests a meaningful title
- **Mood detection** — automatically suggests the right emotional tag based on your writing
- **Content summarization** — get a quick summary of longer entries

### 🗂️ Multiple Views
| View | Description |
|------|-------------|
| 📅 Timeline | Chronological feed of all entries |
| 🖼️ Gallery | Visual grid of media-rich entries |
| 📆 Calendar | Browse entries by date |
| 🗺️ Map | Explore entries by location |

### 🔍 Discovery & Organization
- Powerful search and filtering
- Tag-based organization
- Favorites system for bookmarking important entries
- **"On This Day"** — revisit memories from the same date in past years

### 🔒 Privacy & Security
- **PIN lock** protection for sensitive entries
- Firebase Authentication
- Secure real-time data sync
- Local storage for offline access

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript |
| Styling | Tailwind CSS |
| Backend/DB | Firebase (Firestore + Auth) |
| AI | Anthropic Claude API | Google Ai Studio|
| Hosting | Vercel |
| State Management | React Hooks + Context API |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase project
- Anthropic API key

### Installation

```bash
# Clone the repo
git clone https://github.com/manoj123556/timecapsule.git
cd timecapsule

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_CLAUDE_API_KEY=your_anthropic_api_key
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📁 Project Structure

```
timecapsule/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/            # Main app views (Timeline, Gallery, Calendar, Map)
│   ├── services/         # Firebase + Claude API service layers
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Helper functions
├── public/
└── ...config files
```

---

## 🧠 AI Integration

TimeCapsule uses the **Anthropic Claude API** to enhance the journaling experience:

- **Auto-title**: After writing an entry, AI analyzes the content and generates a contextually relevant title — saving you the mental effort of naming every entry.
- **Mood detection**: AI reads the emotional tone of your writing and suggests the most appropriate emotion tag from the 16 available states.
- **Summarization**: For longer entries, AI generates a concise summary that appears in list/gallery views.

All AI calls are made server-side to protect your API key. Your journal content is never stored or used for model training.

---

## 🗺️ Roadmap

- [ ] Export entries as PDF or JSON
- [ ] Custom user themes
- [ ] Service worker for full offline support
- [ ] Onboarding tutorial for new users
- [ ] Analytics dashboard (writing habits, mood trends)
- [ ] Automated backup to Google Drive

---

## 👤 Author

**Manoj Kumar Dande (Nani)**  
Software Engineer | Embedded Systems & AI Enthusiast  
📧 manojkumardande1@gmail.com  
🔗 [LinkedIn](https://linkedin.com/in/manoj-kumar-dande-941bab1a0)  
🌐 [Live App](https://timecapsule-two-olive.vercel.app/)

---

## 📄 License

This project is licensed under the MIT License.

---

*Built with ❤️ and CARE*
