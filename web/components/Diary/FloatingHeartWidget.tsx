import React, { useState } from "react";
import HeartFillGame from "./HeartFillGame";

export default function FloatingHeartWidget() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      style={{
        position: "fixed",
        right: 20,
        zIndex: 9999,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "flex-end",
      }}
    >
      <div
        style={{
          width: collapsed ? 56 : 148,
          minHeight: 56,
          borderRadius: 20,
          background: "rgba(255,255,255,0.2)",
          border: "1px solid rgba(229,231,235,0.5)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          overflow: "hidden",
          transition: "width 260ms ease, transform 260ms ease, opacity 260ms ease",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: collapsed ? "center" : "space-between",
            alignItems: "center",
            padding: collapsed ? "8px" : "10px 10px 6px 12px",
            gap: 8,
          }}
        >

          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              background: "#fff",
              cursor: "pointer",
              fontSize: 16,
              fontWeight: 700,
              color: "#374151",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
            aria-label={collapsed ? "Expand widget" : "Collapse widget"}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? "♥" : "—"}
          </button>
        </div>

        {!collapsed && (
          <div
            style={{
              padding: "4px 12px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <HeartFillGame />
          </div>
        )}
      </div>
    </div>
  );
}