import os
from pathlib import Path
import pandas as pd
from openai import OpenAI
from dotenv import load_dotenv
from tqdm import tqdm
import time

# --- Load API Key ---
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print("Error: OPENAI_API_KEY not found in .env")
    exit()

# --- OpenAI Client Initialization ---
try:
    client = OpenAI(api_key=api_key)
except Exception as e:
    print(f"Error initializing OpenAI client: {e}")
    exit()

# --- File Paths ---
SCRIPT_DIR = Path(__file__).resolve().parent
DATA_DIR = SCRIPT_DIR.parent / "data"
INPUT_CSV_FILE = DATA_DIR / "new_data.csv"   # Original input file
OUTPUT_CSV_FILE = DATA_DIR / "translated_dataset.csv"  # Save translations here

# --- Configuration ---
MODEL_NAME = "gpt-4o-mini-2024-07-18"
COLUMNS_TO_TRANSLATE = ["Answer"]  # You can add other columns like "Question", "Theme"
BATCH_SAVE_EVERY = 25

# --- Translation Function ---
def get_translation(text_to_translate: str, retries: int = 3) -> dict:
    system_prompt = f"""
<translationRequest>
    <context>
        <userDemographics>
            <ageRange>23-33</ageRange>
            <maritalStatus>Married</maritalStatus>
            <location>Rural/Semi-Urban India</location>
            <familyType>Joint family</familyType>
            <education>Mostly primary/secondary, simple language needed</education>
            <technology>Smartphone with WhatsApp, often shared</technology>
        </userDemographics>
    </context>
    <translationInstructions>
        Translate the provided text into Hindi and Marathi.

        Style:
        - Use simple, clear, and empathetic sentences.
        - Avoid placing English technical words inside brackets (e.g., no "स्राव (mucus)", "मिचली (nausea)" or "एंटीबॉडी (antibody)").
        - When encountering technical/medical English terms:
            * Prefer the most commonly understood local word.
            * If rural women usually know a term by a local+English mix (example: "कॉपर-टी (IUD)"), you can keep both.
            * Otherwise, avoid English and use natural local phrasing.

        Examples:
        - "ovulation / ओवुलेट" → "अंडा निकलना" in Hindi, "अंडे निघणे" in Marathi.
        - "hydrated / हाइड्रेटेड" → "शरीर में पानी की कमी न हो" in Hindi, "शरीरात पाण्याची कमतरता होऊ नये" in Marathi.
        - "antibodies / एंटीबॉडी" → "रोगों से बचाने वाले तत्व" in Hindi, "आजारांपासून संरक्षण करणारे घटक" in Marathi.
        - "IUD" → "कॉपर-टी (IUD)" since health workers often use that.

        Length:
        - Keep translations roughly the same length as original to avoid losing detail or being too brief.

        Formatting:
        - Return valid XML with <hindi> and <marathi> tags.
    </translationInstructions>
    <textToTranslate>{text_to_translate}</textToTranslate>
</translationRequest>
"""

    for attempt in range(retries):
        try:
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[{"role": "system", "content": system_prompt}],
                temperature=0.2
            )
            content = response.choices[0].message.content
            hindi = content.split("<hindi>")[1].split("</hindi>")[0].strip()
            marathi = content.split("<marathi>")[1].split("</marathi>")[0].strip()
            return {"hindi_translation": hindi, "marathi_translation": marathi}
        except Exception as e:
            print(f"API error on attempt {attempt+1}: {e}")
            print("⏱ Waiting 1 minute before retry...")
            time.sleep(60)
    return {"hindi_translation": "Translation Error", "marathi_translation": "Translation Error"}


# --- Main Script ---
def main():
    # Load existing translations if present, otherwise start with input file
    if OUTPUT_CSV_FILE.exists():
        print(f"Loading existing translated file: {OUTPUT_CSV_FILE}")
        df = pd.read_csv(OUTPUT_CSV_FILE)
    elif INPUT_CSV_FILE.exists():
        print(f"Loading input file: {INPUT_CSV_FILE}")
        df = pd.read_csv(INPUT_CSV_FILE)
    else:
        print(f"Error: Input file '{INPUT_CSV_FILE}' not found.")
        return

    # Ensure translation columns exist
    for col in COLUMNS_TO_TRANSLATE:
        hindi_col = f"{col}_Hindi"
        marathi_col = f"{col}_Marathi"
        if hindi_col not in df.columns:
            df[hindi_col] = ""
        if marathi_col not in df.columns:
            df[marathi_col] = ""

    print(f"Starting translation of {len(df)} rows...")

    for idx, row in tqdm(df.iterrows(), total=df.shape[0], desc="Translating"):
        for col in COLUMNS_TO_TRANSLATE:
            hindi_col = f"{col}_Hindi"
            marathi_col = f"{col}_Marathi"

            # Skip if already translated
            if pd.notna(row[hindi_col]) and row[hindi_col].strip() != "" \
               and pd.notna(row[marathi_col]) and row[marathi_col].strip() != "":
                # Uncomment below to debug skipping
                # print(f"Skipping row {idx} as translations exist.")
                continue

            text_to_translate = row[col]
            if isinstance(text_to_translate, str) and text_to_translate.strip():
                translations = get_translation(text_to_translate)
                df.at[idx, hindi_col] = translations.get("hindi_translation", "")
                df.at[idx, marathi_col] = translations.get("marathi_translation", "")

        # Save progress at batch intervals
        if (idx + 1) % BATCH_SAVE_EVERY == 0:
            df.to_csv(OUTPUT_CSV_FILE, index=False, encoding="utf-8-sig")
            print(f"💾 Progress saved at row {idx+1}")

    # Final save
    df.to_csv(OUTPUT_CSV_FILE, index=False, encoding="utf-8-sig")
    print("\n✅ Translation complete! Saved to:", OUTPUT_CSV_FILE)


if __name__ == "__main__":
    main()