import os
from openai import OpenAI
from dotenv import load_dotenv
import pandas as pd

load_dotenv()
client = OpenAI()
DIMENSIONS = 256
model_name = os.getenv("EMBEDDINGS_MODEL_NAME")


def get_embeddings(texts, model=model_name):
    res = client.embeddings.create(input=texts, model=model, dimensions=DIMENSIONS).data
    return [r.embedding for r in res]


def construct_transcript_embeddings(transcript: list):
    transcript_df = pd.DataFrame().from_records(transcript)

    embeddings = []
    for i in range(0, len(transcript_df), 2048):
        texts = transcript_df.iloc[i : i + 2048]["text"].tolist()
        embeddings.extend(get_embeddings(texts))

    transcript_df["vector"] = embeddings

    return transcript_df
