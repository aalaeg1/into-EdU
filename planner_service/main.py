# planner_service/main.py
import os
import io
import base64
import re
import json
from datetime import datetime, timedelta

import fitz  # PyMuPDF
import pandas as pd
import matplotlib
matplotlib.use("Agg")  # headless servers
import matplotlib.pyplot as plt
import matplotlib.dates as mdates

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import together

# ---------------- Config ----------------
DEFAULT_LLM_MODEL = "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free"
TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY", "")  # set in shell: $env:TOGETHER_API_KEY="sk-..."

STRICT_PROMPT_HEADER = """
Tu es un expert en ingénierie pédagogique francophone.
RÉPONDS UNIQUEMENT dans le format ci-dessous, sans aucune explication ni balise <think>.
Si tu ajoutes autre chose que le format demandé, la sortie sera rejetée.

#PLAN_COURS
Titre: <titre court du cours>
Public: <débutant|intermédiaire|avancé>
Objectif_global: <1-2 phrases claires>
Total_heures: <entier entre 4 et 120>
Prerequis:
- <préreq 1>
- <préreq 2>
Competences:
- <comp 1>
- <comp 2>
Modules:
1. <Titre module 1> | Heures: <entier>
   Contenu:
   - <sous-partie 1>
   - <sous-partie 2>
2. <Titre module 2> | Heures: <entier>
   Contenu:
   - <sous-partie 1>
   - <sous-partie 2>
(Ajoute 4 à 10 modules selon la taille du cours. Les heures des modules DOIVENT sommer à Total_heures.)

#CONTRAINTES
- Les heures sont des entiers.
- Les titres de modules sont concis (<= 60 caractères).
- Les sous-parties sont des puces courtes (2–8 par module).
"""

THINK_TAG_RE = re.compile(r"<think>.*?</think>", flags=re.DOTALL | re.IGNORECASE)
PLAN_RE = re.compile(r"\#\s*PLAN[_\-\s]?COURS", flags=re.IGNORECASE)  # a bit more tolerant
MODULE_LINE_RE = re.compile(r"^\s*(\d+)\.\s*(.+?)\s*\|\s*Heures:\s*(\d+)\s*$", re.IGNORECASE | re.MULTILINE)

# ------------- FastAPI app --------------
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

@app.get("/health")
def health():
    return {"ok": True}

# ------------- LLM helpers --------------
def _llm_chat(model: str, api_key: str, messages, temperature: float = 0.15, max_tokens: int = 4096) -> str:
    if not api_key or not api_key.strip():
        raise HTTPException(status_code=400, detail="Missing Together API key (server env or request).")
    together.api_key = api_key
    client = together.Together(api_key=api_key)
    resp = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return resp.choices[0].message.content

def strip_think_and_anchor(txt: str) -> str:
    if not txt:
        return ""
    txt = THINK_TAG_RE.sub("", txt).strip()
    # Cut from the last occurrence of #PLAN_COURS-like tag
    m = list(re.finditer(PLAN_RE, txt))
    if m:
        return txt[m[-1].start():].strip()
    return txt.strip()

def generate_plan_from_text(text: str, api_key: str, model: str = DEFAULT_LLM_MODEL) -> str:
    # Pass 1
    messages = [
        {"role": "system", "content": "Tu es un assistant pédagogique concis et structuré."},
        {"role": "user", "content": STRICT_PROMPT_HEADER + f"\n\n=== CONTENU COURS ===\n{text}"},
    ]
    out1_raw = _llm_chat(model, api_key, messages).strip()
    out1 = strip_think_and_anchor(out1_raw)
    if PLAN_RE.search(out1):
        return out1

    # Pass 2 — force reformat
    reform = (
        "Réécris STRICTEMENT la sortie ci-dessous AU FORMAT #PLAN_COURS demandé. "
        "Aucune autre phrase, pas de <think>, pas de commentaire.\n\n"
        f"SORTIE A REFORMATER:\n{out1_raw}"
    )
    messages2 = [
        {"role": "system", "content": "Tu respectes strictement un format sans ajout de texte."},
        {"role": "user", "content": STRICT_PROMPT_HEADER + "\n\n" + reform},
    ]
    out2_raw = _llm_chat(model, api_key, messages2).strip()
    return strip_think_and_anchor(out2_raw)

