from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from gpt import get_system_prompt, get_openai_generator
from index import search_video, store_embeddings


class QuestionRequest(BaseModel):
    video_id: str
    question: str
    chat_history: Optional[list] = []


class SearchResult(BaseModel):
    text: str
    timestamp: float


class SearchResponse(BaseModel):
    results: list[SearchResult]


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_origins=["*"],
)


@app.get("/health")
async def health_check():
    return "All good ;)"


@app.post("/question")
async def stream_answer(req: QuestionRequest):
    system_prompt = get_system_prompt(
        video_id=req.video_id, chat_history=req.chat_history
    )

    messages = req.chat_history + [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": req.question},
    ]

    return StreamingResponse(
        get_openai_generator(messages=messages),
        media_type="text/event-stream",
    )


@app.get("/embeddings")
async def stream_answer(video_id: str):
    store_embeddings(video_id)


@app.get("/search")
async def stream_answer(video_id: str, query: str) -> SearchResponse:
    results = search_video(query, video_id)
    return {"results": results}
