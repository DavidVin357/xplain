from youtube_transcript_api import YouTubeTranscriptApi
from languages import language_codes

import tiktoken
import math
import os
from dotenv import load_dotenv

load_dotenv()
model_name = os.getenv("MODEL_NAME")


def binary_search_index(time_stamp: float, transcript: list) -> int:
    l, r = 0, len(transcript) - 1
    while l <= r:
        m = (l + r) // 2
        if transcript[m]["start"] > time_stamp:
            r = m - 1
        elif transcript[m]["start"] < time_stamp:
            l = m + 1
        else:
            return m
    return min(l, r)


def get_context(timestamp: float, video_id: str, chat_history_length: int):
    transcript = YouTubeTranscriptApi.get_transcript(
        video_id=video_id, languages=language_codes
    )

    start_index = 0
    # Look 10 minutes ahead of question timestamp, too
    end_index = binary_search_index(timestamp + 600, transcript)
    context_text = ""

    for i in range(start_index, end_index + 1):
        # context_text += f"[{transcript[i]['start']}: {transcript[i]['text']}]"
        context_text += transcript[i]["text"]

    tokenizer = tiktoken.encoding_for_model(model_name=model_name)
    tokens_length = len(tokenizer.encode(context_text))

    # 500 tokens for system prompt and some buffer (max for model - 16k)
    limit = 15500 - chat_history_length

    # prune context from the beginning if it's bigger than acceptable tokens_length of 16k (improbable)
    while tokens_length >= limit:
        letters_diff = math.ceil((tokens_length - limit) * 4) + 1
        context_text = context_text[letters_diff:]
        tokens_length = len(tokenizer.encode(context_text))
    return context_text