# ------------- Parse / build ------------
def parse_plan(plan_txt: str) -> dict:
    if not PLAN_RE.search(plan_txt or ""):
        raise ValueError("Format #PLAN_COURS manquant.")

    data = {
        "Titre": None,
        "Public": None,
        "Objectif_global": None,
        "Total_heures": None,
        "Prerequis": [],
        "Competences": [],
        "Modules": [],
    }

    # normalize lines, keep only non-empty
    lines = [l.rstrip() for l in (plan_txt or "").splitlines() if l.strip()]
    i = 0
    current = None

    while i < len(lines):
        line = lines[i]
        low = line.lower()
        if low.startswith("titre:"):
            data["Titre"] = line.split(":", 1)[1].strip()
        elif low.startswith("public:"):
            data["Public"] = line.split(":", 1)[1].strip()
        elif low.startswith("objectif_global:"):
            data["Objectif_global"] = line.split(":", 1)[1].strip()
        elif low.startswith("total_heures:"):
            m = re.search(r"\d+", line)
            data["Total_heures"] = int(m.group()) if m else None
        elif low.startswith("prerequis:") or low.startswith("prérequis:") or low.startswith("competences:") or low.startswith("compétences:"):
            key = "Prerequis" if low.startswith("pr") else "Competences"
            first = line.split(":", 1)[1].strip()
            if first.startswith("-"):
                data[key].append(first[1:].strip())
            j = i + 1
            while j < len(lines) and lines[j].lstrip().startswith("-"):
                data[key].append(lines[j].lstrip()[1:].strip())
                j += 1
            i = j - 1
        else:
            mm = MODULE_LINE_RE.match(line)
            if mm:
                if current:
                    data["Modules"].append(current)
                titre = mm.group(2).strip()
                heures = int(mm.group(3))
                current = {"Titre": titre, "Heures": heures, "Contenu": []}
            elif line.strip().startswith("-") and current is not None:
                current["Contenu"].append(line.strip()[1:].strip())
        i += 1

    if current:
        data["Modules"].append(current)

    if not isinstance(data.get("Total_heures"), int) or data["Total_heures"] <= 0:
        raise ValueError("Total_heures manquant ou invalide.")

    # fix hours to match total
    s = sum(m["Heures"] for m in data["Modules"])
    if s != data["Total_heures"]:
        if s <= 0:
            raise ValueError("Aucun module détecté.")
        factor = data["Total_heures"] / s
        for m in data["Modules"]:
            m["Heures"] = max(1, round(m["Heures"] * factor))
        diff = data["Total_heures"] - sum(m["Heures"] for m in data["Modules"])
        data["Modules"][-1]["Heures"] += diff
    return data

def build_sessions(plan: dict, max_hours_per_session: int = 2) -> pd.DataFrame:
    rows = []
    idx = 1
    for mod in plan["Modules"]:
        left = int(mod["Heures"])
        content = mod.get("Contenu", []) or [mod["Titre"]]
        it = iter(content)
        topic = next(it, mod["Titre"])
        while left > 0:
            h = min(max_hours_per_session, left)
            rows.append({"Module": mod["Titre"], "Séance": idx, "Titre": topic, "Heures": float(h)})
            left -= h
            idx += 1
            topic = next(it, topic)
    return pd.DataFrame(rows)

def schedule_sessions(df: pd.DataFrame, start_date: str, weekday_times: dict) -> pd.DataFrame:
    if df.empty:
        return pd.DataFrame(columns=["Séance", "Module", "Titre", "Heures", "Début", "Fin"])
    if not weekday_times:
        raise ValueError("Aucun jour sélectionné.")

    day = datetime.strptime(start_date, "%Y-%m-%d")
    out = []
    it = df.itertuples(index=False)
    cur = next(it, None)
    while cur is not None:
        wd = day.weekday()  # 0=Mon
        if wd in weekday_times:
            h, m = weekday_times[wd]
            start = day.replace(hour=int(h), minute=int(m), second=0, microsecond=0)
            end = start + timedelta(hours=float(cur.Heures))
            out.append({
                "Séance": int(cur.Séance),
                "Module": cur.Module,
                "Titre": cur.Titre,
                "Heures": float(cur.Heures),
                "Début": start,
                "Fin": end,
            })
            cur = next(it, None)
        day += timedelta(days=1)
    return pd.DataFrame(out)

