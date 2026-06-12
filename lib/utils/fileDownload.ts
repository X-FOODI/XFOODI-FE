export interface DownloadableFile {
  blob: Blob;
  fileName: string;
}

const sanitizeFileName = (name: string, fallback: string): string => {
  const sanitized = name.replace(/[\\/:*?"<>|]/g, "_").trim();
  return sanitized.length > 0 ? sanitized : fallback;
};

export const getFileNameFromContentDisposition = (
  contentDisposition: string | undefined,
  fallbackName: string,
): string => {
  if (!contentDisposition) {
    return fallbackName;
  }

  // RFC 5987: filename*=UTF-8''encoded%20name.xlsx
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return sanitizeFileName(decodeURIComponent(utf8Match[1]), fallbackName);
    } catch {
      return sanitizeFileName(utf8Match[1], fallbackName);
    }
  }

  const basicMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (basicMatch?.[1]) {
    return sanitizeFileName(basicMatch[1], fallbackName);
  }

  return fallbackName;
};

export const triggerBrowserDownload = (blob: Blob, fileName: string): void => {
  if (typeof window === "undefined") {
    return;
  }

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
};
