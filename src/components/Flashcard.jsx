import { useState, useRef } from "react";

export default function Flashcard({ item }) {
  // item expected: { word, part_of_speech, ipa, meaning_vi, example_en, example_vi, difficulty, tags }
  const [flipped, setFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const ttsTimeout = useRef(null);

  const speak = (text) => {
    if (!("speechSynthesis" in window))
      return alert("Browser does not support TTS");
    if (isPlaying) return; // block spam
    setIsPlaying(true);

    // cancel any currently playing utterances to keep behavior deterministic
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.error(e);
    }

    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 1;
    u.onend = () => {
      // small cooldown to prevent rapid re-click
      ttsTimeout.current = setTimeout(() => setIsPlaying(false), 400);
    };
    u.onerror = () => {
      setIsPlaying(false);
    };
    window.speechSynthesis.speak(u);
  };

  // cleanup possible timeout when component unmounts
  const cleanup = () => {
    if (ttsTimeout.current) {
      clearTimeout(ttsTimeout.current);
      ttsTimeout.current = null;
    }
  };

  return (
    <div
      className="bg-white rounded-xl shadow p-4 card-flip"
      onMouseLeave={() => {
        /* keep flip state as is */
      }}
      onBlur={cleanup}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold text-sky-700">{item.word}</h3>
          <div className="text-sm text-gray-500">
            {item.part_of_speech} •{" "}
            <span className="font-medium">Độ khó: {item.difficulty}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => speak(item.word)}
            disabled={isPlaying}
            className={`px-3 py-1 rounded-md border ${
              isPlaying ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"
            }`}
            title="Phát âm"
          >
            🔊
          </button>

          <button
            onClick={() => navigator.clipboard?.writeText(item.word)}
            className="px-2 py-1 rounded-md border hover:bg-gray-100"
            title="Copy từ"
          >
            📋
          </button>

          <button
            onClick={() => setFlipped((f) => !f)}
            className="px-2 py-1 rounded-md bg-sky-600 text-white hover:bg-sky-700"
            title="Xem nghĩa"
          >
            {flipped ? "↩" : "Flip"}
          </button>
        </div>
      </div>

      <div className="mt-3">
        <div className="text-sm text-gray-600 italic">/{item.ipa || "…"}/</div>
      </div>

      {!flipped ? (
        <div className="mt-3">
          <div className="text-gray-700">{item.meaning_vi}</div>
          <div className="mt-2 text-sm text-gray-600">“{item.example_en}”</div>
        </div>
      ) : (
        <div className="mt-3 bg-gray-50 p-3 rounded-lg">
          <div className="text-gray-800">{item.meaning_vi}</div>
          <div className="mt-2 text-sm text-gray-600">{item.example_vi}</div>
          <div className="mt-3 flex gap-2 flex-wrap">
            {(item.tags || []).map((t, i) => (
              <span
                key={i}
                className="text-xs bg-sky-100 text-sky-700 px-2 py-1 rounded-full"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
