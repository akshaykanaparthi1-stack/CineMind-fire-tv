import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from supabase import create_client, Client
from ..config.settings import settings

logger = logging.getLogger("cinemind.supabase")

# In-Memory Fallback Demo Store for offline / unmigrated states
_demo_store = {
    "profiles": {
        "dad": {"id": "dad", "name": "David (Dad)", "avatar": "👨", "color": "#3b82f6", "role": "Parent"},
        "mom": {"id": "mom", "name": "Elena (Mom)", "avatar": "👩", "color": "#ec4899", "role": "Parent"},
        "maya": {"id": "maya", "name": "Maya (Teen, 16)", "avatar": "👧", "color": "#a855f7", "role": "Teen"},
        "leo": {"id": "leo", "name": "Leo (Kid, 8)", "avatar": "👦", "color": "#ff9900", "role": "Kid"},
        "grandma": {"id": "grandma", "name": "Rose (Grandma)", "avatar": "👵", "color": "#10b981", "role": "Parent"},
    },
    "preferences": {
        "dad": {
            "profile_id": "dad",
            "favorite_moods": ["Curious", "Adventurous"],
            "favorite_genres": ["Science Fiction", "Action", "Thriller"],
            "preferred_language": "English",
            "max_runtime_minutes": 180,
            "max_age_rating": "R",
            "avoid_violence": False,
            "avoid_strong_language": False,
            "avoid_sensitive_themes": False,
            "updated_at": datetime.now().isoformat()
        },
        "mom": {
            "profile_id": "mom",
            "favorite_moods": ["Relaxed", "Romantic"],
            "favorite_genres": ["Drama", "Comedy", "Family"],
            "preferred_language": "English",
            "max_runtime_minutes": 140,
            "max_age_rating": "PG-13",
            "avoid_violence": True,
            "avoid_strong_language": False,
            "avoid_sensitive_themes": False,
            "updated_at": datetime.now().isoformat()
        },
        "maya": {
            "profile_id": "maya",
            "favorite_moods": ["Excited", "Curious"],
            "favorite_genres": ["Animation", "Science Fiction", "Comedy"],
            "preferred_language": "English",
            "max_runtime_minutes": 140,
            "max_age_rating": "PG-13",
            "avoid_violence": False,
            "avoid_strong_language": False,
            "avoid_sensitive_themes": False,
            "updated_at": datetime.now().isoformat()
        },
        "leo": {
            "profile_id": "leo",
            "favorite_moods": ["Happy", "Excited"],
            "favorite_genres": ["Animation", "Family", "Comedy"],
            "preferred_language": "English",
            "max_runtime_minutes": 100,
            "max_age_rating": "PG",
            "avoid_violence": True,
            "avoid_strong_language": True,
            "avoid_sensitive_themes": True,
            "updated_at": datetime.now().isoformat()
        },
        "grandma": {
            "profile_id": "grandma",
            "favorite_moods": ["Relaxed", "Happy"],
            "favorite_genres": ["Drama", "Comedy", "Family"],
            "preferred_language": "English",
            "max_runtime_minutes": 120,
            "max_age_rating": "PG",
            "avoid_violence": True,
            "avoid_strong_language": True,
            "avoid_sensitive_themes": False,
            "updated_at": datetime.now().isoformat()
        }
    },
    "watchlist": [
        {
            "id": "wl-1",
            "profile_id": "maya",
            "movie_id": "spider-verse",
            "movie_title": "Spider-Man: Across the Spider-Verse",
            "poster_url": "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=600&auto=format&fit=crop&q=80",
            "backdrop_url": "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1600&auto=format&fit=crop&q=85",
            "age_rating": "PG",
            "runtime_minutes": 140,
            "watched": False,
            "added_at": datetime.now().isoformat()
        },
        {
            "id": "wl-2",
            "profile_id": "leo",
            "movie_id": "paddington-2",
            "movie_title": "Paddington 2",
            "poster_url": "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
            "backdrop_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=85",
            "age_rating": "PG",
            "runtime_minutes": 103,
            "watched": False,
            "added_at": datetime.now().isoformat()
        }
    ],
    "sessions": {},
    "participants": {},
    "votes": {},
    "results": {}
}

