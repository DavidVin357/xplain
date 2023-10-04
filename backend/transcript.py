from youtube_transcript_api import YouTubeTranscriptApi
from languages import language_codes


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


def get_context(timestamp: float, pre_interval: int, post_interval: int, video_id: str):
    transcript = YouTubeTranscriptApi.get_transcript(
        video_id=video_id, languages=language_codes
    )
    start = timestamp - pre_interval
    end = timestamp + post_interval

    start_index = 0 if start < 0 else binary_search_index(start, transcript)
    end_index = (
        len(transcript)
        if end > transcript[-1]["start"]
        else binary_search_index(end, transcript)
    )

    context_text = ""

    for i in range(start_index, end_index + 1):
        # context_text += f"[{transcript[i]['start']}: {transcript[i]['text']}]"
        context_text += transcript[i]["text"]

    return context_text
