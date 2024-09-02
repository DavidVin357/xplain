import requests
import os
from dotenv import load_dotenv
import random

load_dotenv()


def get_proxy():
    return random.choice(requests.get(os.getenv("PROXIES_URL")).text.splitlines())
