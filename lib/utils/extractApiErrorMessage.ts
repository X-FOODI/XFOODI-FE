type GenericRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is GenericRecord => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const GENERIC_CLIENT_ERROR_PATTERNS = [
  /^Request failed with status code \d{3}$/i,
  /^Network Error$/i,
  /^Bad Request$/i,
  /^timeout of \d+ms exceeded$/i,
  /^cancell?ed$/i,
  /^Failed to fetch$/i,
  /^Load failed$/i,
  /^An internal error occurred(?:\b|\s|\.)/i,
  /^Internal server error$/i,
  /^Loi noi bo he thong$/i,
  /^Da xay ra loi noi bo$/i,
];

const TECHNICAL_ERROR_PATTERNS = [
  /\bexception\b/i,
  /\bstack\s*trace\b/i,
  /\binner\s*exception\b/i,
  /\bnull\s*reference\b/i,
  /\bobject\s*reference\s*not\s*set\b/i,
  /\bsystem\.[a-z0-9_.]+/i,
  /\bsql\b/i,
  /\bdatabase\b/i,
  /\bentity\s*framework\b/i,
  /\bat\s+[a-z0-9_.]+\s*\(/i,
  /\baxios\b/i,
  /\bhttp\s*\d{3}\b/i,
];

const REQUIRED_FIELD_PATTERNS = [
  /\brequired\b/i,
  /\bmust\s*not\s*be\s*empty\b/i,
  /\bcannot\s*be\s*empty\b/i,
  /\bcannot\s*be\s*null\b/i,
  /\bis\s*missing\b/i,
];

const USER_ACTIONABLE_STATUSES = new Set([400, 409, 422]);

const looksLikeHtml = (value: string): boolean => {
  const normalized = value.trim().toLowerCase();
  return normalized.startsWith("<!doctype html") || normalized.startsWith("<html");
};

const isGenericClientError = (value: string): boolean => {
  return GENERIC_CLIENT_ERROR_PATTERNS.some((pattern) => pattern.test(value));
};

const normalizeText = (value: string): string => {
  return value.replace(/\s+/g, " ").trim();
};

const isTechnicalError = (value: string): boolean => {
  return TECHNICAL_ERROR_PATTERNS.some((pattern) => pattern.test(value));
};

const getText = (value: unknown): string => {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
};

const toMeaningfulText = (value: unknown): string => {
  const text = getText(value);
  if (!text) {
    return "";
  }

  const normalized = normalizeText(text);
  if (
    !normalized ||
    isGenericClientError(normalized) ||
    looksLikeHtml(normalized) ||
    isTechnicalError(normalized)
  ) {
    return "";
  }

  return normalized;
};

const humanizeFieldName = (field: string): string => {
  return field
    .replace(/\[(\d+)\]/g, (_, index: string) => ` ${Number(index) + 1}`)
    .replace(/[._]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
};

const normalizeValidationErrors = (value: unknown): string => {
  if (!isRecord(value)) {
    return "";
  }

  return Object.entries(value)
    .map(([field, messages]) => {
      const fieldLabel = humanizeFieldName(field);

      if (Array.isArray(messages)) {
        const normalizedMessages = messages
          .map((item) => {
            const text = toMeaningfulText(item);
            if (!text) {
              return "";
            }

            if (REQUIRED_FIELD_PATTERNS.some((pattern) => pattern.test(text))) {
              return "required";
            }

            return text;
          })
          .filter(Boolean)
          .join(", ");

        return normalizedMessages ? `${fieldLabel}: ${normalizedMessages}` : "";
      }

      const messageText = toMeaningfulText(messages);
      if (messageText) {
        if (REQUIRED_FIELD_PATTERNS.some((pattern) => pattern.test(messageText))) {
          return `${fieldLabel}: required`;
        }

        return `${fieldLabel}: ${messageText}`;
      }

      return "";
    })
    .filter(Boolean)
    .join(" | ");
};

const fromPayload = (payload: unknown): string => {
  const directText = toMeaningfulText(payload);
  if (directText) {
    return directText;
  }

  if (Array.isArray(payload)) {
    const joined = payload
      .map((item) => fromPayload(item))
      .filter(Boolean)
      .join(" | ");

    if (joined) {
      return joined;
    }
    return "";
  }

  if (!isRecord(payload)) {
    return "";
  }

  const validationText = normalizeValidationErrors(
    isRecord(payload.errors)
      ? payload.errors
      : isRecord(payload.validationErrors)
        ? payload.validationErrors
        : undefined,
  );
  if (validationText) {
    return validationText;
  }

  const orderedKeys = [
    "message",
    "title",
    "detail",
    "error",
    "description",
    "errorMessage",
    "userMessage",
    "reason",
  ];

  for (const key of orderedKeys) {
    const value = payload[key];
    const text = isRecord(value) || Array.isArray(value)
      ? fromPayload(value)
      : toMeaningfulText(value);

    if (/one or more validation errors occurred/i.test(text)) {
      continue;
    }

    if (text) {
      return text;
    }
  }

  const nestedDataText = fromPayload(payload.data);
  if (nestedDataText) {
    return nestedDataText;
  }

  return "";
};

export const extractApiErrorMessage = (
  error: unknown,
  fallbackMessage: string,
): string => {
  if (isRecord(error)) {
    const statusValue = (error.response as GenericRecord | undefined)?.status;
    const status = typeof statusValue === "number" ? statusValue : undefined;

    if (status && status >= 500) {
      return fallbackMessage;
    }

    const responseDataText = fromPayload((error.response as GenericRecord | undefined)?.data);
    if (responseDataText && (USER_ACTIONABLE_STATUSES.has(status ?? -1) || !status)) {
      return responseDataText;
    }

    const directDataText = fromPayload(error.data);
    if (directDataText && (USER_ACTIONABLE_STATUSES.has(status ?? -1) || !status)) {
      return directDataText;
    }

    const responseContainerText = fromPayload(error.response);
    if (responseContainerText && (USER_ACTIONABLE_STATUSES.has(status ?? -1) || !status)) {
      return responseContainerText;
    }

    const messageText = toMeaningfulText(error.message);
    if (messageText && (USER_ACTIONABLE_STATUSES.has(status ?? -1) || !status)) {
      return messageText;
    }

    const fromErrorPayload = fromPayload(error);
    if (fromErrorPayload && (USER_ACTIONABLE_STATUSES.has(status ?? -1) || !status)) {
      return fromErrorPayload;
    }

    if (status === 401) {
      return "Please sign in again to continue.";
    }

    if (status === 403) {
      return "You do not have permission to perform this action.";
    }

    if (status === 404) {
      return "The requested data was not found.";
    }

    if (status === 409) {
      return "The request conflicts with existing data.";
    }

    if (status === 422) {
      return "Invalid data. Please review the entered fields.";
    }

  }

  return fallbackMessage;
};
