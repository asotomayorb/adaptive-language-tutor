export async function checkTutorHealth(fetchImpl = fetch, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl("/api/health", {
      headers: { accept: "application/json" },
      signal: controller.signal
    });
    if (!response.ok) throw new Error("Tutor API is unavailable.");
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function requestTutorTurn(input, fetchImpl = fetch, options = {}) {
  const { signal: sessionSignal, timeoutMs = 30000 } = options;
  if (sessionSignal?.aborted) throw new Error("La sesión ya no está activa.");

  const controller = new AbortController();
  const abortForSession = () => controller.abort();
  sessionSignal?.addEventListener("abort", abortForSession, { once: true });
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl("/api/tutor", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(input),
      signal: controller.signal
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "El tutor no pudo responder.");
    return result;
  } catch (error) {
    if (sessionSignal?.aborted) throw new Error("La sesión fue cerrada.");
    if (controller.signal.aborted) throw new Error("El tutor tardó demasiado en responder. Puedes reintentar.");
    throw error;
  } finally {
    clearTimeout(timeout);
    sessionSignal?.removeEventListener("abort", abortForSession);
  }
}
