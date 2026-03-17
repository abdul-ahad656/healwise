import { useMemo } from 'react';

export interface ZegoConfig {
  /** Parsed numeric App ID, or null if not configured / invalid. */
  appID: number | null;
  /** App Sign string read from the environment. */
  appSign: string;
  /** Non-null when credentials are missing or malformed; null otherwise. */
  error: string | null;
}

/**
 * Reads ZEGOCLOUD credentials from Expo public environment variables and
 * returns them in a typed, validated shape.
 *
 * Required .env entries:
 *   EXPO_PUBLIC_ZEGO_APP_ID    – numeric App ID from the ZEGOCLOUD console
 *   EXPO_PUBLIC_ZEGO_APP_SIGN  – App Sign string from the ZEGOCLOUD console
 */
export function useZegoConfig(): ZegoConfig {
  return useMemo<ZegoConfig>(() => {
    const rawAppID = process.env.EXPO_PUBLIC_ZEGO_APP_ID;
    const rawAppSign = process.env.EXPO_PUBLIC_ZEGO_APP_SIGN;

    if (!rawAppID || rawAppID === 'YOUR_ZEGO_APP_ID_HERE') {
      return {
        appID: null,
        appSign: '',
        error:
          'ZEGOCLOUD App ID is not configured. ' +
          'Set EXPO_PUBLIC_ZEGO_APP_ID in your .env file.',
      };
    }

    const appID = parseInt(rawAppID, 10);
    if (Number.isNaN(appID)) {
      return {
        appID: null,
        appSign: '',
        error:
          'ZEGOCLOUD App ID is invalid. ' +
          'EXPO_PUBLIC_ZEGO_APP_ID must be a numeric value.',
      };
    }

    if (!rawAppSign || rawAppSign === 'YOUR_ZEGO_APP_SIGN_HERE') {
      return {
        appID,
        appSign: '',
        error:
          'ZEGOCLOUD App Sign is not configured. ' +
          'Set EXPO_PUBLIC_ZEGO_APP_SIGN in your .env file.',
      };
    }

    return { appID, appSign: rawAppSign, error: null };
  }, []);
}
