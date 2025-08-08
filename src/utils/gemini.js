// helper to try parse JSON safely from a messy LLM string
export function extractJsonArray(text) {
  if (!text || typeof text !== "string") return null;

  // remove markdown fences if present
  let cleaned = text
    .replace(/```(?:json)?/g, "")
    .replace(/```/g, "")
    .trim();

  // quick try
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error(e)
    /* fallback below */
  }

  // find the first '[' and find its matching closing bracket
  const first = cleaned.indexOf("[");
  if (first === -1) return null;
  let depth = 0,
    lastIndex = -1;
  for (let i = first; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) {
        lastIndex = i;
        break;
      }
    }
  }
  if (lastIndex === -1) return null;
  const jsonStr = cleaned.slice(first, lastIndex + 1);
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("extractJsonArray parse failed", e);
    return null;
  }
}

// call Gemini with provided API key and prompt
export async function callGeminiApi(apiKey, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const body = {
    // using simple request structure; adjust if Google API changes
    temperature: 0.2,
    maxOutputTokens: 800,
    candidateCount: 1,
    topP: 0.8,
    topK: 40,
    safetySettings: [],
    instructions: prompt,
  };

  // some Gemini variants expect "contents", but the "instructions" approach may work.
  // If your endpoint requires different shape, adapt accordingly.
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Gemini API ${res.status}: ${txt}`);
  }
  const data = await res.json();
  // try candidates -> content -> parts -> text
  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    data?.outputs?.[0]?.content?.text ||
    data?.candidates?.[0]?.output?.[0]?.content ||
    JSON.stringify(data);
  return text;
}
