"use client";
import reservationService, {
  Reservation,
  UpdateReservationDto,
  AvailableTable,
} from "@/lib/services/reservationService";
import { Button, InputNumber } from "antd";
import React, { useState } from "react";

interface Props {
  reservation: Reservation;
  onSave: (updated: Reservation) => void;
  brandColor?: string;
}

export default function EditReservationForm({ reservation, onSave, brandColor = "#FF380B" }: Props) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [guests, setGuests] = useState(reservation.numberOfGuests);
  const [time, setTime] = useState(reservation.time.slice(0, 16)); // "YYYY-MM-DDTHH:mm"
  const [specialRequests, setSpecialRequests] = useState(reservation.specialRequests ?? "");
  const [availableTables, setAvailableTables] = useState<AvailableTable[]>([]);
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>(
    reservation.tables?.map((t) => t.tableId) ?? []
  );
  const [checkingTables, setCheckingTables] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  // Only editable if PENDING or CONFIRMED
  const isEditable = ["PENDING", "CONFIRMED"].includes(reservation.statusValue?.code ?? "");
  if (!isEditable) return null;

  const handleCheckTables = async () => {
    if (!time) return;
    setCheckingTables(true);
    setConflictError(null);
    try {
      const tables = await reservationService.checkTables({
        restaurantId: reservation.restaurantId,
        time: new Date(time).toISOString(),
        numberOfGuests: guests,
      });
      setAvailableTables(tables);
    } catch (err: any) {
      setConflictError(err.message || "Không thể kiểm tra bàn trống");
    } finally {
      setCheckingTables(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const dto: UpdateReservationDto = {};
      if (guests !== reservation.numberOfGuests) dto.numberOfGuests = guests;
      const newTime = new Date(time).toISOString();
      if (newTime !== reservation.time) dto.time = newTime;
      if (specialRequests !== (reservation.specialRequests ?? "")) dto.specialRequests = specialRequests;
      // Always send tableIds if we've checked tables (may be empty array to clear)
      if (availableTables.length > 0) dto.tableIds = selectedTableIds;

      const updated = await reservationService.update(reservation.id, dto);
      onSave(updated);
      setEditing(false);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err.message ?? "Không thể cập nhật");
    } finally {
      setLoading(false);
    }
  };

  if (!editing) {
    return (
      <Button
        size="small"
        onClick={() => setEditing(true)}
        style={{ borderRadius: 8, fontSize: 12, borderColor: brandColor, color: brandColor }}
      >
        ✏️ Chỉnh sửa
      </Button>
    );
  }

  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: 14,
        border: "1px solid var(--border)",
        padding: 20,
        marginTop: 12,
      }}
    >
      <h4 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
        ✏️ Chỉnh sửa đặt bàn
      </h4>

      {/* Number of guests */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
          Số khách
        </label>
        <InputNumber
          min={1}
          max={50}
          value={guests}
          onChange={(v) => setGuests(v ?? 1)}
          style={{ width: "100%" }}
        />
      </div>

      {/* Reservation time */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
          Thời gian
        </label>
        <input
          type="datetime-local"
          value={time}
          min={new Date().toISOString().slice(0, 16)}
          onChange={(e) => { setTime(e.target.value); setAvailableTables([]); }}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--card)",
            color: "var(--text)",
            fontSize: 14,
          }}
        />
      </div>

      {/* Special requests */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
          Yêu cầu đặc biệt
        </label>
        <textarea
          value={specialRequests}
          onChange={(e) => setSpecialRequests(e.target.value)}
          rows={2}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--card)",
            color: "var(--text)",
            fontSize: 13,
            resize: "vertical",
          }}
        />
      </div>

      {/* Table selection */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>Bàn</label>
          <Button size="small" loading={checkingTables} onClick={handleCheckTables} style={{ fontSize: 12 }}>
            Kiểm tra bàn trống
          </Button>
        </div>
        {conflictError && (
          <p style={{ fontSize: 12, color: "#ef4444", margin: "0 0 8px" }}>{conflictError}</p>
        )}
        {availableTables.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {availableTables.map((t) => {
              const selected = selectedTableIds.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() =>
                    setSelectedTableIds(
                      selected ? selectedTableIds.filter((id) => id !== t.id) : [...selectedTableIds, t.id]
                    )
                  }
                  style={{
                    padding: "10px 8px",
                    borderRadius: 8,
                    border: `2px solid ${selected ? brandColor : "var(--border)"}`,
                    background: selected ? `${brandColor}12` : "var(--surface)",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 700, color: selected ? brandColor : "var(--text)", fontSize: 13 }}>
                    Bàn {t.code}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-muted)" }}>
                    {t.seatingCapacity} chỗ · {t.floor?.name}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {error && <p style={{ fontSize: 12, color: "#ef4444", margin: "0 0 12px" }}>{error}</p>}

      <div style={{ display: "flex", gap: 8 }}>
        <Button onClick={() => setEditing(false)} style={{ flex: 1 }}>
          Huỷ
        </Button>
        <Button
          type="primary"
          loading={loading}
          onClick={handleSave}
          style={{ flex: 2, background: brandColor, borderColor: brandColor, fontWeight: 700 }}
        >
          Lưu thay đổi
        </Button>
      </div>
    </div>
  );
}
