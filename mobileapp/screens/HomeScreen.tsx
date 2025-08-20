// screens/HomeScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert,
  LayoutChangeEvent,
  ScrollView,
} from "react-native";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import { Svg, Rect, Text as SvgText, G } from "react-native-svg";
import { uploadImage, pollDetections, type PredictResponse } from "../api/client";

type OverlayBox = { x: number; y: number; width: number; height: number; label: string; score: number };

function BoxesOverlay({
  width,
  height,
  boxes,
  threshold = 0.25,
}: {
  width: number;
  height: number;
  boxes: OverlayBox[];
  threshold?: number;
}) {
  return (
    <View style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, zIndex: 5, pointerEvents: "none" }}>
      <Svg width={width} height={height}>
        {boxes
          .filter((b) => b.score >= threshold)
          .map((b, i) => (
            <G key={`${b.label}-${i}-${b.x}-${b.y}`}>
              <Rect x={b.x} y={b.y} width={b.width} height={b.height} stroke="#22c55e" strokeWidth={2} fill="none" />
              <SvgText x={b.x + 4} y={b.y + 14} fontSize={12} fill="#22c55e">
                {`${b.label} ${(b.score * 100).toFixed(1)}%`}
              </SvgText>
            </G>
          ))}
      </Svg>
    </View>
  );
}

