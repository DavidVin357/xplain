from dotenv import load_dotenv
import redis
from redis.commands.search.indexDefinition import IndexDefinition, IndexType
from redis.commands.search.query import Query
from redis.commands.search.field import TextField, VectorField, NumericField
import numpy as np
from embeddings import construct_transcript_embeddings, get_embeddings, DIMENSIONS
from youtube_transcript_api import YouTubeTranscriptApi
from languages import language_codes
import json
import os
from proxies import get_proxies

load_dotenv()

redis_host = os.getenv("REDIS_HOST", "localhost")
redis_port = os.getenv("REDIS_PORT", 6379)
redis_password = os.getenv("REDIS_PASSWORD", "")

redis_client = redis.Redis(host=redis_host, port=redis_port, password=redis_password)
redis_client.ping()


TEXT_FIELD = TextField(name="text")
VECTOR_FIELD = VectorField(
    "vector",
    "FLAT",
    {
        "TYPE": "FLOAT32",
        "DIM": DIMENSIONS,
        "DISTANCE_METRIC": "COSINE",
    },
)
TIMESTAMP_FIELD = NumericField(name="timestamp")


def get_transcript(video_id: str):
    transcript = redis_client.get(video_id)

    if transcript is None:
        new_transcript = YouTubeTranscriptApi.get_transcript(
            video_id, language_codes, proxies=get_proxies()
        )
        redis_client.set(video_id, json.dumps(new_transcript))
        redis_client.expire(video_id, 60 * 60 * 24)  # 24 hours
        return new_transcript

    else:
        return json.loads(transcript)


def store_embeddings(transcript_id: str):
    try:
        result = redis_client.ft(transcript_id).search(Query("*").paging(0, 1))
        if result.total == 0:
            result = redis_client.execute_command("FT.DROPINDEX", transcript_id)
            raise
    except:
        transcript = get_transcript(transcript_id)
        transcript_df = construct_transcript_embeddings(transcript)

        # Create RediSearch Index
        redis_client.ft(transcript_id).create_index(
            fields=[TEXT_FIELD, VECTOR_FIELD, TIMESTAMP_FIELD],
            definition=IndexDefinition(
                prefix=[transcript_id], index_type=IndexType.HASH
            ),
        )

        redis_client.ft(transcript_id)

        for index, row in transcript_df.iterrows():
            vector = np.array(row["vector"], dtype=np.float32).tobytes()

            doc = {"vector": vector, "text": row["text"], "timestamp": row["start"]}
            key = f"{transcript_id}:{index}"
            redis_client.hset(
                key,
                mapping=doc,
            )
            redis_client.expire(key, 30 * 60)  # 30 minutes


def search_video(user_query: str, transcript_id: str):
    store_embeddings(transcript_id)

    query_vector = np.array(
        get_embeddings(
            [user_query],
            model="text-embedding-3-small",
        )[0],
        dtype=np.float32,
    ).tobytes()

    query = (
        Query(f"*=>[KNN 5 @vector $query_vector AS distance]")
        .sort_by("distance")
        .paging(0, 5)
        .return_fields("timestamp", "text", "distance")
        .dialect(2)
    )
    params = {"query_vector": query_vector}

    result = redis_client.ft(transcript_id).search(query, query_params=params)

    return [
        {
            "text": doc.text,
            "timestamp": doc.timestamp,
        }
        for doc in result.docs
    ]
