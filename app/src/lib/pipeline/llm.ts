const GEMINI_MODEL = "gemini-3.5-flash";

function getApiKey(): string | null {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    null
  );
}

export function isLLMAvailable(): boolean {
  return getApiKey() !== null;
}

export async function generateJSON<T>(prompt: string): Promise<T> {
  const key = getApiKey();
  if (!key) throw new Error("No GEMINI_API_KEY or GOOGLE_API_KEY configured");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini");

  return JSON.parse(text) as T;
}