class SupabaseService:
    def __init__(self):
        self.client: Optional[Client] = None
        self._is_connected: bool = False
        self._tables_verified: bool = False

        if settings.supabase_url and settings.supabase_secret_key:
            try:
                self.client = create_client(settings.supabase_url, settings.supabase_secret_key)
                self._is_connected = True
                logger.info("Supabase client initialized with provided secret credentials.")
            except Exception as e:
                logger.warning(f"Failed to initialize Supabase client: {e}. Falling back to demo mode.")

    def get_status(self) -> Dict[str, Any]:
        """Check whether Supabase is reachable and whether tables are present."""
        if self.client and self._is_connected and not self._tables_verified:
            try:
                res = self.client.table("profiles").select("id").limit(1).execute()
                if res.data is not None:
                    self._tables_verified = True
            except Exception as e:
                logger.debug(f"Supabase table probe in get_status failed: {e}")

        return {
            "is_configured": bool(settings.supabase_url and settings.supabase_secret_key),
            "is_connected": self._is_connected,
            "has_secret_key": bool(settings.supabase_secret_key),
            "has_publishable_key": bool(settings.supabase_publishable_key),
            "mode": "supabase" if (self._is_connected and self._tables_verified) else "demo",
            "url": settings.supabase_url
        }

    # -------------------------------------------------------------
    # PROFILES & PREFERENCES
    # -------------------------------------------------------------
    async def get_profile(self, profile_id: str) -> Tuple[Optional[Dict[str, Any]], str]:
        """Fetch profile and its preferences."""
        if self.client:
            try:
                res = self.client.table("profiles").select("*, profile_preferences(*)").eq("id", profile_id).execute()
                if res.data and len(res.data) > 0:
                    self._tables_verified = True
                    row = res.data[0]
                    prefs = row.get("profile_preferences")
                    if isinstance(prefs, list) and len(prefs) > 0:
                        row["preferences"] = prefs[0]
                    else:
                        row["preferences"] = prefs
                    return row, "supabase"
            except Exception as e:
                logger.debug(f"Supabase get_profile query fallback: {e}")

        # Local Demo Fallback
        profile = _demo_store["profiles"].get(profile_id)
        if profile:
            profile_copy = dict(profile)
            profile_copy["preferences"] = _demo_store["preferences"].get(profile_id)
            return profile_copy, "demo"
        return None, "demo"

    async def get_preferences(self, profile_id: str) -> Tuple[Optional[Dict[str, Any]], str]:
        """Fetch preferences for a profile."""
        if self.client:
            try:
                res = self.client.table("profile_preferences").select("*").eq("profile_id", profile_id).execute()
                if res.data and len(res.data) > 0:
                    self._tables_verified = True
                    return res.data[0], "supabase"
            except Exception as e:
                logger.debug(f"Supabase get_preferences query fallback: {e}")

        # Local Demo Fallback
        prefs = _demo_store["preferences"].get(profile_id)
        return prefs, "demo"

    async def update_preferences(self, profile_id: str, updates: Dict[str, Any]) -> Tuple[Dict[str, Any], str]:
        """Update preferences in Supabase or local demo store."""
        clean_updates = {k: v for k, v in updates.items() if v is not None}
        clean_updates["updated_at"] = datetime.now().isoformat()

        if self.client:
            try:
                clean_updates["profile_id"] = profile_id
                res = self.client.table("profile_preferences").upsert(clean_updates).execute()
                if res.data and len(res.data) > 0:
                    self._tables_verified = True
                    return res.data[0], "supabase"
            except Exception as e:
                logger.debug(f"Supabase update_preferences fallback: {e}")

        # Local Demo Fallback
        if profile_id not in _demo_store["preferences"]:
            _demo_store["preferences"][profile_id] = {"profile_id": profile_id}
        _demo_store["preferences"][profile_id].update(clean_updates)
        return _demo_store["preferences"][profile_id], "demo"

    # -------------------------------------------------------------
    # WATCHLIST OPERATIONS
    # -------------------------------------------------------------
    async def get_watchlist(self, profile_id: Optional[str] = None) -> Tuple[List[Dict[str, Any]], str]:
        """Fetch watchlist items for a specific profile or all household items."""
        if self.client:
            try:
                query = self.client.table("watchlist_items").select("*").order("added_at", desc=True)
                if profile_id and profile_id != "all":
                    query = query.eq("profile_id", profile_id)
                res = query.execute()
                if res.data is not None:
                    self._tables_verified = True
                    return res.data, "supabase"
            except Exception as e:
                logger.debug(f"Supabase get_watchlist fallback: {e}")

        # Local Demo Fallback
        items = _demo_store["watchlist"]
        if profile_id and profile_id != "all":
            items = [item for item in items if item["profile_id"] == profile_id]
        return items, "demo"

    async def add_to_watchlist(self, item: Dict[str, Any]) -> Tuple[Dict[str, Any], str]:
        """Add item to watchlist."""
        item_copy = dict(item)
        item_copy.pop("is_family_shared", None)
        if "added_at" not in item_copy:
            item_copy["added_at"] = datetime.now().isoformat()
        if "watched" not in item_copy:
            item_copy["watched"] = False

        if self.client:
            try:
                res = self.client.table("watchlist_items").upsert(
                    item_copy, on_conflict="profile_id,movie_id"
                ).execute()
                if res.data and len(res.data) > 0:
                    self._tables_verified = True
                    return res.data[0], "supabase"
            except Exception as e:
                logger.debug(f"Supabase add_to_watchlist fallback: {e}")

        # Local Demo Fallback
        # Remove existing if present (upsert behavior)
        _demo_store["watchlist"] = [
            w for w in _demo_store["watchlist"]
            if not (w["profile_id"] == item_copy["profile_id"] and w["movie_id"] == item_copy["movie_id"])
        ]
        if "id" not in item_copy:
            item_copy["id"] = f"demo-wl-{len(_demo_store['watchlist']) + 1}"
        _demo_store["watchlist"].insert(0, item_copy)
        return item_copy, "demo"

    async def remove_from_watchlist(self, profile_id: str, movie_id: str) -> Tuple[bool, str]:
        """Remove item from watchlist."""
        if self.client:
            try:
                res = self.client.table("watchlist_items").delete().eq("profile_id", profile_id).eq("movie_id", movie_id).execute()
                self._tables_verified = True
                return True, "supabase"
            except Exception as e:
                logger.debug(f"Supabase remove_from_watchlist fallback: {e}")

        # Local Demo Fallback
        initial_len = len(_demo_store["watchlist"])
        _demo_store["watchlist"] = [
            w for w in _demo_store["watchlist"]
            if not (w["profile_id"] == profile_id and w["movie_id"] == movie_id)
        ]
        return len(_demo_store["watchlist"]) < initial_len, "demo"

    async def toggle_watched(self, profile_id: str, movie_id: str, watched: bool) -> Tuple[Optional[Dict[str, Any]], str]:
        """Toggle watched status."""
        if self.client:
            try:
                res = self.client.table("watchlist_items").update({"watched": watched}).eq("profile_id", profile_id).eq("movie_id", movie_id).execute()
                if res.data and len(res.data) > 0:
                    self._tables_verified = True
                    return res.data[0], "supabase"
            except Exception as e:
                logger.debug(f"Supabase toggle_watched fallback: {e}")

        # Local Demo Fallback
        for item in _demo_store["watchlist"]:
            if item["profile_id"] == profile_id and item["movie_id"] == movie_id:
                item["watched"] = watched
                return item, "demo"
        return None, "demo"

    # -------------------------------------------------------------
    # FAMILY SESSIONS & CONSENSUS
    # -------------------------------------------------------------
    async def create_session(self, session_data: Dict[str, Any]) -> Tuple[Dict[str, Any], str]:
        """Create a new movie-night session."""
        session_id = session_data["id"]
        now = datetime.now().isoformat()
        session_data["created_at"] = now
        session_data["updated_at"] = now

        if self.client:
            try:
                res = self.client.table("family_sessions").insert(session_data).execute()
                if res.data and len(res.data) > 0:
                    self._tables_verified = True
                    return res.data[0], "supabase"
            except Exception as e:
                logger.debug(f"Supabase create_session fallback: {e}")

        _demo_store["sessions"][session_id] = session_data
        _demo_store["participants"][session_id] = []
        _demo_store["votes"][session_id] = {}
        _demo_store["results"][session_id] = []
        return session_data, "demo"

    async def get_session(self, session_id: str) -> Tuple[Optional[Dict[str, Any]], str]:
        """Get full session data including participants, votes, and results."""
        if self.client:
            try:
                res = self.client.table("family_sessions").select(
                    "*, session_participants(*), session_votes(*), session_results(*)"
                ).eq("id", session_id).execute()
                if res.data and len(res.data) > 0:
                    self._tables_verified = True
                    s = res.data[0]
                    # Structure votes into map
                    votes_map: Dict[str, Dict[str, str]] = {}
                    for v in s.get("session_votes", []):
                        m_id = v["movie_id"]
                        p_id = v["participant_id"]
                        if m_id not in votes_map:
                            votes_map[m_id] = {}
                        votes_map[m_id][p_id] = v["vote"]

                    return {
                        "id": s["id"],
                        "title": s["title"],
                        "host_name": s["host_name"],
                        "participant_count": s["participant_count"],
                        "status": s["status"],
                        "winning_movie_id": s.get("winning_movie_id"),
                        "participants": s.get("session_participants", []),
                        "votes": votes_map,
                        "results": s.get("session_results", []),
                        "created_at": s.get("created_at"),
                        "updated_at": s.get("updated_at")
                    }, "supabase"
            except Exception as e:
                logger.debug(f"Supabase get_session fallback: {e}")

        # Local Demo Fallback
        s = _demo_store["sessions"].get(session_id)
        if not s:
            return None, "demo"

        return {
            "id": s["id"],
            "title": s["title"],
            "host_name": s["host_name"],
            "participant_count": s["participant_count"],
            "status": s["status"],
            "winning_movie_id": s.get("winning_movie_id"),
            "participants": _demo_store["participants"].get(session_id, []),
            "votes": _demo_store["votes"].get(session_id, {}),
            "results": _demo_store["results"].get(session_id, []),
            "created_at": s.get("created_at"),
            "updated_at": s.get("updated_at")
        }, "demo"

    async def add_session_participant(self, session_id: str, participant: Dict[str, Any]) -> Tuple[Dict[str, Any], str]:
        """Add participant to session."""
        participant["session_id"] = session_id
        if self.client:
            try:
                res = self.client.table("session_participants").upsert(
                    participant, on_conflict="session_id,participant_id"
                ).execute()
                if res.data and len(res.data) > 0:
                    self._tables_verified = True
                    return res.data[0], "supabase"
            except Exception as e:
                logger.debug(f"Supabase add_session_participant fallback: {e}")

        # Local Demo Fallback
        if session_id not in _demo_store["participants"]:
            _demo_store["participants"][session_id] = []
        _demo_store["participants"][session_id] = [
            p for p in _demo_store["participants"][session_id]
            if p["participant_id"] != participant["participant_id"]
        ]
        _demo_store["participants"][session_id].append(participant)
        return participant, "demo"

    async def save_vote(self, session_id: str, participant_id: str, movie_id: str, vote: str) -> Tuple[Dict[str, Any], str]:
        """Save a single participant vote for a movie."""
        vote_record = {
            "session_id": session_id,
            "participant_id": participant_id,
            "movie_id": movie_id,
            "vote": vote
        }
        if self.client:
            try:
                res = self.client.table("session_votes").upsert(
                    vote_record, on_conflict="session_id,participant_id,movie_id"
                ).execute()
                if res.data and len(res.data) > 0:
                    self._tables_verified = True
                    return res.data[0], "supabase"
            except Exception as e:
                logger.debug(f"Supabase save_vote fallback: {e}")

        # Local Demo Fallback
        if session_id not in _demo_store["votes"]:
            _demo_store["votes"][session_id] = {}
        if movie_id not in _demo_store["votes"][session_id]:
            _demo_store["votes"][session_id][movie_id] = {}
        _demo_store["votes"][session_id][movie_id][participant_id] = vote
        return vote_record, "demo"

    async def save_results(self, session_id: str, results: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], str]:
        """Persist ranked consensus results."""
        if self.client:
            try:
                db_records = []
                for r in results:
                    db_records.append({
                        "session_id": session_id,
                        "movie_id": r["movie"]["id"],
                        "rank": r["rank"],
                        "compatibility_score": r["compatibility_score"],
                        "shared_interests": r.get("shared_interests", []),
                        "compromises_made": r.get("compromises_made", []),
                        "participant_breakdowns": [p.dict() if hasattr(p, 'dict') else p for p in r.get("participant_breakdowns", [])],
                        "ai_explanation": r.get("ai_explanation")
                    })
                res = self.client.table("session_results").upsert(
                    db_records, on_conflict="session_id,movie_id"
                ).execute()
                if res.data:
                    self._tables_verified = True
                    return results, "supabase"
            except Exception as e:
                logger.debug(f"Supabase save_results fallback: {e}")

        # Local Demo Fallback
        _demo_store["results"][session_id] = results
        return results, "demo"

    async def update_session_status(self, session_id: str, status: str, winning_movie_id: Optional[str] = None) -> Tuple[bool, str]:
        """Update session status and optional winner."""
        updates: Dict[str, Any] = {"status": status, "updated_at": datetime.now().isoformat()}
        if winning_movie_id:
            updates["winning_movie_id"] = winning_movie_id

        if self.client:
            try:
                res = self.client.table("family_sessions").update(updates).eq("id", session_id).execute()
                self._tables_verified = True
                return True, "supabase"
            except Exception as e:
                logger.debug(f"Supabase update_session_status fallback: {e}")

        if session_id in _demo_store["sessions"]:
            _demo_store["sessions"][session_id].update(updates)
            return True, "demo"
        return False, "demo"

supabase_service = SupabaseService()
