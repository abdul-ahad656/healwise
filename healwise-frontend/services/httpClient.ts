/**
 * JSON fetch with timeout so UI never spins forever on unreachable hosts.
 */
export async function fetchJson<T = unknown>(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<{ response: Response; data: T }> {
  const { timeoutMs = 25000, signal: outerSignal, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const onAbort = () => controller.abort();
  outerSignal?.addEventListener("abort", onAbort);

  try {
    const response = await fetch(url, {
      ...rest,
      signal: controller.signal,
    });
    const text = await response.text();
    let data: T;
    try {
      data = (text ? JSON.parse(text) : {}) as T;
    } catch {
      throw new Error(
        `Invalid JSON from server (${response.status}). Check that the API is running and URL is correct.`
      );
    }
    return { response, data };
  } catch (e: unknown) {
    const err = e as { name?: string; message?: string };
    if (err?.name === "AbortError") {
      const tried = url.replace(/\?.*$/, "");
      throw new Error(
        `Request timed out (${tried}). Same Wi‑Fi as the PC, Windows firewall allowing port 5000, Flask running (host 0.0.0.0). Override URL: EXPO_PUBLIC_API_BASE_URL in .env then restart Metro with -c.`
      );
    }
    if (err?.message === "Network request failed" || err?.message?.includes("Network")) {
      const tried = url.replace(/\?.*$/, "");
      const hint127 =
        tried.includes("127.0.0.1") || tried.includes("localhost")
          ? " If the URL uses 127.0.0.1 on a phone, that targets the phone itself — set EXPO_PUBLIC_API_BASE_URL to your PC’s LAN IP (ipconfig) or run adb reverse tcp:5000 tcp:5000 for USB."
          : "";
      throw new Error(
        `Network request failed (${tried}).${hint127} Check Flask on port 5000, same Wi‑Fi, firewall, and EXPO_PUBLIC_API_BASE_URL in .env; restart Metro with -c.`
      );
    }
    throw e;
  } finally {
    clearTimeout(timer);
    outerSignal?.removeEventListener("abort", onAbort);
  }
}
