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

export async function requestTutorTurn(input, fetchImpl = fetch) {
  const response = await fetchImpl("/api/tutor", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(input)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "The tutor could not respond.");
  return result;
}
