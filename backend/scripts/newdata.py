import re
import csv
import os
from pathlib import Path
from openai import OpenAI
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from prompts import *
from dotenv import load_dotenv

load_dotenv()
OUTPUT_FILE = Path(__file__).resolve().parent.parent / "data" / "new_data.csv"
MODEL_NAME = "gpt-4o-mini-2024-07-18" 


def generate_entries(prompt: str):
    """Call OpenAI and return raw model output."""
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.9,
    )
    return response.choices[0].message.content


def parse_xml_entries(text: str):
    """Extract <Theme>, <Question>, and <Answer> from <ENTRY> blocks."""
    entries = []
    for match in re.findall(r"<ENTRY>(.*?)</ENTRY>", text, re.DOTALL):
        t = re.search(r"<Theme>(.*?)</Theme>", match, re.DOTALL)
        q = re.search(r"<Question>(.*?)</Question>", match, re.DOTALL)
        a = re.search(r"<Answer>(.*?)</Answer>", match, re.DOTALL)
        if t and q and a:
            theme = t.group(1).strip()
            question = q.group(1).strip()
            answer = a.group(1).strip()
            entries.append({"Theme": theme, "Questions": question, "Answer": answer})
    return entries


def save_to_csv(entries, filepath: Path):
    """Append parsed entries into a CSV file (create if not exists, add header)."""
    file_exists = filepath.exists() and filepath.stat().st_size > 0  # ✅ check size too
    with open(filepath, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["Theme", "Questions", "Answer"])
        if not file_exists:  # only write header if file is new or empty
            writer.writeheader()
        writer.writerows(entries)
    print(f"✅ Added {len(entries)} new entries to {filepath}")


if __name__ == "__main__":
    raw_output = generate_entries(NEW_DATA_PROMPT)
    entries = parse_xml_entries(raw_output)
    if entries:
        save_to_csv(entries, OUTPUT_FILE)
    else:
        print("⚠️ No entries parsed from output!")