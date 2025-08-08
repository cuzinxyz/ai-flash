import { useState } from "react";

export default function ApiKeyModal({ open, onClose, onSave }) {
  const [key, setKey] = useState(localStorage.getItem("GEMINI_API_KEY") || "");
  const [masked, setMasked] = useState(true);

  const save = () => {
    const trimmed = key.trim();
    if (!trimmed) return alert("Vui lòng nhập API key");
    localStorage.setItem("GEMINI_API_KEY", trimmed);
    onSave(trimmed);
    onClose();
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white max-w-md w-full rounded-xl shadow-xl p-6">
        <h3 className="text-lg font-semibold mb-2">🔑 Gemini API Key</h3>
        <p className="text-sm text-gray-500 mb-4">
          Key được lưu cục bộ trên trình duyệt. Không chia sẻ key công khai.
        </p>

        <div className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2">
          <input
            className="flex-1 bg-transparent outline-none"
            type={masked ? "password" : "text"}
            placeholder="Enter Gemini API key..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
            autoFocus
          />
          <button
            onClick={() => setMasked(!masked)}
            className="text-sm text-gray-600"
          >
            {masked ? "Hiện" : "Ẩn"}
          </button>
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border">
            Hủy
          </button>
          <button
            onClick={save}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white"
          >
            Lưu
          </button>
        </div>

        <div className="mt-3 text-xs text-gray-500">
          <a
            className="text-blue-600 hover:underline"
            href="https://studio.google.com/"
            target="_blank"
            rel="noreferrer"
          >
            Hướng dẫn lấy API key
          </a>
        </div>
      </div>
    </div>
  );
}
