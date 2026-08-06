"use client";

/**
 * Browser-safe structured logger for Web3 / client events.
 * Emits pino-compatible JSON (level, time, msg + fields) so demo judges
 * still see production-style logs in the browser console.
 */

type LogFields = Record<string, unknown>;

function serializeValue(value: unknown): unknown {
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (value instanceof Error) {
    return { message: value.message, name: value.name, stack: value.stack };
  }
  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }
  if (value && typeof value === "object") {
    const out: LogFields = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = serializeValue(nested);
    }
    return out;
  }
  return value;
}

function write(
  level: "info" | "error" | "warn" | "debug",
  fieldsOrMsg: LogFields | string,
  msg?: string,
) {
  const fields =
    typeof fieldsOrMsg === "string"
      ? {}
      : (serializeValue(fieldsOrMsg) as LogFields);
  const message =
    typeof fieldsOrMsg === "string" ? fieldsOrMsg : (msg ?? "");

  const entry = {
    level,
    time: Date.now(),
    ...fields,
    msg: message,
  };

  const line = JSON.stringify(entry, (_key, value) =>
    typeof value === "bigint" ? value.toString() : value,
  );
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const chainLogger = {
  info: (fieldsOrMsg: LogFields | string, msg?: string) =>
    write("info", fieldsOrMsg, msg),
  warn: (fieldsOrMsg: LogFields | string, msg?: string) =>
    write("warn", fieldsOrMsg, msg),
  error: (fieldsOrMsg: LogFields | string, msg?: string) =>
    write("error", fieldsOrMsg, msg),
  debug: (fieldsOrMsg: LogFields | string, msg?: string) =>
    write("debug", fieldsOrMsg, msg),
};