def gantt_png_bytes(df: pd.DataFrame, title: str) -> bytes:
    fig, ax = plt.subplots(figsize=(12, 6))
    for i, row in df.iterrows():
        s = mdates.date2num(row["Début"]); e = mdates.date2num(row["Fin"])
        w = e - s
        ax.barh(i, w, left=s)
        c = s + w / 2
        ax.text(mdates.num2date(c), i,
                f"S{int(row['Séance'])}: {row['Titre']}\n({row['Heures']}h) — {row['Module']}",
                ha='center', va='center', fontsize=8)
    ax.set_yticks(range(len(df)))
    ax.set_yticklabels([f"S{i+1}" for i in range(len(df))])
    ax.set_xlabel("Date / Heures")
    ax.set_ylabel("Séances")
    ax.set_title(f"Diagramme de Gantt — {title}")
    ax.xaxis.set_major_locator(mdates.AutoDateLocator())
    ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
    plt.xticks(rotation=45)
    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format="png", dpi=140)
    plt.close(fig)
    return buf.getvalue()

# ------------- Schemas -------------------
class PlanRequest(BaseModel):
    text: str
    start_date: str  # YYYY-MM-DD
    weekday_times: dict  # e.g. {0:[9,0], 2:[14,0], 4:[10,30]}
    max_hours_per_session: int = 2
    model: str | None = None
    api_key: str | None = None

# ------------- Endpoints -----------------
@app.post("/api/plan-from-text")
def plan_from_text(payload: PlanRequest):
    api_key = (payload.api_key or TOGETHER_API_KEY).strip()
    if not api_key:
        raise HTTPException(status_code=400, detail="Missing Together API key.")
    try:
        plan_txt = generate_plan_from_text(payload.text, api_key, payload.model or DEFAULT_LLM_MODEL)
        plan = parse_plan(plan_txt)
    except Exception as e:
        # expose raw text so the UI can display what the LLM returned
        return JSONResponse(
            status_code=400,
            content={"error": str(e), "plan_text": plan_txt if 'plan_txt' in locals() else None}
        )

    df_sessions = build_sessions(plan, payload.max_hours_per_session)
    df_sched = schedule_sessions(df_sessions, payload.start_date,
                                 {int(k): v for k, v in payload.weekday_times.items()})
    png_b64 = None
    if not df_sched.empty:
        png = gantt_png_bytes(df_sched, plan.get("Titre", "Cours"))
        png_b64 = "data:image/png;base64," + base64.b64encode(png).decode("utf-8")

    sched = [{**r, "Début": r["Début"].isoformat(), "Fin": r["Fin"].isoformat()}
             for r in df_sched.to_dict(orient="records")]
    return {"plan_text": plan_txt, "plan": plan,
            "sessions": df_sessions.to_dict(orient="records"),
            "schedule": sched, "gantt_png": png_b64}

@app.post("/api/plan-from-pdf")
async def plan_from_pdf(
    file: UploadFile = File(...),
    start_date: str = Form(...),
    weekday_times_json: str = Form(...),   # JSON string
    max_hours_per_session: int = Form(2),
    model: str = Form(DEFAULT_LLM_MODEL),
    api_key: str | None = Form(None),
):
    api_key = (api_key or TOGETHER_API_KEY).strip()
    if not api_key:
        raise HTTPException(status_code=400, detail="Missing Together API key.")

    raw = await file.read()
    with fitz.open(stream=raw, filetype="pdf") as doc:
        text = "".join(page.get_text() for page in doc)

    weekday_times = {int(k): v for k, v in json.loads(weekday_times_json).items()}

    try:
        plan_txt = generate_plan_from_text(text, api_key, model)
        plan = parse_plan(plan_txt)
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={"error": str(e), "plan_text": plan_txt if 'plan_txt' in locals() else None}
        )

    df_sessions = build_sessions(plan, max_hours_per_session)
    df_sched = schedule_sessions(df_sessions, start_date, weekday_times)

    png_b64 = None
    if not df_sched.empty:
        png = gantt_png_bytes(df_sched, plan.get("Titre", "Cours"))
        png_b64 = "data:image/png;base64," + base64.b64encode(png).decode("utf-8")

    sched = [{**r, "Début": r["Début"].isoformat(), "Fin": r["Fin"].isoformat()}
             for r in df_sched.to_dict(orient="records")]
    return {"plan_text": plan_txt, "plan": plan,
            "sessions": df_sessions.to_dict(orient="records"),
            "schedule": sched, "gantt_png": png_b64}
