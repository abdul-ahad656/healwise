import { NativeModules, Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";

function hostFromHttpUrl(url: string): string | null {
  const m = url.match(/https?:\/\/([^/:]+)/);
  return m?.[1]?.trim() || null;
}

/**
 * Host where Metro served the JS bundle (LAN IP, 10.0.2.2 on emulator, or localhost when using adb reverse).
 */
function getDevHostFromBundleScript(): string | null {
  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL as string | undefined;
    if (!scriptURL || typeof scriptURL !== "string") return null;
    if (scriptURL.startsWith("file:")) return null;

    const host = hostFromHttpUrl(scriptURL);
    if (!host) return null;

    if (host === "127.0.0.1" || host === "localhost") {
      if (Platform.OS !== "android") return null;
      // USB + adb reverse tcp:8081 → bundle is localhost; Flask needs adb reverse tcp:5000 too.
      // Emulator: localhost in bundle is wrong for host — use special alias.
      return Device.isDevice ? "127.0.0.1" : "10.0.2.2";
    }

    return host;
  } catch {
    return null;
  }
}

/** Classic embedded manifest fields (sometimes set when expoConfig.hostUri is missing). */
function getDevHostFromLegacyManifest(): string | null {
  const man = Constants.manifest as Record<string, unknown> | null;
  if (!man) return null;

  for (const key of ["hostUri", "debuggerHost"] as const) {
    const v = man[key];
    if (typeof v === "string") {
      const h = v.split(":")[0]?.trim();
      if (h && h !== "127.0.0.1" && h !== "localhost") return h;
    }
  }

  const bundleUrl = man.bundleUrl;
  if (typeof bundleUrl === "string") {
    const h = hostFromHttpUrl(bundleUrl);
    if (h && h !== "127.0.0.1" && h !== "localhost") return h;
  }

  return null;
}

/**
 * Dev machine hostname (no port) from Expo when available (e.g. Expo Go).
 */
function getDevHostFromExpo(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri && typeof hostUri === "string") {
    const host = hostUri.split(":")[0]?.trim();
    if (host && host !== "127.0.0.1" && host !== "localhost") {
      return host;
    }
  }
  const go = Constants.expoGoConfig as { debuggerHost?: string } | null;
  const dbg = go?.debuggerHost;
  if (dbg && typeof dbg === "string") {
    const host = dbg.split(":")[0]?.trim();
    if (host && host !== "127.0.0.1" && host !== "localhost") {
      return host;
    }
  }
  return null;
}

function trimEnvQuotes(v: string): string {
  let s = v.trim();
  if (s.length >= 2 && ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")))) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

/** Optional: `EXPO_PUBLIC_DEV_LAN_HOST=192.168.1.10` (no scheme/port) when auto-detect fails on a real phone. */
function resolveDevLanHostFromEnv(): string | null {
  const raw = trimEnvQuotes(process.env.EXPO_PUBLIC_DEV_LAN_HOST ?? "");
  if (!raw) return null;
  let s = raw.replace(/^https?:\/\//i, "");
  s = s.split("/")[0] || s;
  s = s.split(":")[0] || s;
  const host = s.trim();
  return host || null;
}

/**
 * Base URL for the Flask API **without** the `/api` suffix.
 *
 * - **EXPO_PUBLIC_API_BASE_URL**: full base, e.g. `http://192.168.1.10:5000` — overrides everything.
 * - **EXPO_PUBLIC_DEV_LAN_HOST**: PC hostname/IP only when auto-detect fails on a physical device.
 * - **Dev**: prefers Metro bundle URL host, then manifest / Expo fields.
 * - **Android emulator** (no host found): `http://10.0.2.2:5000`
 * - **Android physical** (no host, no env): cannot guess your PC — set `EXPO_PUBLIC_API_BASE_URL` or `EXPO_PUBLIC_DEV_LAN_HOST` (see thrown error in dev).
 */
function resolveApiRoot(): string {
  const env = trimEnvQuotes(process.env.EXPO_PUBLIC_API_BASE_URL ?? "");
  if (env) {
    let base = env.replace(/\/+$/, "");
    if (base.toLowerCase().endsWith("/api")) {
      base = base.slice(0, -4);
    }
    return base;
  }

  if (Platform.OS === "web") {
    return "http://localhost:5000";
  }

  if (__DEV__) {
    // Explicit LAN override first (Metro auto-detect can be wrong or missing on dev clients).
    const lan = resolveDevLanHostFromEnv();
    if (lan) {
      return `http://${lan}:5000`;
    }

    const devHost =
      getDevHostFromBundleScript() ??
      getDevHostFromLegacyManifest() ??
      getDevHostFromExpo();

    if (devHost) {
      return `http://${devHost}:5000`;
    }

    if (Platform.OS === "android") {
      if (!Device.isDevice) {
        return "http://10.0.2.2:5000";
      }
      // Real phone: 127.0.0.1 is the device itself, not your PC (unless adb reverse + localhost bundle).
      throw new Error(
        "[HealWise dev] No API host for this Android device. Add to healwise-frontend/.env (replace with your PC Wi‑Fi IPv4 from ipconfig):\n\n" +
          "EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:5000\n\n" +
          "Then restart Metro: npx expo start -c\n\n" +
          "Or set only the host: EXPO_PUBLIC_DEV_LAN_HOST=192.168.x.x\n" +
          "USB option: adb reverse tcp:5000 tcp:5000 and ensure the JS bundle URL uses localhost so auto-detect maps to 127.0.0.1."
      );
    }

    if (Platform.OS === "ios") {
      return "http://localhost:5000";
    }

    return "http://localhost:5000";
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:5000";
  }

  if (Platform.OS === "ios") {
    return "http://localhost:5000";
  }

  return "http://localhost:5000";
}

export const API_BASE_URL = `${resolveApiRoot()}/api`;
