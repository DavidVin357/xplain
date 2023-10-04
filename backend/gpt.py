import openai
from transcript import get_context


import os
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
import datetime


def get_openai_generator(messages: list):
    openai_stream = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=messages,
        stream=True,
    )

    for event in openai_stream:
        if "content" in event["choices"][0].delta:
            current_response = event["choices"][0].delta.content
            yield "data: " + current_response + "\n\n"


def get_system_prompt(video_id: str, timestamp: float) -> str:
    context = get_context(
        timestamp=timestamp, pre_interval=300, post_interval=120, video_id=video_id
    )

    system_prompt = f""" You are going to play role of a tutor that answers person's questions about a watched video. 
    You need to answer the questions only according to the video transcript (context) which consists of parts that are in format'[timestamp: phrase]'. Here is the transcript: `{context}`.
    If it's not related to the video, tell that and try to clarify it.
    Answer the question with simple language highly related to the context provided above.
    #NEVER# mention word "transcript" when referring to the video, say "video" or "context". 
    Go through the explanation step by step but keep the answer clear and concise.
    """

    return system_prompt


# def get_timestamp_prompt(
#     video_id: str, answer_timestamp: float, answer: str, question: str
# ):
#     context = get_context(
#         timestamp=answer_timestamp, pre_interval=400, post_interval=0, video_id=video_id
#     )

#     prompt = f"""
#     Here is the transcript of the video that consists of parts which are in format'[timestamp: phrase]': {context}.
#     Here is the QUESTION asked about it: {question}
#     Here is the ANSWER given according to the mentioned transcript: {answer}
#     Give the timestamp at which video talks about the content most related to the given answer.
#     Return only a NUMBER.
#     """

#     return prompt
