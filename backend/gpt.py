from openai import OpenAI
import tiktoken

import os
from dotenv import load_dotenv
from index import get_transcript

load_dotenv()

CONTEXT_LENGTH_LIMIT = 125000  # max - 128,000 + buffer
model_name = os.getenv("CHAT_MODEL_NAME")
client = OpenAI()


def get_openai_generator(messages: list):
    completion_stream = client.chat.completions.create(
        model="gpt-4o-mini", messages=messages, stream=True, top_p=0.1
    )

    for chunk in completion_stream:
        if chunk.choices[0].delta.content is not None:
            current_response = chunk.choices[0].delta.content
            yield "data: " + current_response + "\n\n"


def get_system_prompt(video_id: str, chat_history: list) -> str:
    context = get_context(video_id=video_id, chat_history=chat_history)

    system_prompt = f""" You are going to play role of a tutor that answers person's questions about a video he/she is watching. 
    You need to answer the questions only according to the video transcript (context). Here is the transcript: \n`{context}`\n.
    Provide the answer only according to the transcript provided above. Answer with a simple language.
    If the question is not related to the video, tell that and try to clarify it.
    #NEVER# mention word "transcript" when referring to the video, always say "video" instead. 
    Go through the explanation step by step and keep the answer clear and concise.
    """

    return system_prompt


def get_context(video_id: str, chat_history: list[object]):
    chat_history_text = ""
    for chat in chat_history:
        chat_history_text += chat["content"]

    transcript = get_transcript(video_id)

    transcript_text = ""

    for t in transcript:
        transcript_text += t["text"]

    tokenizer = tiktoken.encoding_for_model(model_name=os.getenv("CHAT_MODEL_NAME"))
    chat_history_length = len(tokenizer.encode(chat_history_text))
    limit = CONTEXT_LENGTH_LIMIT - chat_history_length
    tokens = tokenizer.encode(transcript_text)

    return tokenizer.decode(tokens[:limit])
