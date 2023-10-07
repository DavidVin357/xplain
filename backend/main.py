from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from gpt import get_openai_generator, get_system_prompt
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional


class QuestionRequest(BaseModel):
    video_id: str
    timestamp: float
    question: str
    chat_history: Optional[list] = []


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
        video_id=req.video_id, timestamp=req.timestamp, chat_history=req.chat_history
    )

    messages = req.chat_history + [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": req.question},
    ]

    return StreamingResponse(
        get_openai_generator(messages=messages),
        media_type="text/event-stream",
    )


# @app.post("/timestamp")
# async def getTimestamp(req: TimeStampRequest):
#     # system_prompt = "When asked about the timestamp, find the timestamp in transcript given to you previously and return only the number."
#     prompt = get_timestamp_prompt(
#         video_id=req.video_id,
#         answer_timestamp=req.timestamp,
#         question=prompt,
#     )
#     messages = [
#         {"role": "user", "content": prompt},
#     ]

#     completion = openai.ChatCompletion.create(model="gpt-3.5-turbo", messages=messages)
#     timestamp = completion.choices[0].message.content

#     ("response is", timestamp)
#     if timestamp.isdigit():
#         return float(timestamp)
#     else:
#         return "Sorry, timestamp was not found"
