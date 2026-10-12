# 🎬 CineMind — Fire TV Smart Entertainment Discovery & Family Vote

> **Amazon Developer Hackathon — Fire TV Track**  
> An AI-powered 10-foot living room entertainment discovery application designed specifically for televisions, remote controls, and multi-generational households.

---

## 🌟 The Problem CineMind Solves

Every evening, millions of families and friend groups sit in front of the TV spending 20 to 45 minutes endlessly scrolling through streaming catalogues, unable to decide what to watch. Different people want different things:
- **Dad** wants a high-octane sci-fi thriller.
- **Mom** wants a smart, thought-provoking drama or feel-good story.
- **Teenagers** want cutting-edge animation or fast-paced humor.
- **Kids** have strict bedtime schedules (< 90 minutes) and strict content ratings (G/PG).

**CineMind solves living room decision fatigue** with its signature **Family Vote** consensus engine, multi-dimensional emotional mood matching, and spoiler-free AI recommendations.

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
  - 🧠 *CineMind Top Picks For Your Family*
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

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **10-Foot TV Design System:** Plus Jakarta Sans & Outfit typography, custom D-pad spatial focus rings, glassmorphism, responsive 1080p/4K layouts
- **Backend Service:** Python 3.11+ FastAPI, Pydantic v2 validation, Uvicorn, httpx, boto3
- **AI Recommendation Engine:** Amazon Bedrock (Anthropic Claude 3 Haiku & Amazon Titan), OpenAI API adapter, and deterministic fallback NLP engine
- **Database & Persistence:** Supabase / PostgreSQL (Row-Level Security, JSONB preferences, JWT/JWKS token verification)
- **Metadata Provider:** The Movie Database (TMDB v3) via secure backend proxy with JustWatch streaming verification
- **Audio Feedback:** Web Audio API synthesized remote acoustic clicks, chimes, and winner fanfares
- **Testing:** Pytest & pytest-asyncio (Backend), Vitest (Frontend)

---

## 🧠 AI Recommendation Assistant

CineMind features an intelligent, multi-modal **AI Recommendation Assistant** designed specifically for 10-foot living room interaction and Fire TV Alexa voice integration.

### 1. Multi-Provider Architecture with Clean Adapters
The AI system is built with a decoupled provider architecture (`backend/app/services/ai/`):
- **Amazon Bedrock (Primary / Fire TV Track):** Leverages `anthropic.claude-3-haiku-20240307-v1:0` or Amazon Titan Text Express via AWS `boto3` for high-speed, cost-effective, living-room-tailored responses.
- **OpenAI Adapter (Secondary):** Supports `gpt-4o-mini` or compatible chat completion endpoints.
- **Deterministic Fallback Engine (Zero-Downtime Guarantee):** Built-in rule-based NLP parser with regex token extractors for moods, genres, runtimes (e.g., *"under 100 minutes"* &rarr; `100`), age rating ceilings, and tone meters. Operates offline without external API keys.
- **Runtime Provider Switching:** Automatically selected via `AI_PROVIDER=auto` (Bedrock &rarr; OpenAI &rarr; Fallback) or forced via header/configuration.

### 2. Natural-Language Request Parsing
Converts everyday speech and voice commands into structured, validated filters:
- *"Find a funny family movie under 100 minutes"* &rarr;
  ```json
  {
    "moods": ["Happy"],
    "genres": ["Comedy", "Family"],
    "max_runtime_minutes": 100,
    "max_age_rating": "PG"
  }
  ```
- **Ambiguity & Context Awareness:** Detects vague inputs (e.g. *"give me something good"*) and gracefully prompts the user for preferred genres or moods instead of guessing wildly.

### 3. Strict Zero-Hallucination Integrity Constraint
- The LLM interprets the user's intent and provides rich, spoiler-free explanations, but **ranking and selection are strictly performed by the recommendation algorithm** against verified metadata (`SAMPLE_MOVIES` or TMDB catalog).
- The model is **never permitted to invent movie titles, cast members, ratings, runtimes, or streaming availability**.
- Every recommendation is validated against the local catalog before presenting it to the user.

### 4. Mandatory Content & Age-Rating Restrictions
- **Child Profile Auto-Lock:** When a kid profile (such as 8-year-old Leo) is active or included in a Family Vote session, the system enforces a strict ceiling (e.g., **PG**).
- Any candidate movie violating a participant's mandatory age-rating or content restriction is **strictly eliminated prior to scoring**.
- If no movie matches all constraints, the system explicitly explains the conflict and suggests relaxing one parameter.

### 5. Multi-User Family Consensus Explanations
- CineMind synthesizes the distinct preferences of multiple family members:
  - Explains the **shared compromise** (e.g., *"Paddington 2 satisfies Dad's request for witty British humor, Mom's desire for warmth, and Leo's strict PG bedtime limit"*).
  - Provides concise, spoiler-free vibe summaries and dynamic tone meters (Humor, Thrill, Emotional Heart, Pacing Energy).

---

## ⚡ FastAPI Backend Architecture

The backend (`backend/app/`) provides high-performance REST APIs with strict Pydantic v2 schemas:

