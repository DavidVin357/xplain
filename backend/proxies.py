import requests
import os
from dotenv import load_dotenv

load_dotenv()


def get_proxies():
    return requests.get(os.getenv("PROXIES_URL")).text.splitlines()
