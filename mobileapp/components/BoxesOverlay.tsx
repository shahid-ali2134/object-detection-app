import React from "react";
import { View } from "react-native";
import { Svg, Rect, Text as SvgText, G } from "react-native-svg";

export type Box = {
  x: number; y: number; width: number; height: number;
  label: string; score: number;
};

type Props = {
  width: number;
  height: number;
  boxes: Box[];
  threshold?: number;
};

export default function BoxesOverlay({ width, height, boxes, threshold = 0.25 }: Props) {
  return (
    <View style={{ position: "absolute", left: 0, top: 0 }}>
      <Svg width={width} height={height}>
        {boxes
          .filter((b) => b.score >= threshold)
          .map((b, i) => (
            <G key={i}>
              <Rect
                x={b.x}
                y={b.y}
                width={b.width}
                height={b.height}
                strokeWidth={2}
                stroke="#00FF00"
                fill="none"
              />
              <SvgText x={b.x + 4} y={b.y + 14} fontSize={12} fill="#00FF00">
                {`${b.label} ${(b.score * 100).toFixed(1)}%`}
              </SvgText>
            </G>
          ))}
      </Svg>
    </View>
  );
}