# 🎬 CineMind AI — Fire TV Smart Entertainment Discovery & Family Vote

> **Amazon Developer Hackathon — Fire TV Track**  
> An AI-powered 10-foot living room entertainment discovery application designed specifically for televisions, remote controls, and multi-generational households.

---

## 🌟 The Problem CineMind AI Solves

Every evening, millions of families and friend groups sit in front of the TV spending 20 to 45 minutes endlessly scrolling through streaming catalogues, unable to decide what to watch. Different people want different things:
- **Dad** wants a high-octane sci-fi thriller.
- **Mom** wants a smart, thought-provoking drama or feel-good story.
- **Teenagers** want cutting-edge animation or fast-paced humor.
- **Kids** have strict bedtime schedules (< 90 minutes) and strict content ratings (G/PG).

**CineMind AI solves living room decision fatigue** with its signature **Family Vote** consensus engine, multi-dimensional emotional mood matching, and spoiler-free AI recommendations.

---

## 🏆 Signature Feature: Family Vote Consensus Engine

**Family Vote** eliminates movie night arguments:
1. **Who's in the Room?** Select tonight's viewers from the household roster (*David/Dad, Elena/Mom, Maya/Teen, Leo/8y Kid, Rose/Grandma*).
2. **Smart Constraint Auto-Lock:** If young children (like 8-year-old Leo) join the room, CineMind automatically locks the ceiling rating to **PG** and prioritizes tighter runtimes.
3. **Voting Arena:** Candidate movies are presented on the big screen with predicted compatibility percentages. Each viewer casts their vote (*💚 Love It, 😐 Neutral, ❌ Skip*) using the Fire TV remote or virtual controller.
4. **Consensus Celebration:** Winner is crowned with confetti, fanfare audio, and an individual compatibility breakdown (*e.g., Dad: 95% • Mom: 98% • Leo: 100% • Maya: 92% • Overall Harmony: 96%*).

---

## 📺 10-Foot Television & Remote Navigation Architecture

Designed from the ground up for the TV screen (1080p / 4K) and directional D-pad controls:

| Remote Button / Key | Action |
|:---|:---|
| **Arrow Up / Down / Left / Right** | 2D Spatial navigation across shelves, cards, tabs, and action buttons |
| **Enter / OK (Select)** | Activate selected movie, trigger buttons, or open trailer preview |
| **Esc / Backspace (Back)** | Close movie details modal, cancel modal, or return to Home screen |
| **[R] Key / On-screen Remote** | Opens the **Virtual Fire TV Remote Controller** overlay with tactile D-pad |
| **Alexa Voice Button** | Simulates Fire TV Alexa AI voice discovery queries (e.g., *"Find funny family comedies under 100 minutes"*) |

### Spatial Focus Engine & Sound Effects
- **Visual Focus Rings:** Glowing Amazon amber highlight (`#ff9900`) and scale-up animation (`scale-105`) clearly identify the active element from 10 feet away.
- **Web Audio Remote Sound Effects:** Authentic TV sound clicks on navigation, bright chimes on selection, and fanfare on Family Vote winners. Can be muted anytime via the bottom bar.

---

## 🚀 Key Screens & Features

### 1. Cinematic Home Screen
- **Hero Billboard Banner:** High-res cinematic backdrop with trailer preview, AI Match score (*98%*), age ratings, runtime, and "Why AI Picked This" highlight.
- **Mood Quick-Selector Strip:** 6 mood pills (*✨ Happy, 🍵 Relaxed, ⚡ Excited, 🧠 Curious, 💖 Romantic, 🧭 Adventurous*).
- **Genre Filter Bar:** Instant filtering across *Action, Comedy, Drama, Thriller, Animation, Science Fiction, and Family*.
- **Curated TV Rails:**
  - 🔥 *Trending Tonight on Fire TV*
  - 🧠 *CineMind AI Top Picks For Your Family*
  - 🛡️ *Family Night Favorites (G & PG Rated)*
  - ⚡ *High Energy & Thrills (Action & Spectacle)*
  - 🍿 *90-Minute Quick Watches (For tight bedtime schedules)*
  - ❤️ *Feel-Good Smiles & Cozy Vibes*

