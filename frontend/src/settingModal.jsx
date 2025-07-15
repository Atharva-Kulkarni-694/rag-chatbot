import React, { useRef, useState } from "react";

const SettingsModal = ({ open, onClose }) => {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleUpload = async () => {
    if (!fileRef.current.files.length) return;
    setUploading(true);
    setMsg("Processing...");
    const formData = new FormData();
    for (let file of fileRef.current.files) {
      formData.append("documents", file);
    }
    try {
      const res = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      setMsg(`Uploaded: ${data.files.join(", ")}`);
    } catch {
      setMsg("Upload failed.");
    }
    setUploading(false);
    fileRef.current.value = null;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">RAG Assistant Settings</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Upload Documents</label>
          <input ref={fileRef} type="file" multiple className="mb-3" accept=".pdf,.txt" />
          <button
            className="bg-indigo-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-indigo-700"
            disabled={uploading}
            onClick={handleUpload}
          >
            {uploading ? "Uploading..." : "Process Documents"}
          </button>
          {msg && <div className="mt-2 text-green-700 text-sm">{msg}</div>}
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;