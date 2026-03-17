"""Memory routes - greeting and session"""
from fastapi import APIRouter, HTTPException

from models.schemas import SessionRequest
from services import supabase_service
from services.llm_service import generate_greeting

router = APIRouter()


@router.get("/memory/{student_id}")
async def get_memory(student_id: str):
    """Get student info, recent sessions, and personalized greeting."""
    try:
        student = supabase_service.get_student(student_id)
        recent_sessions = supabase_service.get_recent_sessions(student_id)
        greeting = generate_greeting(student["name"], recent_sessions)
        return {
            "student_name": student["name"],
            "greeting": greeting,
            "recent_sessions": recent_sessions,
            "status": "success",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/memory/session")
async def create_session(body: SessionRequest):
    """Save study session."""
    try:
        row = supabase_service.save_session(
            student_id=body.student_id,
            topics=body.topics_covered,
            goals=body.goals,
            duration=body.duration_mins,
        )
        return {"session_id": row["id"], "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/memory/heatmap/{student_id}")
async def get_heatmap(student_id: str):
    """Return study minutes grouped per date for heatmap visualization."""
    try:
        res = (
            supabase_service.supabase
            .table("sessions")
            .select("created_at, duration_mins")
            .eq("student_id", student_id)
            .execute()
        )

        heatmap: dict[str, int] = {}
        for session in res.data or []:
            date = (session.get("created_at") or "")[:10]
            mins = session.get("duration_mins", 0) or 0
            if not date:
                continue
            heatmap[date] = heatmap.get(date, 0) + int(mins)

        return {"heatmap": heatmap, "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