### 2. CineMind Mood Studio
- Filter by emotional state, available time (*< 95 min, < 120 min, Any*), and genre.
- Dynamic sorting by AI Match %, IMDb rating, or shortest runtime.

### 3. Movie Detail & Parental Safety Guide
- Simulated 4K HDR playback and trailer preview.
- **AI Recommendation Breakdown:** Tone Meters (*Humor, Thrill, Emotional Heart, Pacing Energy*) and spoiler-free vibe check.
- **Verified Parental Safety Guide:** Verified details on *Violence & Peril, Language & Slang, and Sensitive Themes* with clear age verdicts.

### 4. Shared Household Watchlist
- Unified living room queue showing which family member added each title (*Added by Leo, Added by Mom, Added by Maya*).
- One-click watched status toggle and filter by member.

### 5. Household Profiles & Family Lock
- Switch between *Dad, Mom, Maya (Teen), Leo (Kid), and Grandma*.
- **Family Lock Button:** Global one-click toggle in the header that locks the entire application to **G & PG** content.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling & Design System:** Tailwind CSS, Plus Jakarta Sans, Outfit font, Custom TV focus rings & glassmorphism
- **Icons & Visuals:** Lucide React, Canvas Confetti
- **Audio:** Web Audio API synthesized TV remote acoustic feedback
- **Fire TV Packaging Ready:** Web app structure compatible with Amazon Fire TV Web App Tester, Cordova/Capacitor, or Fire OS WebView.

---

## 🏃 Getting Started & Testing

### 1. Running the Application Locally
The development server is running at:
```bash
npm run dev -- --host --port 5173
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### 2. Testing TV Remote Navigation
- **Keyboard Navigation:** Use the **Arrow keys** (`▲`, `▼`, `◀`, `▶`) to navigate and **Enter** to select. Use **Esc** or **Backspace** to go back.
- **Virtual Fire TV Remote:** Click the floating **Fire TV Remote** button in the lower-right corner (or press **R** on your keyboard) to test the physical D-pad controller, Back, Home, and Alexa Voice AI buttons!
- **Sound Effects:** Click the sound toggle in the remote or bottom bar to experience TV click audio feedback.

---

## 🌐 TMDB Movie Metadata Integration & API Setup

CineMind AI integrates with **The Movie Database (TMDB)** for real-time movie search, trending and popular discovery, official age ratings, backdrops, cast records, and verified JustWatch streaming availability.

### 1. Zero-Leak Security Architecture
- **Private API Key Isolation:** TMDB API keys and Read Access Tokens are **never exposed to client-side bundles or browser network requests**.
- **Server Backend Proxy:** All metadata requests are routed through the local backend proxy (`/api/tmdb/*`) built into `vite.config.ts`.
- **Automatic Fallback:** If `TMDB_API_KEY` is not configured, or if an HTTP 429 rate limit is reached, CineMind AI seamlessly operates using its built-in sample database without interrupting user experience.

### 2. Obtaining a Free TMDB API Key
1. Create a free account at [The Movie Database (TMDB)](https://www.themoviedb.org/).
2. Navigate to **Settings → API** (`https://www.themoviedb.org/settings/api`).
3. Request a Developer API Key (v3).

### 3. Environment Variable Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` and add your API key:
```ini
# TMDB API Key (v3) - Used exclusively by the server proxy
TMDB_API_KEY=your_actual_tmdb_api_key_here
```
> [!NOTE]
> `.env` is included in `.gitignore` to prevent committing secrets to version control.

### 4. TMDB Terms & Attribution Notice
This application complies with TMDB API terms of use:
> **Attribution:** *This product uses the TMDB API but is not endorsed or certified by TMDB.*
> 
> Movie posters, high-resolution backdrops, cast directories, and titles are sourced via TMDB API. Verified streaming availability data is provided through TMDB's JustWatch integration.

---

## 📦 Adapting for Amazon Fire TV Production

To deploy CineMind AI directly to Fire TV devices:
1. **Amazon Web App Tester:** Host the built application (`dist/` folder) on HTTPS or test locally by entering the URL into Amazon Web App Tester on your Fire TV Stick / Fire TV Cube.
2. **Amazon Appstore Submission:** Package the web app with a Fire TV manifest (`manifest.json`) or bundle using Cordova / Capacitor for native APK submission.
