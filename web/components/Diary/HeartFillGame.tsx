import React, { useMemo, useState } from "react";

type HeartTier = "pink" | "bronze" | "gold";

const MAX_SCORE = 150;
const HEART_SIZE = 96;

function getTier(score: number): HeartTier {
  if (score >= 100) return "gold";
  if (score >= 50) return "bronze";
  return "pink";
}

function getTierColor(tier: HeartTier) {
  switch (tier) {
    case "gold":
      return "#facc15";
    case "bronze":
      return "#b87333";
    default:
      return "#ec4899";
  }
}

function getFillPercent(score: number) {
  if (score >= 100) return 100;
  if (score >= 50) return ((score - 50) / 50) * 100;
  return (score / 50) * 100;
}

export default function HeartFillGame() {
  const [score, setScore] = useState(0);

  const tier = useMemo(() => getTier(score), [score]);
  const color = useMemo(() => getTierColor(tier), [tier]);
  const fillPercent = useMemo(() => getFillPercent(score), [score]);

  const handlePress = () => {
    const random = Math.floor(Math.random() * 12) + 4;
    setScore((prev) => Math.min(prev + random, MAX_SCORE));
  };

  const fillWidth = `${fillPercent}%`;
  const fillLeft = `${50 - fillPercent / 2}%`;

  return (
    <button
      onClick={handlePress}
      type="button"
      style={{
        all: "unset",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
      }}
      aria-label="Increase heart level"
      title="Click to fill heart"
    >
      <div
        style={{
          position: "relative",
          width: HEART_SIZE,
          height: HEART_SIZE,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "heartFloat 2.2s ease-in-out infinite",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width={HEART_SIZE}
          height={HEART_SIZE}
          style={{
            position: "absolute",
            inset: 0,
            overflow: "visible",
          }}
        >
          <defs>
            <clipPath id="heartClip">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </clipPath>
          </defs>

          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            fill="#f3f4f6"
            stroke="#d1d5db"
            strokeWidth="1"
          />

          <g clipPath="url(#heartClip)">
            <rect
              x={fillLeft}
              y="0"
              width={fillWidth}
              height="24"
              fill={color}
              style={{
                transition: "all 360ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            />
          </g>

          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            fill="none"
            stroke="#d1d5db"
            strokeWidth="1"
          />
        </svg>
      </div>

      <div
        style={{
          marginTop: 6,
          fontSize: 24,
          fontWeight: 800,
          color,
          lineHeight: 1,
          transition: "color 240ms ease",
        }}
      >
        {score}
      </div>

      <style>
        {`
          @keyframes heartFloat {
            0% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-2px) scale(1.03); }
            100% { transform: translateY(0px) scale(1); }
          }
        `}
      </style>
    </button>
  );
}