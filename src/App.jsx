import { useEffect, useState, useRef } from "react";
import ApiKeyModal from "./components/ApiKeyModal";
import Flashcard from "./components/Flashcard";
import SkeletonCard from "./components/SkeletonCard";
import { callGeminiApi, extractJsonArray } from "./utils/gemini";

const DIFFICULTIES = [
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
];

function buildPrompt(difficulty) {
  return `You are a helpful assistant. Return ONLY a JSON array of exactly 10 vocabulary objects (no text, no explanation).
Each object must have the keys:
word (string), part_of_speech (string), ipa (string short), meaning_vi (string, <=20 words),
example_en (one natural English sentence), example_vi (Vietnamese translation),
difficulty (1-5), tags (array of short strings).

Choose words appropriate to difficulty "${difficulty}". Avoid proper nouns.`;
}

export default function App() {
  const [apiKey, setApiKey] = useState(
    localStorage.getItem("GEMINI_API_KEY") || ""
  );
  const [showModal, setShowModal] = useState(!apiKey);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState("easy");
  const [error, setError] = useState(null);
  const loaderRef = useRef();

  useEffect(() => {
    if (apiKey && cards.length === 0) {
      fetchMore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, difficulty]);

  // infinite scroll
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          fetchMore();
        }
      },
      { rootMargin: "200px" }
    );
    if (loaderRef.current) obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [loaderRef.current, loading]);

  async function fetchMore() {
    if (!apiKey) {
      setShowModal(true);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const prompt = buildPrompt(difficulty);
      const text = await callGeminiApi(apiKey, prompt);
      const arr = extractJsonArray(text);
      if (!arr || !Array.isArray(arr))
        throw new Error("Không parse được JSON từ Gemini");
      // normalize items
      const normalized = arr.map((it) => ({
        word: it.word || it.text || "",
        part_of_speech: it.part_of_speech || it.pos || "",
        ipa: it.ipa || it.pronunciation || "",
        meaning_vi: it.meaning_vi || it.meaning || "",
        example_en: it.example_en || it.example || "",
        example_vi: it.example_vi || "",
        difficulty:
          it.difficulty ||
          (difficulty === "easy" ? 2 : difficulty === "medium" ? 3 : 4),
        tags: it.tags || [],
      }));
      setCards((prev) => [...prev, ...normalized]);
    } catch (e) {
      console.error(e);
      setError(e.message || String(e));
      if (e.message && e.message.includes("401")) {
        setShowModal(true);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleApiSave = (k) => {
    setApiKey(k);
    setShowModal(false);
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-white to-gray-50">
      <ApiKeyModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleApiSave}
      />

      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-sky-700">AI Flashcards</h1>
            <p className="text-sm text-gray-500 mt-1">
              Học từ vựng — random 10 từ mỗi lần · Tự động load · TTS
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={difficulty}
              onChange={(e) => {
                setCards([]);
                setDifficulty(e.target.value);
              }}
              className="border rounded-lg px-3 py-2 bg-white"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                setShowModal(true);
              }}
              className="px-4 py-2 rounded-lg border hover:bg-gray-50"
            >
              {apiKey ? "🔑 Key set" : "🔑 Set API Key"}
            </button>

            <button
              onClick={() => {
                localStorage.removeItem("GEMINI_API_KEY");
                setApiKey("");
                setShowModal(true);
              }}
              className="px-3 py-2 rounded-lg bg-red-50 text-red-600 border"
            >
              Reset Key
            </button>
          </div>
        </header>

        {error && <div className="mb-4 text-red-600">{error}</div>}

        <main>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((c, i) => (
              <Flashcard key={i + c.word} item={c} />
            ))}
            {loading &&
              Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>

          <div className="mt-6 flex flex-col items-center">
            <button
              onClick={fetchMore}
              disabled={loading}
              className="px-6 py-3 rounded-full bg-emerald-600 text-white shadow hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? "⏳ Đang tải..." : "📥 Load more"}
            </button>

            <div ref={loaderRef} className="h-6" />
            <p className="mt-3 text-sm text-gray-400">
              Pro tip: you can scroll to auto-load more
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
