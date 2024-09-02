import requests
import os
from dotenv import load_dotenv
import random
from youtube_transcript_api import YouTubeTranscriptApi
from languages import language_codes

load_dotenv()


def get_proxy():
    return random.choice(requests.get(os.getenv("PROXIES_URL")).text.splitlines())


def fetch_transcript(video_id: str):
    try:
        default_proxy = os.getenv("DEFAULT_PROXY")

        return YouTubeTranscriptApi.get_transcript(
            video_id,
            language_codes,
            proxies={"http": default_proxy, "https": default_proxy},
        )

    except Exception:
        new_proxy = random.choice(
            requests.get(os.getenv("PROXIES_URL")).text.splitlines()
        )
        proxy_parts = new_proxy.split(":")
        http_proxy = f"http://{proxy_parts[2]}:{proxy_parts[3]}@{proxy_parts[0]}:{proxy_parts[1]}"

        new_transcript = YouTubeTranscriptApi.get_transcript(
            video_id,
            language_codes,
            proxies={
                "http": http_proxy,
                "https": http_proxy,
            },
        )

        os.environ["DEFAULT_PROXY"] = http_proxy

        return new_transcript
