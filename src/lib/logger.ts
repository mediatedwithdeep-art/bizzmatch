import { env, isProduction } from "./env";

type Level = "debug" | "info" | "warn" | "error";
const ORDER: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const min = ORDER[env.LOG_LEVEL];

function emit(level: Level, msg: string, meta?: Record<string, unknown>) {
  if (ORDER[level] < min) return;
  if (isProduction) {
    // Structured JSON for log aggregators.
    console[level === "debug" ? "log" : level](
      JSON.stringify({ ts: new Date().toISOString(), level, msg, ...meta }),
    );
  } else {
    console[level === "debug" ? "log" : level](`[${level}] ${msg}`, meta ?? "");
  }
}

export const log = {
  debug: (msg: string, meta?: Record<string, unknown>) => emit("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => emit("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => emit("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => emit("error", msg, meta),
};
