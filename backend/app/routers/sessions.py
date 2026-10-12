import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Path
from ..schemas.common import APIResponse, SessionStatusEnum
from ..schemas.sessions import (
    SessionCreate,
    SessionParticipantCreate,
    VoteSubmission,
    BatchVoteSubmission,
    CalculateResultsRequest,
    GroupRecommendationResult,
    SessionStatusUpdate,
    SelectWinnerRequest,
    FamilySessionResponse
)
from ..services.supabase_service import supabase_service
from ..services.recommendation_service import rank_movies_for_family_group
from ..services.ai_explanation_service import ai_explanation_service

router = APIRouter(prefix="/api/v1/sessions", tags=["Family Movie-Night Sessions & Voting"])

@router.post("", response_model=APIResponse[FamilySessionResponse])
async def create_session(payload: SessionCreate):
    """
    Step 1: Host creates a new movie-night session for 2 to 6 participants.
    """
    session_id = f"session-{int(uuid.uuid4().hex[:12], 16)}"
    data = {
        "id": session_id,
        "title": payload.title,
        "host_profile_id": payload.host_profile_id,
        "host_name": payload.host_name,
        "participant_count": payload.participant_count,
        "status": SessionStatusEnum.SETUP.value,
        "winning_movie_id": None
    }
    session, source = await supabase_service.create_session(data)
    full_session, _ = await supabase_service.get_session(session_id)
    return APIResponse(
        success=True,
        data=full_session or session,
        source=source,
        message=f"Session '{payload.title}' created"
    )

@router.get("/{session_id}", response_model=APIResponse[FamilySessionResponse])
async def get_session(session_id: str = Path(...)):
    """Retrieve session state, participants, cast votes, and results."""
    session, source = await supabase_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found")
    return APIResponse(
        success=True,
        data=session,
        source=source,
        message="Session retrieved"
    )

@router.post("/{session_id}/participants", response_model=APIResponse[SessionParticipantCreate])
async def add_or_update_participant(
    session_id: str,
    payload: SessionParticipantCreate
):
    """
    Step 3-4: Participant creates profile / selects moods, genres, runtime, and mandatory restrictions.
    """
    session, _ = await supabase_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found")

    p_dict = payload.model_dump()
    # Format lists for Postgres array compatibility
    p_dict["preferred_moods"] = [m.value if hasattr(m, 'value') else m for m in payload.preferred_moods]
    p_dict["preferred_genres"] = [g.value if hasattr(g, 'value') else g for g in payload.preferred_genres]
    p_dict["max_age_rating"] = payload.max_age_rating.value if hasattr(payload.max_age_rating, 'value') else payload.max_age_rating

    res, source = await supabase_service.add_session_participant(session_id, p_dict)
    return APIResponse(
        success=True,
        data=payload,
        source=source,
        message=f"Participant '{payload.name}' preferences saved"
    )

@router.post("/{session_id}/votes", response_model=APIResponse[dict])
async def submit_single_vote(
    session_id: str,
    payload: VoteSubmission
):
    """
    Step 5: Cast a single vote for a movie title.
    """
    session, _ = await supabase_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found")

    res, source = await supabase_service.save_vote(
        session_id=session_id,
        participant_id=payload.participant_id,
        movie_id=payload.movie_id,
        vote=payload.vote.value if hasattr(payload.vote, 'value') else payload.vote
    )
    return APIResponse(
        success=True,
        data=res,
        source=source,
        message="Vote recorded"
    )

@router.post("/{session_id}/votes/batch", response_model=APIResponse[dict])
async def submit_batch_votes(
    session_id: str,
    payload: BatchVoteSubmission
):
    """
    Batch submit votes for candidate movies.
    """
    session, _ = await supabase_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found")

    last_source = "demo"
    for v in payload.votes:
        _, src = await supabase_service.save_vote(
            session_id=session_id,
            participant_id=v.participant_id,
            movie_id=v.movie_id,
            vote=v.vote.value if hasattr(v.vote, 'value') else v.vote
        )
        last_source = src

    return APIResponse(
        success=True,
        data={"count": len(payload.votes)},
        source=last_source,
        message=f"Recorded {len(payload.votes)} votes"
    )

