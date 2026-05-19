from google import genai
from dotenv import load_dotenv
import os
from pathlib import Path

# ALWAYS load correct .env path
load_dotenv(Path(__file__).resolve().parent / ".env")

api_key = os.getenv("GEMINI_API_KEY")

print("DEBUG KEY:", api_key)

client = genai.Client(api_key=api_key)

for m in client.models.list():
    print(m.name)