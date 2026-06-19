"use client";

import { DropDown } from "@/components/ui/DropDown";
import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

interface FloorOption {
  id: string;
  name: string;
}

interface AddTableModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (e: React.FormEvent<HTMLFormElement>) => void;
  floors?: FloorOption[];
  defaultFloorId?: string;
}

export const AddTableModal: React.FC<AddTableModalProps> = ({
  open,
  onClose,
  onAdd,
  floors = [],
  defaultFloorId = "",
}) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"table" | "deco">("table");
  const [decoType, setDecoType] = useState<"PLANT" | "WALL" | "RECEPTION">("PLANT");
  const [decoName, setDecoName] = useState("");
  const resolveDefaultArea = () => {
    if (defaultFloorId && floors.some((f) => f.id === defaultFloorId)) {
      return defaultFloorId;
    }
    return floors[0]?.id || "";
  };
  const [formData, setFormData] = useState({
    number: "",
    capacity: "4",
    area: resolveDefaultArea(),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!open) return;
    const nextArea = resolveDefaultArea();
    if (nextArea) {
      setFormData((prev) => ({
        ...prev,
        area: prev.area && floors.some((f) => f.id === prev.area) ? prev.area : nextArea,
      }));
    }
  }, [open, floors, defaultFloorId]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (mode === "table") {
      if (!formData.number)
        newErrors.number = t(
          "dashboard.tables.add_table_modal.errors.number_required",
        );
      if (parseInt(formData.capacity) < 1)
        newErrors.capacity = t(
          "dashboard.tables.add_table_modal.errors.capacity_min",
        );
      if (parseInt(formData.capacity) > 20)
        newErrors.capacity = t(
          "dashboard.tables.add_table_modal.errors.capacity_max",
        );
    } else {
      if (!decoName.trim()) {
        newErrors.decoName = t(
          "dashboard.tables.add_table_modal.errors.deco_name_required",
          { defaultValue: "Vui lòng nhập tên vật phẩm trang trí" }
        );
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!formData.area || !floors.some((f) => f.id === formData.area)) {
      setErrors({
        area: t("dashboard.tables.add_table_modal.errors.area_required", {
          defaultValue: "Vui lòng chọn khu vực hợp lệ",
        }),
      });
      return;
    }

    onAdd(e);
    setFormData({ number: "", capacity: "4", area: resolveDefaultArea() });
    setDecoName("");
    setErrors({});
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(8px)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "var(--card)",
                borderRadius: 16,
                width: "90%",
                maxWidth: 520,
                overflow: "hidden",
                boxShadow: "0 24px 64px rgba(0, 0, 0, 0.4)",
                border: "1px solid var(--border)",
              }}>
              {/* Header */}
              <div
                style={{
                  background:
                    "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
                  padding: "32px",
                  position: "relative",
                  overflow: "hidden",
                }}>
                {/* Decorative elements */}
                <div
                  style={{
                    position: "absolute",
                    top: -60,
                    right: -60,
                    width: 200,
                    height: 200,
                    background: "rgba(255, 255, 255, 0.08)",
                    borderRadius: "50%",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: -40,
                    left: -40,
                    width: 140,
                    height: 140,
                    background: "rgba(255, 255, 255, 0.06)",
                    borderRadius: "50%",
                  }}
                />

                <div style={{ position: "relative", zIndex: 1 }}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                    style={{
                      width: 56,
                      height: 56,
                      marginBottom: 16,
                      background: "rgba(255, 255, 255, 0.2)",
                      backdropFilter: "blur(10px)",
                      borderRadius: 14,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="2.5"
                      strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </motion.div>
                  <h2
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: 26,
                      fontWeight: 700,
                      color: "#fff",
                      letterSpacing: "-0.02em",
                    }}>
                    {t("dashboard.tables.add_table_modal.title")}
                  </h2>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      color: "rgba(255, 255, 255, 0.85)",
                      lineHeight: 1.5,
                    }}>
                    {t("dashboard.tables.add_table_modal.subtitle")}
                  </p>
                </div>
              </div>

              {/* Form */}
              <div style={{ padding: "32px" }}>
                <form onSubmit={handleSubmit}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 24,
                    }}>
                    
                    {/* Mode selector tab bar */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 12, borderBottom: "1.5px solid var(--border)", paddingBottom: 12 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setMode("table");
                          setErrors({});
                        }}
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          fontWeight: 600,
                          background: "transparent",
                          border: "none",
                          color: mode === "table" ? "var(--primary)" : "var(--text-muted)",
                          borderBottom: mode === "table" ? "2px solid var(--primary)" : "none",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        {t("dashboard.tables.add_table_modal.tab_table", { defaultValue: "Bàn ăn" })}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMode("deco");
                          setErrors({});
                        }}
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          fontWeight: 600,
                          background: "transparent",
                          border: "none",
                          color: mode === "deco" ? "var(--primary)" : "var(--text-muted)",
                          borderBottom: mode === "deco" ? "2px solid var(--primary)" : "none",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        {t("dashboard.tables.add_table_modal.tab_deco", { defaultValue: "Trang trí" })}
                      </button>
                    </div>

                    {/* Hidden inputs to pass data via e.currentTarget to parent onAdd */}
                    <input
                      type="hidden"
                      name="number"
                      value={mode === "table" ? formData.number : `DECO_${decoType}_${decoName}`}
                    />
                    <input
                      type="hidden"
                      name="capacity"
                      value={mode === "table" ? formData.capacity : "0"}
                    />

                    {mode === "table" ? (
                      <>
                        {/* Table Number */}
                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.15 }}>
                          <label
                            htmlFor="table_number_display"
                            style={{
                              display: "block",
                              fontSize: 13,
                              fontWeight: 600,
                              color: "var(--text)",
                              marginBottom: 8,
                              letterSpacing: "-0.01em",
                            }}>
                            {t("dashboard.tables.add_table_modal.table_number")}{" "}
                            <span style={{ color: "#ff4d4f" }}>*</span>
                          </label>
                          <input
                            id="table_number_display"
                            type="text"
                            value={formData.number}
                            onChange={(e) => {
                              setFormData({ ...formData, number: e.target.value });
                              if (errors.number)
                                setErrors({ ...errors, number: "" });
                            }}
                            required
                            style={{
                              width: "100%",
                              padding: "14px 16px",
                              borderRadius: 10,
                              border: errors.number
                                ? "2px solid #ff4d4f"
                                : "2px solid var(--border)",
                              background: "var(--surface)",
                              color: "var(--text)",
                              fontSize: 15,
                              fontWeight: 500,
                              outline: "none",
                              transition: "all 0.2s",
                            }}
                            onFocus={(e) =>
                              (e.target.style.borderColor = "var(--primary)")
                            }
                            onBlur={(e) =>
                            (e.target.style.borderColor = errors.number
                              ? "#ff4d4f"
                              : "var(--border)")
                            }
                          />
                          {errors.number && (
                            <motion.p
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              style={{
                                margin: "6px 0 0 0",
                                fontSize: 12,
                                color: "#ff4d4f",
                                fontWeight: 500,
                              }}>
                              {errors.number}
                            </motion.p>
                          )}
                        </motion.div>

                        {/* Capacity */}
                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.2 }}>
                          <label
                            htmlFor="capacity_display"
                            style={{
                              display: "block",
                              fontSize: 13,
                              fontWeight: 600,
                              color: "var(--text)",
                              marginBottom: 8,
                              letterSpacing: "-0.01em",
                            }}>
                            {t("dashboard.tables.add_table_modal.capacity")}{" "}
                            <span style={{ color: "#ff4d4f" }}>*</span>
                          </label>
                          <input
                            id="capacity_display"
                            type="number"
                            min="1"
                            max="20"
                            value={formData.capacity}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                capacity: e.target.value,
                              });
                              if (errors.capacity)
                                setErrors({ ...errors, capacity: "" });
                            }}
                            required
                            style={{
                              width: "100%",
                              padding: "14px 16px",
                              borderRadius: 10,
                              border: errors.capacity
                                ? "2px solid #ff4d4f"
                                : "2px solid var(--border)",
                              background: "var(--surface)",
                              color: "var(--text)",
                              fontSize: 15,
                              fontWeight: 500,
                              outline: "none",
                              transition: "all 0.2s",
                            }}
                            onFocus={(e) =>
                              (e.target.style.borderColor = "var(--primary)")
                            }
                            onBlur={(e) =>
                            (e.target.style.borderColor = errors.capacity
                              ? "#ff4d4f"
                              : "var(--border)")
                            }
                          />
                          {errors.capacity && (
                            <motion.p
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              style={{
                                margin: "6px 0 0 0",
                                fontSize: 12,
                                color: "#ff4d4f",
                                fontWeight: 500,
                              }}>
                              {errors.capacity}
                            </motion.p>
                          )}
                        </motion.div>
                      </>
                    ) : (
                      <>
                        {/* Decoration Type */}
                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.15 }}>
                          <label
                            htmlFor="deco_type"
                            style={{
                              display: "block",
                              fontSize: 13,
                              fontWeight: 600,
                              color: "var(--text)",
                              marginBottom: 8,
                              letterSpacing: "-0.01em",
                            }}>
                            {t("dashboard.tables.add_table_modal.deco_type", { defaultValue: "Loại vật phẩm trang trí" })} <span style={{ color: "#ff4d4f" }}>*</span>
                          </label>
                          <div style={{ position: "relative" }}>
                            <DropDown
                              id="deco_type"
                              value={decoType}
                              onChange={(e) => setDecoType(e.target.value as any)}
                              required
                              className="py-[14px] font-medium"
                              style={{
                                borderRadius: 10,
                                border: "2px solid var(--border)",
                              }}
                            >
                              <option value="PLANT">{t("dashboard.tables.add_table_modal.deco_type_plant", { defaultValue: "Cây cảnh (Potted Plant)" })}</option>
                              <option value="WALL">{t("dashboard.tables.add_table_modal.deco_type_wall", { defaultValue: "Vách tường / Hàng rào ngăn (Wall Partition)" })}</option>
                              <option value="RECEPTION">{t("dashboard.tables.add_table_modal.deco_type_reception", { defaultValue: "Quầy lễ tân (Reception Counter)" })}</option>
                            </DropDown>
                            <svg
                              style={{
                                position: "absolute",
                                right: 16,
                                top: "50%",
                                transform: "translateY(-50%)",
                                pointerEvents: "none",
                              }}
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="var(--text-muted)"
                              strokeWidth="2.5">
                              <path d="M6 9l6 6 6-6" strokeLinecap="round" />
                            </svg>
                          </div>
                        </motion.div>

                        {/* Decoration Name */}
                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.2 }}>
                          <label
                            htmlFor="deco_name"
                            style={{
                              display: "block",
                              fontSize: 13,
                              fontWeight: 600,
                              color: "var(--text)",
                              marginBottom: 8,
                              letterSpacing: "-0.01em",
                            }}>
                            {t("dashboard.tables.add_table_modal.deco_name", { defaultValue: "Tên vật phẩm trang trí" })} <span style={{ color: "#ff4d4f" }}>*</span>
                          </label>
                          <input
                            id="deco_name"
                            type="text"
                            value={decoName}
                            onChange={(e) => {
                              setDecoName(e.target.value);
                              if (errors.decoName)
                                setErrors({ ...errors, decoName: "" });
                            }}
                            placeholder={t("dashboard.tables.add_table_modal.deco_name_placeholder", { defaultValue: "Ví dụ: Cây xanh góc phòng, Vách tường số 1..." })}
                            required
                            style={{
                              width: "100%",
                              padding: "14px 16px",
                              borderRadius: 10,
                              border: errors.decoName
                                ? "2px solid #ff4d4f"
                                : "2px solid var(--border)",
                              background: "var(--surface)",
                              color: "var(--text)",
                              fontSize: 15,
                              fontWeight: 500,
                              outline: "none",
                              transition: "all 0.2s",
                            }}
                            onFocus={(e) =>
                              (e.target.style.borderColor = "var(--primary)")
                            }
                            onBlur={(e) =>
                            (e.target.style.borderColor = errors.decoName
                              ? "#ff4d4f"
                              : "var(--border)")
                            }
                          />
                          {errors.decoName && (
                            <motion.p
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              style={{
                                margin: "6px 0 0 0",
                                fontSize: 12,
                                color: "#ff4d4f",
                                fontWeight: 500,
                              }}>
                              {errors.decoName}
                            </motion.p>
                          )}
                        </motion.div>
                      </>
                    )}

                    {/* Area */}
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.25 }}>
                      <label
                        htmlFor="area"
                        style={{
                          display: "block",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--text)",
                          marginBottom: 8,
                          letterSpacing: "-0.01em",
                        }}>
                        {t("dashboard.tables.add_table_modal.area")}{" "}
                        <span style={{ color: "#ff4d4f" }}>*</span>
                      </label>
                      <div style={{ position: "relative" }}>
                        <DropDown
                          id="area"
                          name="area"
                          value={formData.area}
                          onChange={(e) =>
                            setFormData({ ...formData, area: e.target.value })
                          }
                          required
                          className="py-[14px] font-medium"
                          style={{
                            borderRadius: 10,
                            border: "2px solid var(--border)",
                          }}
                        >
                          {floors.length > 0 ? (
                            floors.map(f => (
                              <option key={f.id} value={f.id}>
                                {f.name}
                              </option>
                            ))
                          ) : (
                            <option value="" disabled>
                              {t("dashboard.tables.add_table_modal.no_floors", {
                                defaultValue: "Chưa có khu vực — hãy thêm tầng trước",
                              })}
                            </option>
                          )}
                        </DropDown>
                        <svg
                          style={{
                            position: "absolute",
                            right: 16,
                            top: "50%",
                            transform: "translateY(-50%)",
                            pointerEvents: "none",
                          }}
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--text-muted)"
                          strokeWidth="2.5">
                          <path d="M6 9l6 6 6-6" strokeLinecap="round" />
                        </svg>
                      </div>
                    </motion.div>
                  </div>

                  {/* Action Buttons */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    style={{ display: "flex", gap: 12, marginTop: 32 }}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={onClose}
                      style={{
                        flex: 1,
                        padding: "14px 20px",
                        borderRadius: 10,
                        border: "2px solid var(--border)",
                        background: "var(--surface)",
                        color: "var(--text)",
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: "pointer",
                        letterSpacing: "-0.01em",
                      }}>
                      {t("dashboard.tables.add_table_modal.cancel")}
                    </motion.button>
                    <motion.button
                      whileHover={{
                        scale: 1.02,
                        boxShadow: "0 8px 24px var(--primary-glow)",
                      }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      style={{
                        flex: 2,
                        padding: "14px 20px",
                        borderRadius: 10,
                        border: "none",
                        background:
                          "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
                        color: "#fff",
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        boxShadow: "0 4px 16px var(--primary-glow)",
                        letterSpacing: "-0.01em",
                      }}>
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      {t("dashboard.tables.add_table_modal.submit")}
                    </motion.button>
                  </motion.div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
};
