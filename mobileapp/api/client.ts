// api/client.ts
import Config from "react-native-config";

export type YoloBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  score: number;
};

export type PredictResponse = {
  imageWidth: number;   // may be 0 if backend didn't send it
  imageHeight: number;  // may be 0 if backend didn't send it
  boxes: YoloBox[];
} & Record<string, any>;

function join(base?: string, path?: string) {
  if (!base) throw new Error("API_BASE_URL is missing");
  if (!path) throw new Error("Route path is missing");
  const b = base.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

/** Normalize your backend shape → {imageWidth,imageHeight,boxes[]} */
function normalize(raw: any): PredictResponse {
  // Your backend returns { detections: [{label, confidence, box:[x1,y1,x2,y2]}], result_path: ... }
  const list = raw?.detections ?? raw?.boxes ?? raw?.predictions ?? [];
  const boxes: YoloBox[] = Array.isArray(list)
    ? list.map((it: any) => {
        const arr = it?.box; // [x1,y1,x2,y2]
        let x = 0, y = 0, w = 0, h = 0;
        if (Array.isArray(arr) && arr.length === 4) {
          const [x1, y1, x2, y2] = arr;
          x = Number(x1) || 0;
          y = Number(y1) || 0;
          w = (Number(x2) || 0) - x;
          h = (Number(y2) || 0) - y;
        }
        return {
          x, y, width: w, height: h,
          label: it?.label ?? "object",
          score: Number(it?.confidence ?? it?.score ?? 0),
        };
      })
    : [];

  // Backend doesn’t send size; keep 0 so the UI can fallback to picked size
  const imageWidth = Number(raw?.imageWidth ?? raw?.width ?? 0);
  const imageHeight = Number(raw?.imageHeight ?? raw?.height ?? 0);

  return { imageWidth, imageHeight, boxes, ...raw };
}

export async function uploadImage(uri: string): Promise<PredictResponse> {
  const form = new FormData();
  // @ts-ignore RN FormData file object
  form.append("file", { uri, name: "image.jpg", type: "image/jpeg" });
  const url = join(Config.API_BASE_URL, Config.UPLOAD_ROUTE);
  const res = await fetch(url, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  const raw = await res.json();
  return normalize(raw);
}

export async function fetchDetections(): Promise<PredictResponse> {
  const url = join(Config.API_BASE_URL, Config.DETECTIONS_ROUTE);
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch detections");
  const raw = await res.json();
  return normalize(raw);
}

export async function fetchDetectionsById(id: string): Promise<PredictResponse> {
  const base = join(Config.API_BASE_URL, Config.DETECTIONS_ROUTE);
  const url = `${base}?id=${encodeURIComponent(id)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch detections by id (${res.status})`);
  const raw = await res.json();
  return normalize(raw);
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function pollDetections(opts: { id?: string; attempts?: number; intervalMs?: number }) {
  const { id, attempts = 8, intervalMs = 500 } = opts;
  let last: PredictResponse | undefined;
  for (let i = 0; i < attempts; i++) {
    const data = id ? await fetchDetectionsById(id) : await fetchDetections();
    last = data;
    if (Array.isArray(data?.boxes) && data.boxes.length > 0) return data;
    await sleep(intervalMs);
  }
  return last as PredictResponse;
}
