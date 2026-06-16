"use client";

import React, { useState } from "react";
import { Button } from "antd";

interface Props {
  onSuccess: (code: string) => void;
  onClose: () => void;
}

export default function QRScannerModal({ onSuccess, onClose }: Props) {
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleManualSubmit = () => {
    const trimmed = manualCode.trim();
    if (!trimmed) {
      setError("Vui lòng nhập mã xác nhận");
      return;
    }
    setError(null);
    onSuccess(trimmed);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "var(--card)",
          borderRadius: 20,
          padding: 28,
          width: 360,
          maxWidth: "90vw",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: 0 }}>
            📷 Quét QR Check-in
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 18,
              color: "var(--text-muted)",
              lineHeight: 1,
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* QR placeholder area */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 14,
            border: "2px dashed var(--border)",
            height: 180,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
            gap: 8,
          }}
        >
          <span style={{ fontSize: 40 }}>📷</span>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
            Camera quét QR chưa khả dụng
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
            Vui lòng nhập mã thủ công bên dưới
          </p>
        </div>

        {/* Manual code input */}
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-muted)",
              display: "block",
              marginBottom: 6,
            }}
          >
            Mã xác nhận
          </label>
          <input
            type="text"
            value={manualCode}
            onChange={(e) => { setManualCode(e.target.value); setError(null); }}
            onKeyDown={(e) => { if (e.key === "Enter") handleManualSubmit(); }}
            placeholder="Nhập mã xác nhận..."
            autoFocus
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 10,
              border: `1px solid ${error ? "#ef4444" : "var(--border)"}`,
              background: "var(--surface)",
              color: "var(--text)",
              fontSize: 15,
              fontFamily: "monospace",
              letterSpacing: "0.05em",
              boxSizing: "border-box",
            }}
          />
          {error && (
            <p style={{ margin: "6px 0 0", fontSize: 12, color: "#ef4444" }}>{error}</p>
          )}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Button onClick={onClose} style={{ flex: 1 }}>
            Huỷ
          </Button>
          <Button
            type="primary"
            onClick={handleManualSubmit}
            disabled={!manualCode.trim()}
            style={{
              flex: 2,
              background: "#10b981",
              borderColor: "#10b981",
              fontWeight: 700,
              borderRadius: 10,
            }}
          >
            Check-in
          </Button>
        </div>
      </div>
    </div>
  );
}
