import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  PanResponder,
} from "react-native";

const DEFAULT_BG = "#9ca3af";

// ─── Color helpers ───────────────────────────────────────────────
function hsvToHex(h: number, s: number, v: number): string {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  const toHex = (x: number) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(f(5))}${toHex(f(3))}${toHex(f(1))}`;
}

function hexToHsv(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;

  if (d !== 0) {
    if (max === r) h = ((g - b) / d + 6) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }

  const s = max === 0 ? 0 : d / max;
  return [h, s, max];
}

function isValidHex(hex: string) {
  return /^#[0-9a-fA-F]{6}$/.test(hex);
}

type Props = {
  value: string;
  onChange: (hex: string) => void;
  onClose: () => void;
};

export default function ColorPickerPanel({
  value,
  onChange,
  onClose,
}: Props) {
  const safeHex = isValidHex(value) ? value : DEFAULT_BG;
  const [h, s, v] = hexToHsv(safeHex);

  const [hue, setHue] = useState(h);
  const [sat, setSat] = useState(s);
  const [bri, setBri] = useState(v);
  const [hexInput, setHexInput] = useState(safeHex);

  const SV_SIZE = 240;
  const HUE_W = 240;

  useEffect(() => {
    const hex = hsvToHex(hue, sat, bri);
    setHexInput(hex);
    onChange(hex);
  }, [hue, sat, bri, onChange]);

  const svPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        setSat(Math.max(0, Math.min(1, locationX / SV_SIZE)));
        setBri(Math.max(0, Math.min(1, 1 - locationY / SV_SIZE)));
      },
      onPanResponderMove: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        setSat(Math.max(0, Math.min(1, locationX / SV_SIZE)));
        setBri(Math.max(0, Math.min(1, 1 - locationY / SV_SIZE)));
      },
    })
  ).current;

  const huePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const { locationX } = e.nativeEvent;
        setHue(Math.max(0, Math.min(360, (locationX / HUE_W) * 360)));
      },
      onPanResponderMove: (e) => {
        const { locationX } = e.nativeEvent;
        setHue(Math.max(0, Math.min(360, (locationX / HUE_W) * 360)));
      },
    })
  ).current;

  const hueColor = hsvToHex(hue, 1, 1);
  const cursorX = sat * SV_SIZE;
  const cursorY = (1 - bri) * SV_SIZE;

  const handleHexInput = (text: string) => {
    setHexInput(text);
    if (isValidHex(text)) {
      const [nh, ns, nv] = hexToHsv(text);
      setHue(nh);
      setSat(ns);
      setBri(nv);
    }
  };

  return (
    <View
      style={{
        position: "absolute",
        top: 96,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: "white",
        borderRadius: 20,
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 8 },
        elevation: 10,
        padding: 20,
        marginHorizontal: 16,
      }}
    >
      <View
        {...svPan.panHandlers}
        style={
          {
            width: SV_SIZE,
            height: SV_SIZE,
            borderRadius: 12,
            overflow: "hidden",
            alignSelf: "center",
            marginBottom: 14,
            position: "relative",
            backgroundImage: `
              linear-gradient(to top, #000, transparent),
              linear-gradient(to right, #fff, ${hueColor})
            `,
          } as any
        }
      >
        <View
          style={{
            position: "absolute",
            left: cursorX - 9,
            top: cursorY - 9,
            width: 18,
            height: 18,
            borderRadius: 9,
            borderWidth: 2.5,
            borderColor: "white",
            shadowColor: "#000",
            shadowOpacity: 0.4,
            shadowRadius: 4,
            elevation: 5,
            backgroundColor: hsvToHex(hue, sat, bri),
          }}
        />
      </View>

      <View
        {...huePan.panHandlers}
        style={
          {
            width: HUE_W,
            height: 16,
            borderRadius: 8,
            alignSelf: "center",
            marginBottom: 16,
            backgroundImage:
              "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
            position: "relative",
          } as any
        }
      >
        <View
          style={{
            position: "absolute",
            left: (hue / 360) * HUE_W - 9,
            top: -3,
            width: 22,
            height: 22,
            borderRadius: 11,
            borderWidth: 2.5,
            borderColor: "white",
            backgroundColor: hueColor,
            shadowColor: "#000",
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 4,
          }}
        />
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          alignSelf: "center",
          marginBottom: 16,
          width: HUE_W,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: isValidHex(hexInput) ? hexInput : DEFAULT_BG,
            borderWidth: 1,
            borderColor: "#e5e7eb",
          }}
        />
        <TextInput
          value={hexInput}
          onChangeText={handleHexInput}
          placeholder="#000000"
          maxLength={7}
          style={
            {
              flex: 1,
              height: 36,
              borderWidth: 1,
              borderColor: "#e5e7eb",
              borderRadius: 8,
              paddingHorizontal: 10,
              fontSize: 13,
              fontFamily: "monospace",
              color: "#111827",
              outline: "none",
            } as any
          }
        />
      </View>

      <TouchableOpacity
        onPress={onClose}
        style={{
          alignSelf: "center",
          paddingVertical: 8,
          paddingHorizontal: 24,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: "#e5e7eb",
        }}
      >
        <Text style={{ color: "#6b7280", fontSize: 13, fontWeight: "500" }}>
          Done
        </Text>
      </TouchableOpacity>
    </View>
  );
}