```
backend/
├── app/
│   ├── config/             # Environment settings & credentials
│   ├── routers/            # Modular FastAPI routers
│   │   ├── assistant.py    # AI query, single-match & group consensus explanations
│   │   ├── recommendations.py # Algorithmic scoring & personalized recommendations
│   │   ├── preferences.py  # User profile & viewing preference management
│   │   ├── sessions.py     # Family Vote multi-member session management
│   │   ├── watchlist.py    # Shared household watchlist
│   │   └── health.py       # Health check & provider status endpoints
│   ├── schemas/            # Pydantic v2 request/response schemas
│   ├── services/           # Business logic & external adapters
│   │   ├── ai/             # Bedrock, OpenAI, Fallback providers & AssistantService
│   │   ├── recommendation_service.py # Scoring & compatibility algorithm
│   │   └── supabase_service.py       # Supabase PostgreSQL persistence
│   └── main.py             # FastAPI app factory with CORS & OpenAPI docs
├── migrations/             # SQL migration scripts (001_initial_schema.sql)
├── tests/                  # Pytest test suite (16 tests)
├── requirements.txt        # Backend dependencies (fastapi, boto3, supabase, etc.)
└── .env.example            # Environment configuration template
```

### Backend API Documentation
When running, interactive OpenAPI documentation is available at:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

---

## 🗄️ Database & Supabase Setup

CineMind uses **Supabase / PostgreSQL** for scalable persistence with Row-Level Security (RLS).

### Schema Tables (`backend/migrations/001_initial_schema.sql`):
1. `profiles`: Household members with avatar, kid flags, and age rating ceilings.
2. `user_preferences`: Preferred moods, genres, languages, and preferred max runtime.
3. `watchlist_items`: Shared living room queue with `added_by` attribution and watched status.
4. `family_sessions`: Multi-user voting sessions with host ID, passcodes, and active states.
5. `session_participants`: Profiles connected to a voting session with temporary preference overrides.
6. `participant_votes`: Votes (*love*, *neutral*, *skip*) cast by members during voting arena.
7. `session_results`: Final consensus rankings, group compatibility %, and winning selections.

### Running Migrations:
Execute `backend/migrations/001_initial_schema.sql` in the **Supabase SQL Editor** or via PostgreSQL client to create all tables, indexes, constraints, and Row-Level Security policies.

---

## 🏃 Getting Started & Testing

### 1. Prerequisites
- **Node.js:** v18+ (v20+ recommended)
- **Python:** 3.11+
- **npm** or **pnpm**

### 2. Backend Setup & Startup
```bash
# Navigate to project root
cd /path/to/cinemind-ai

# Install Python dependencies
pip install -r backend/requirements.txt

# Configure backend environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your AWS Bedrock, Supabase, or OpenAI keys (or use fallback)

# Start FastAPI server
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend will be available at **`http://localhost:8000`**.

### 3. Frontend Setup & Startup
```bash
# Install frontend dependencies
npm install

# Start Vite development server
npm run dev -- --host --port 5173
```
Open **`http://localhost:5173`** in your browser.

### 4. Running Test Suites
Both backend and frontend feature automated test suites:

```bash
# Run Backend Pytest suite (16 tests covering AI filters, Bedrock adapter, zero-hallucination validation, RLS, and scoring)
python -m pytest backend/tests/ -v

# Run Frontend Vitest suite (19 tests covering Family Vote scoring, TMDB integration, and error fallbacks)
npm test

# Build production bundle
npm run build
```

---

## 🌐 TMDB Movie Metadata Integration & API Setup

CineMind integrates with **The Movie Database (TMDB)** for real-time movie search, trending and popular discovery, official age ratings, backdrops, cast records, and verified JustWatch streaming availability.

### 1. Zero-Leak Security Architecture
- **Private API Key Isolation:** TMDB API keys and Read Access Tokens are **never exposed to client-side bundles or browser network requests**.
- **Server Backend Proxy:** All metadata requests are routed through the local backend proxy (`/api/tmdb/*`) built into `vite.config.ts`.
- **Automatic Fallback:** If `TMDB_API_KEY` is not configured, or if an HTTP 429 rate limit is reached, CineMind seamlessly operates using its verified sample database without interrupting user experience.

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

## 📺 10-Foot Television & Remote Navigation Guide

| Remote Button / Key | Action |
|:---|:---|
| **Arrow Up / Down / Left / Right** | 2D Spatial navigation across shelves, cards, tabs, and action buttons |
| **Enter / OK (Select)** | Activate selected movie, trigger buttons, or open trailer preview |
| **Esc / Backspace (Back)** | Close movie details modal, cancel modal, or return to Home screen |
| **[R] Key / On-screen Remote** | Opens the **Virtual Fire TV Remote Controller** overlay with tactile D-pad |
| **Alexa Voice Button** | Simulates Fire TV Alexa AI voice discovery queries (e.g., *"Find funny family comedies under 100 minutes"*) |

---

## 📦 Adapting for Amazon Fire TV Production

To deploy CineMind directly to Fire TV devices:
1. **Amazon Web App Tester:** Host the built application (`dist/` folder) on HTTPS or test locally by entering the URL into Amazon Web App Tester on your Fire TV Stick / Fire TV Cube.
2. **Amazon Appstore Submission:** Package the web app with a Fire TV manifest (`manifest.json`) or bundle using Cordova / Capacitor for native APK submission.

