-- ====================================================================
-- CineMind: Supabase PostgreSQL Database Schema
-- Amazon Developer Hackathon (Fire TV Track)
-- ====================================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    avatar VARCHAR(32) NOT NULL,
    color VARCHAR(32) NOT NULL DEFAULT '#ff9900',
    role VARCHAR(20) NOT NULL CHECK (role IN ('Parent', 'Teen', 'Kid')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PROFILE PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.profile_preferences (
    profile_id VARCHAR(64) PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    favorite_moods TEXT[] NOT NULL DEFAULT '{}',
    favorite_genres TEXT[] NOT NULL DEFAULT '{}',
    preferred_language VARCHAR(32) NOT NULL DEFAULT 'English',
    max_runtime_minutes INT NOT NULL DEFAULT 150,
    max_age_rating VARCHAR(10) NOT NULL DEFAULT 'PG-13' CHECK (max_age_rating IN ('G', 'PG', 'PG-13', 'TV-14', 'R', 'TV-MA', 'Unrated')),
    avoid_violence BOOLEAN NOT NULL DEFAULT FALSE,
    avoid_strong_language BOOLEAN NOT NULL DEFAULT FALSE,
    avoid_sensitive_themes BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. WATCHLIST ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.watchlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id VARCHAR(64) NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    movie_id VARCHAR(128) NOT NULL,
    movie_title VARCHAR(255) NOT NULL,
    poster_url TEXT,
    backdrop_url TEXT,
    age_rating VARCHAR(10) DEFAULT 'PG',
    runtime_minutes INT DEFAULT 110,
    watched BOOLEAN NOT NULL DEFAULT FALSE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_profile_movie UNIQUE(profile_id, movie_id)
);

-- 4. FAMILY SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.family_sessions (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    host_profile_id VARCHAR(64),
    host_name VARCHAR(100) NOT NULL,
    participant_count INT NOT NULL CHECK (participant_count BETWEEN 2 AND 6),
    status VARCHAR(32) NOT NULL DEFAULT 'setup' CHECK (status IN ('setup', 'voting', 'results', 'completed')),
    winning_movie_id VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. SESSION PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.session_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(64) NOT NULL REFERENCES public.family_sessions(id) ON DELETE CASCADE,
    participant_id VARCHAR(64) NOT NULL,
    name VARCHAR(100) NOT NULL,
    avatar VARCHAR(32) NOT NULL,
    color VARCHAR(32) NOT NULL DEFAULT '#ff9900',
    is_temporary BOOLEAN NOT NULL DEFAULT FALSE,
    preferred_moods TEXT[] NOT NULL DEFAULT '{}',
    preferred_genres TEXT[] NOT NULL DEFAULT '{}',
    preferred_language VARCHAR(32) NOT NULL DEFAULT 'English',
    max_runtime_minutes INT NOT NULL DEFAULT 120,
    max_age_rating VARCHAR(10) NOT NULL DEFAULT 'PG-13',
    avoid_violence BOOLEAN NOT NULL DEFAULT FALSE,
    avoid_strong_language BOOLEAN NOT NULL DEFAULT FALSE,
    avoid_sensitive_themes BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_session_participant UNIQUE(session_id, participant_id)
);

-- 6. SESSION VOTES TABLE
CREATE TABLE IF NOT EXISTS public.session_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(64) NOT NULL REFERENCES public.family_sessions(id) ON DELETE CASCADE,
    participant_id VARCHAR(64) NOT NULL,
    movie_id VARCHAR(128) NOT NULL,
    vote VARCHAR(20) NOT NULL CHECK (vote IN ('love', 'like', 'neutral', 'dislike', 'veto')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_session_participant_movie UNIQUE(session_id, participant_id, movie_id)
);

-- 7. SESSION RESULTS TABLE
CREATE TABLE IF NOT EXISTS public.session_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(64) NOT NULL REFERENCES public.family_sessions(id) ON DELETE CASCADE,
    movie_id VARCHAR(128) NOT NULL,
    rank INT NOT NULL CHECK (rank BETWEEN 1 AND 10),
    compatibility_score NUMERIC(5,2) NOT NULL CHECK (compatibility_score BETWEEN 0 AND 100),
    shared_interests TEXT[] NOT NULL DEFAULT '{}',
    compromises_made TEXT[] NOT NULL DEFAULT '{}',
    participant_breakdowns JSONB NOT NULL DEFAULT '[]'::jsonb,
    ai_explanation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_session_result_movie UNIQUE(session_id, movie_id)
);

-- ====================================================================
-- PERFORMANCE INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_watchlist_profile ON public.watchlist_items(profile_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_movie ON public.watchlist_items(movie_id);
CREATE INDEX IF NOT EXISTS idx_participants_session ON public.session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_votes_session ON public.session_votes(session_id);
CREATE INDEX IF NOT EXISTS idx_votes_movie ON public.session_votes(movie_id);
CREATE INDEX IF NOT EXISTS idx_results_session ON public.session_results(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON public.family_sessions(created_at DESC);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_results ENABLE ROW LEVEL SECURITY;

-- Allow public / anon reading and writing for the household Fire TV app
CREATE POLICY "Public profiles access" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public preferences access" ON public.profile_preferences FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public watchlist access" ON public.watchlist_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public sessions access" ON public.family_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public participants access" ON public.session_participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public votes access" ON public.session_votes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public results access" ON public.session_results FOR ALL USING (true) WITH CHECK (true);

-- ====================================================================
-- INITIAL SEED DATA FOR HOUSEHOLD PROFILES
-- ====================================================================
INSERT INTO public.profiles (id, name, avatar, color, role) VALUES
    ('dad', 'David (Dad)', '👨', '#3b82f6', 'Parent'),
    ('mom', 'Elena (Mom)', '👩', '#ec4899', 'Parent'),
    ('maya', 'Maya (Teen, 16)', '👧', '#a855f7', 'Teen'),
    ('leo', 'Leo (Kid, 8)', '👦', '#ff9900', 'Kid'),
    ('grandma', 'Rose (Grandma)', '👵', '#10b981', 'Parent')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profile_preferences 
    (profile_id, favorite_moods, favorite_genres, preferred_language, max_runtime_minutes, max_age_rating, avoid_violence, avoid_strong_language, avoid_sensitive_themes) 
VALUES
    ('dad', ARRAY['Curious', 'Adventurous'], ARRAY['Science Fiction', 'Action', 'Thriller'], 'English', 180, 'R', FALSE, FALSE, FALSE),
    ('mom', ARRAY['Relaxed', 'Romantic'], ARRAY['Drama', 'Comedy', 'Family'], 'English', 140, 'PG-13', TRUE, FALSE, FALSE),
    ('maya', ARRAY['Excited', 'Curious'], ARRAY['Animation', 'Science Fiction', 'Comedy'], 'English', 140, 'PG-13', FALSE, FALSE, FALSE),
    ('leo', ARRAY['Happy', 'Excited'], ARRAY['Animation', 'Family', 'Comedy'], 'English', 100, 'PG', TRUE, TRUE, TRUE),
    ('grandma', ARRAY['Relaxed', 'Happy'], ARRAY['Drama', 'Comedy', 'Family'], 'English', 120, 'PG', TRUE, TRUE, FALSE)
ON CONFLICT (profile_id) DO NOTHING;
