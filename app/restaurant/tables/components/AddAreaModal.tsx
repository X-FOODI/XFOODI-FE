"use client";

import React from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

interface AddAreaModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: { name: string; width: number; height: number; template?: string }) => void;
  initialName?: string;
  initialWidth?: number;
  initialHeight?: number;
  showDimensions?: boolean;
  existingNames?: string[];
  title?: string;
  submitText?: string;
}

export const AddAreaModal: React.FC<AddAreaModalProps> = ({
  open,
  onClose,
  onSubmit,
  initialName = "",
  initialWidth = 1400,
  initialHeight = 900,
  showDimensions = false,
  existingNames = [],
  title,
  submitText,
}) => {
  const { t } = useTranslation();
  const [errors, setErrors] = React.useState<{ name?: string; width?: string; height?: string }>({});

  const normalizeName = (value: string) => value.trim().toLowerCase();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const rawName = (formData.get("name") as string) ?? "";
    const name = rawName.trim();
    const widthValue = Number(formData.get("width") ?? initialWidth);
    const heightValue = Number(formData.get("height") ?? initialHeight);

    const nextErrors: { name?: string; width?: string; height?: string } = {};

    if (!name) {
      nextErrors.name = t("dashboard.tables.add_area_modal.errors.name_required");
    } else if (name.length < 2) {
      nextErrors.name = t("dashboard.tables.add_area_modal.errors.name_min", { min: 2 });
    } else if (name.length > 50) {
      nextErrors.name = t("dashboard.tables.add_area_modal.errors.name_max", { max: 50 });
    } else {
      const exists = existingNames.some((n) => normalizeName(n) === normalizeName(name) && normalizeName(n) !== normalizeName(initialName));
      if (exists) {
        nextErrors.name = t("dashboard.tables.add_area_modal.errors.name_duplicate");
      }
    }

    if (showDimensions) {
      if (!Number.isFinite(widthValue)) {
        nextErrors.width = t("dashboard.tables.add_area_modal.errors.width_required");
      } else if (widthValue < 200) {
        nextErrors.width = t("dashboard.tables.add_area_modal.errors.width_min", { min: 200 });
      } else if (widthValue > 10000) {
        nextErrors.width = t("dashboard.tables.add_area_modal.errors.width_max", { max: 10000 });
      }

      if (!Number.isFinite(heightValue)) {
        nextErrors.height = t("dashboard.tables.add_area_modal.errors.height_required");
      } else if (heightValue < 200) {
        nextErrors.height = t("dashboard.tables.add_area_modal.errors.height_min", { min: 200 });
      } else if (heightValue > 10000) {
        nextErrors.height = t("dashboard.tables.add_area_modal.errors.height_max", { max: 10000 });
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const templateValue = formData.get("template") as string;

    onSubmit({
      name,
      width: showDimensions ? Math.round(widthValue) : initialWidth,
      height: showDimensions ? Math.round(heightValue) : initialHeight,
      template: showDimensions ? templateValue : undefined,
    });
  };

  if (!open || typeof document === "undefined") return null;

  const isFloorMode = showDimensions;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-md border border-[var(--border)]">
        <div className="p-6 border-b border-[var(--border)]">
          <h3 className="text-xl font-bold text-[var(--text)]">
            {title || t("dashboard.tables.add_area_modal.title")}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">
              {isFloorMode
                ? t("dashboard.tables.add_area_modal.floor_name_label", { defaultValue: t("dashboard.tables.add_area_modal.name_label") })
                : t("dashboard.tables.add_area_modal.name_label")}
            </label>
            <input
              name="name"
              type="text"
              required
              defaultValue={initialName}
              className="w-full px-4 py-2 rounded-lg bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"

            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {showDimensions && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">
                {t("dashboard.tables.add_area_modal.template_label", { defaultValue: "Bố cục mẫu" })}
              </label>
              <select
                name="template"
                defaultValue="empty"
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 mb-4"
              >
                <option value="empty" className="bg-[var(--card)] text-[var(--text)]">
                  {t("dashboard.tables.add_area_modal.template_empty", { defaultValue: "Khu vực trống (Tự thiết kế)" })}
                </option>
                <option value="standard" className="bg-[var(--card)] text-[var(--text)]">
                  {t("dashboard.tables.add_area_modal.template_standard", { defaultValue: "Nhà hàng tiêu chuẩn (Standard)" })}
                </option>
                <option value="vip" className="bg-[var(--card)] text-[var(--text)]">
                  {t("dashboard.tables.add_area_modal.template_vip", { defaultValue: "Phòng VIP sang trọng (Luxury VIP)" })}
                </option>
                <option value="cafe_bar" className="bg-[var(--card)] text-[var(--text)]">
                  {t("dashboard.tables.add_area_modal.template_cafe_bar", { defaultValue: "Quán Cafe & Quầy Bar (Cafe & Bar)" })}
                </option>
              </select>
            </div>
          )}

          {showDimensions && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">
                  {t("dashboard.tables.add_area_modal.width_label")}
                </label>
                <input
                  name="width"
                  type="number"
                  min={200}
                  max={10000}
                  required
                  defaultValue={initialWidth}
                  className="w-full px-4 py-2 rounded-lg bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                />
                {errors.width && (
                  <p className="text-xs text-red-500 mt-1">{errors.width}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">
                  {t("dashboard.tables.add_area_modal.height_label")}
                </label>
                <input
                  name="height"
                  type="number"
                  min={200}
                  max={10000}
                  required
                  defaultValue={initialHeight}
                  className="w-full px-4 py-2 rounded-lg bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                />
                {errors.height && (
                  <p className="text-xs text-red-500 mt-1">{errors.height}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg font-medium text-[var(--text-muted)] hover:bg-[var(--bg-base)] transition-colors">
              {t("dashboard.tables.add_area_modal.cancel")}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90 transition-colors shadow-lg shadow-[var(--primary)]/20">
              {submitText || t("dashboard.tables.add_area_modal.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};
