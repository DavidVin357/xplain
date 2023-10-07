import openai
from transcript import get_context
import tiktoken


import os
from dotenv import load_dotenv

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")
model_name = os.getenv("MODEL_NAME")


def get_openai_generator(messages: list):
    openai_stream = openai.ChatCompletion.create(
        model=model_name,
        messages=messages,
        stream=True,
    )

    for event in openai_stream:
        if "content" in event["choices"][0].delta:
            current_response = event["choices"][0].delta.content
            yield "data: " + current_response + "\n\n"


def get_system_prompt(video_id: str, timestamp: float, chat_history: list) -> str:
    chat_history_text = ""

    for chat in chat_history:
        chat_history_text += chat["content"]

    tokenizer = tiktoken.encoding_for_model(model_name=model_name)
    chat_history_length = len(tokenizer.encode(chat_history_text))

    context = get_context(
        timestamp=timestamp, video_id=video_id, chat_history_length=chat_history_length
    )

    system_prompt = f""" You are going to play role of a tutor that answers person's questions about a video he/she is watching. 
    You need to answer the questions only according to the video transcript (context). Here is the transcript: `{context}`.
    Provide the answer only according to the transcript provided above. Answer with a simple language.
    If the question is not related to the video, tell that and try to clarify it.
    #NEVER# mention word "transcript" when referring to the video, always say "video" instead. 
    Go through the explanation step by step and keep the answer clear and concise.
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
