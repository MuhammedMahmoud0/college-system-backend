import os
import re
from pathlib import Path

import pandas as pd
import torch
from dotenv import load_dotenv
from flask import Flask, request
from sentence_transformers import CrossEncoder, SentenceTransformer, util
import google.generativeai as genai

BASE_DIR = Path(__file__).resolve().parent
ASSETS_DIR = BASE_DIR / "flask_assets_bundle"

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("GEMINI_API_KEY is not set. Add it to .env or the environment.")

genai.configure(api_key=api_key)
llm_model = genai.GenerativeModel("gemini-2.5-flash")


def preprocess_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"[^a-z\s]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def load_data_and_models():
    df = pd.read_csv(BASE_DIR / "Coursera.csv")
    df = df[
        [
            "Course Name",
            "Course Description",
            "Skills",
            "Course Rating",
            "Difficulty Level",
            "Course URL",
        ]
    ]

    df.columns = df.columns.str.replace(" ", "_").str.lower()

    df.drop_duplicates(inplace=True)
    df["course_rating"] = pd.to_numeric(df["course_rating"], errors="coerce")
    df.dropna(inplace=True)

    df["text"] = df["course_name"] + " " + df["course_description"] + " " + df["skills"]
    df["text"] = df["text"].apply(preprocess_text)

    device = "cuda" if torch.cuda.is_available() else "cpu"

    bi_encoder = SentenceTransformer(
        str(ASSETS_DIR / "bi_encoder_model"), device=device
    )
    cross_encoder = CrossEncoder(str(ASSETS_DIR / "cross_encoder_model"), device=device)

    embeddings_path = ASSETS_DIR / "course_embeddings.pt"
    course_embeddings = torch.load(embeddings_path, map_location=device)
    if not isinstance(course_embeddings, torch.Tensor):
        course_embeddings = torch.tensor(course_embeddings)
    course_embeddings = course_embeddings.to(device)

    if len(df) != course_embeddings.shape[0]:
        raise ValueError(
            "Embedding count does not match dataset rows. Regenerate embeddings to proceed."
        )

    return df, bi_encoder, cross_encoder, course_embeddings


def recommend_courses(query: str, top_n: int = 5, initial_k: int = 50):
    query_embedding = bi_encoder.encode(query, convert_to_tensor=True)
    if query_embedding.device != course_embeddings.device:
        query_embedding = query_embedding.to(course_embeddings.device)

    hits = util.semantic_search(query_embedding, course_embeddings, top_k=initial_k)[0]

    cross_inp = []
    for hit in hits:
        text = df.iloc[hit["corpus_id"]]["text"]
        cross_inp.append([query, text])

    cross_scores = cross_encoder.predict(cross_inp)
    for idx, score in enumerate(cross_scores):
        hits[idx]["cross_score"] = float(score)

    hits = sorted(hits, key=lambda x: x["cross_score"], reverse=True)

    results = []
    for hit in hits[:top_n]:
        row = df.iloc[hit["corpus_id"]]
        results.append(
            {
                "course_name": row["course_name"],
                "difficulty": row["difficulty_level"],
                "rating": float(row["course_rating"]),
                "url": row["course_url"],
                "similarity_score": round(float(hit["score"]), 3),
                "cross_encoder_score": round(float(hit["cross_score"]), 3),
            }
        )

    return results


def build_prompt(user_query: str, courses):
    context_text = ""
    for i, course in enumerate(courses):
        context_text += f"Course {i + 1}: {course['course_name']}\n"
        context_text += f"- Difficulty: {course.get('difficulty', 'N/A')}\n"
        context_text += f"- Rating: {course.get('rating', 'N/A')} stars\n"
        context_text += f"- Link: {course.get('url', 'N/A')}\n\n"

    prompt = f"""
The student just said: "{user_query}"

Here are the top courses retrieved from our database that match their request:
{context_text}

Your task:
1. Greet the student briefly.
2. Recommend the best options from the list above based on what they asked.
3. Briefly explain why these courses fit their needs.
4. Provide the links so they can easily enroll.
5. CRITICAL: Do NOT invent or recommend any courses that are not in the database list provided above.
"""
    return prompt


def generate_llm_response(user_query: str, top_n: int = 4):
    top_courses = recommend_courses(query=user_query, top_n=top_n)
    prompt = build_prompt(user_query, top_courses)
    response = llm_model.generate_content(prompt)
    return response.text, top_courses


app = Flask(__name__)


def infer_top_n_from_query(query: str, default: int = 4) -> int:
    match = re.search(r"\b(\d+)\b", query)
    if not match:
        return default

    try:
        value = int(match.group(1))
    except ValueError:
        return default

    return max(1, min(value, 10))


# Load everything once at startup
try:
    df, bi_encoder, cross_encoder, course_embeddings = load_data_and_models()
except Exception as exc:
    raise RuntimeError(f"Failed to load data/models: {exc}")


@app.post("/recommend")
def recommend_api():
    data = request.get_json(silent=True) or {}
    query = str(data.get("query", "")).strip()

    if not query:
        return "Missing 'query' in request body.", 400

    top_n = infer_top_n_from_query(query)
    llm_text, _ = generate_llm_response(query, top_n=top_n)
    return llm_text


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
