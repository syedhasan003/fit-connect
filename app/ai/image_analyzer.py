from openai import OpenAI
import os

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """
You are a medical assistant AI.

You analyze uploaded medical images such as:
- Prescriptions
- Lab reports
- X-rays
- MRI/CT scans
- Doctor notes

Extract ONLY structured medical insights.
Do NOT give diagnosis.
Be factual and conservative.

Return JSON in this format:
{
  "document_type": "",
  "conditions": [],
  "medications": [],
  "observations": [],
  "warnings": [],
  "confidence": "low | medium | high"
}
"""

def analyze_medical_image(image_path: str):
    with open(image_path, "rb") as f:
        response = client.responses.create(
            model="gpt-4.1-mini",
            input=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "input_text", "text": "Analyze this medical document"},
                        {
                            "type": "input_image",
                            "image_base64": f.read()
                        }
                    ]
                }
            ],
        )

    return response.output_text
