export function isAbortError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;

  const value = err as { code?: unknown; message?: unknown; name?: unknown };
  const name = typeof value.name === "string" ? value.name : "";
  const code = typeof value.code === "string" ? value.code : "";
  const message = typeof value.message === "string" ? value.message.toLowerCase() : "";

  return (
    name === "AbortError" ||
    code === "ABORT_ERR" ||
    message.includes("aborted") ||
    message.includes("abort")
  );
}
