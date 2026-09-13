function isAbortError(reason: unknown): boolean {
  if (!reason || typeof reason !== "object") return false;

  const value = reason as { code?: unknown; message?: unknown; name?: unknown };
  const name = typeof value.name === "string" ? value.name : "";
  const code = typeof value.code === "string" ? value.code : "";
  const message = typeof value.message === "string" ? value.message.toLowerCase() : "";

  return (
    name === "AbortError" ||
    code === "ABORT_ERR" ||
    message.includes("aborted a request") ||
    message.includes("signal is aborted") ||
    message.includes("operation was aborted")
  );
}

window.addEventListener(
  "unhandledrejection",
  (event) => {
    if (isAbortError(event.reason)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  },
  true
);

window.addEventListener(
  "error",
  (event) => {
    if (isAbortError(event.error)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  },
  true
);