export default function HomeScreen() {
  const [uri, setUri] = useState<string | undefined>();
  const [pickedW, setPickedW] = useState<number | undefined>();
  const [pickedH, setPickedH] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictResponse | undefined>();
  const [previewW, setPreviewW] = useState(0);

  const setPickedImage = (nextUri?: string) => {
    if (!nextUri) return;
    setUri(nextUri);
    setResult(undefined);
    Image.getSize(
      nextUri,
      (w, h) => {
        setPickedW(w);
        setPickedH(h);
      },
      () => {
        setPickedW(undefined);
        setPickedH(undefined);
      }
    );
  };

  const onTakePhoto = async () => {
    const res = await launchCamera({ mediaType: "photo", quality: 0.9 });
    setPickedImage(res.assets?.[0]?.uri);
  };

  const onChooseFromLibrary = async () => {
    const res = await launchImageLibrary({ mediaType: "photo", quality: 0.9 });
    setPickedImage(res.assets?.[0]?.uri);
  };

  const onUploadAndDetect = async () => {
    if (!uri) return;
    try {
      setLoading(true);
      setResult(undefined);

      const uploadResp = await uploadImage(uri);
      // If backend already returned boxes, use them
      if (Array.isArray(uploadResp?.boxes) && uploadResp.boxes.length > 0) {
        setResult(uploadResp);
        return;
      }

      // Else poll by id/filename if present
      const id =
        uploadResp?.id ??
        uploadResp?.imageId ??
        uploadResp?.image_id ??
        uploadResp?.uuid ??
        uploadResp?.filename ??
        undefined;

      const det = await pollDetections({ id, attempts: 10, intervalMs: 600 });
      setResult(det);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const onPreviewLayout = (e: LayoutChangeEvent) => setPreviewW(e.nativeEvent.layout.width);

  // Base (original) image size: prefer server → fallback to picked image size
  const baseW = result?.imageWidth && result.imageWidth > 0 ? result.imageWidth : pickedW ?? 0;
  const baseH = result?.imageHeight && result.imageHeight > 0 ? result.imageHeight : pickedH ?? 0;

  // Display sizes
  const displayH = baseW > 0 && baseH > 0 && previewW > 0 ? (previewW * baseH) / baseW : undefined;
  const ratio = baseW > 0 && previewW > 0 ? previewW / baseW : 1;

  const scaledBoxes: OverlayBox[] =
    result?.boxes?.map((b) => ({
      ...b,
      x: b.x * ratio,
      y: b.y * ratio,
      width: b.width * ratio,
      height: b.height * ratio,
    })) ?? [];

  const total = result?.boxes?.length ?? 0;

  return (
  <SafeAreaView style={styles.safe}>
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>Live Object Detector</Text>
      <Text style={styles.subtitle}>Pick or capture a photo to run detection.</Text>

      <View style={styles.actions}>
        <Pressable style={styles.primaryBtn} onPress={onTakePhoto} disabled={loading}>
          <Text style={styles.primaryText}>{loading ? "Please wait..." : "Take Photo"}</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={onChooseFromLibrary} disabled={loading}>
          <Text style={styles.secondaryText}>Choose from Library</Text>
        </Pressable>
      </View>

      {/* ORIGINAL IMAGE */}
      <View style={styles.card} onLayout={onPreviewLayout}>
        <Text style={styles.cardTitle}>Original Image</Text>
        {uri ? (
          <Image
            source={{ uri }}
            style={[styles.image, { height: displayH ?? 220 }]}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.placeholderText}>Pick or capture an image to begin.</Text>
        )}

        {/* ACTION BUTTON inside same card */}
        {uri ? (
          <Pressable
            style={[styles.primaryBtn, { alignSelf: "flex-start", marginTop: 16 }]}
            onPress={onUploadAndDetect}
            disabled={loading}
          >
            {loading ? <ActivityIndicator /> : <Text style={styles.primaryText}>Upload & Detect</Text>}
          </Pressable>
        ) : null}
      </View>

      {/* TOTAL + PER-OBJECT CARDS */}
      {result ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detections</Text>
          <Text style={styles.totalText}>Total Objects Detected: {total}</Text>

          {result.boxes.map((b, i) => (
            <View key={`${b.label}-${i}-${b.x}-${b.y}`} style={styles.itemRow}>
              <Text style={styles.itemLabel}>{b.label}</Text>
              <Text style={styles.itemScore}>Confidence Score = {b.score.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* PREDICTED IMAGE (OVERLAY) */}
      {uri ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Image with Predicted Bounding Boxes</Text>
          <View
            style={{
              width: "100%",
              height: displayH ?? 220,
              position: "relative",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <Image source={{ uri }} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
            {result && typeof displayH === "number" && Number.isFinite(displayH) ? (
              <BoxesOverlay width={previewW} height={displayH} boxes={scaledBoxes} />
            ) : null}
          </View>
        </View>
      ) : null}

      {/* RAW JSON CARD */}
      {result ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Raw JSON</Text>
          <View style={styles.jsonBox}>
            <Text style={styles.jsonText}>
              {JSON.stringify(
                {
                  imageWidth: baseW,
                  imageHeight: baseH,
                  detections: result.boxes.map((b) => ({
                    label: b.label,
                    confidence: b.score,
                    box_xyxy: [b.x, b.y, b.x + b.width, b.y + b.height],
                  })),
                },
                null,
                2
              )}
            </Text>
          </View>
        </View>
      ) : null}
    </ScrollView>
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0B1220" },
  scroll: { padding: 20, gap: 16 },
  title: { fontSize: 28, fontWeight: "800", color: "white" },
  subtitle: { color: "#BAC1D6", marginBottom: 4 },
  actions: { flexDirection: "row", gap: 12, marginTop: 4, marginBottom: 8 },
  primaryBtn: { backgroundColor: "#4F46E5", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  primaryText: { color: "white", fontWeight: "700" },
  secondaryBtn: { borderColor: "#4F46E5", borderWidth: 2, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  secondaryText: { color: "#E0E7FF", fontWeight: "700" },
  placeholderText: { color: "#93A0B8" },

  card: {
    backgroundColor: "#0F172A",
    borderColor: "#1F2A44",
    borderWidth: 2,
    borderRadius: 16,
    padding: 12,
  },
  cardTitle: { color: "white", fontWeight: "700", marginBottom: 8, fontSize: 16 },

  image: { width: "100%", borderRadius: 12, backgroundColor: "#0B1220" },

  totalText: { color: "#E2E8F0", fontWeight: "700", marginBottom: 8 },

  itemRow: {
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderColor: "#1F2A44",
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  itemLabel: { color: "white", fontWeight: "700" },
  itemScore: { color: "#A5B4FC", fontWeight: "700" },

  jsonBox: {
    backgroundColor: "#0B1220",
    borderRadius: 12,
    padding: 12,
    borderColor: "#1F2A44",
    borderWidth: 1,
  },
  jsonText: { color: "#E5E7EB", fontFamily: "Courier", fontSize: 12 },
});