@router.post("/{session_id}/calculate-results", response_model=APIResponse[List[GroupRecommendationResult]])
async def calculate_group_results(
    session_id: str,
    payload: CalculateResultsRequest
):
    """
    Step 6-7: Calculate group compatibility scores, apply mandatory restrictions,
    deterministic tie-breaking, generate explanations, and return top 3 recommendations.
    """
    session, _ = await supabase_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found")

    participants_data = session.get("participants", [])
    if len(participants_data) == 0:
        raise HTTPException(status_code=400, detail="Cannot calculate consensus: no participants in session.")

    participants: List[SessionParticipantCreate] = []
    for p in participants_data:
        participants.append(SessionParticipantCreate(**p))

    votes_map = session.get("votes", {})

    # Execute deterministic recommendation algorithm
    ranked_results = rank_movies_for_family_group(
        candidate_movies=payload.candidate_movies,
        participants=participants,
        votes=votes_map
    )

    # Attach dynamic AI explanations to top results
    for rec in ranked_results[:3]:
        g_names = [g.value if hasattr(g, 'value') else str(g) for g in rec.movie.genres]
        m_names = [m.value if hasattr(m, 'value') else str(m) for m in rec.movie.moods]
        exp = ai_explanation_service.generate_explanation(
            movie_title=rec.movie.title,
            genres=g_names,
            moods=m_names,
            audience_type=f"Family group with {len(participants)} players",
            runtime_minutes=rec.movie.runtimeMinutes,
            synopsis=rec.movie.synopsis
        )
        rec.ai_explanation = exp.vibe_check

    # Persist results and advance session to 'results' status
    results_dicts = [r.model_dump() for r in ranked_results]
    _, source = await supabase_service.save_results(session_id, results_dicts)
    await supabase_service.update_session_status(session_id, SessionStatusEnum.RESULTS.value)

    return APIResponse(
        success=True,
        data=ranked_results,
        source=source,
        message=f"Consensus calculated: {len(ranked_results)} qualified recommendations"
    )

@router.patch("/{session_id}/status", response_model=APIResponse[dict])
async def update_status(
    session_id: str,
    payload: SessionStatusUpdate
):
    """Advance session status (setup -> voting -> results -> completed)."""
    updated, source = await supabase_service.update_session_status(session_id, payload.status.value)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found")
    return APIResponse(
        success=True,
        data={"session_id": session_id, "status": payload.status.value},
        source=source,
        message="Session status updated"
    )

@router.post("/{session_id}/select-winner", response_model=APIResponse[dict])
async def select_winning_movie(
    session_id: str,
    payload: SelectWinnerRequest
):
    """
    Step 8: Choose final movie for movie-night and auto-save to shared watchlist.
    """
    session, source = await supabase_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found")

    await supabase_service.update_session_status(
        session_id=session_id,
        status=SessionStatusEnum.COMPLETED.value,
        winning_movie_id=payload.movie_id
    )

    # Auto-save to shared household watchlist
    if payload.save_to_watchlist:
        await supabase_service.add_to_watchlist({
            "profile_id": session.get("host_profile_id") or "dad",
            "movie_id": payload.movie_id,
            "movie_title": f"Feature Winner: {payload.movie_id}",
            "watched": False
        })

    return APIResponse(
        success=True,
        data={
            "session_id": session_id,
            "winning_movie_id": payload.movie_id,
            "saved_to_watchlist": payload.save_to_watchlist,
            "status": "completed"
        },
        source=source,
        message=f"Movie '{payload.movie_id}' crowned tonight's feature!"
    )
