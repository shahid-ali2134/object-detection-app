export const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

export async function uploadImage(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/upload-image/`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}

export async function fetchDetections() {
  const res = await fetch(`${API_BASE}/detections/`);
  if (!res.ok) throw new Error("Failed to fetch detections");
  return res.json();
}
