/**
 * ConsultationRoom – Mobile (React Native)
 *
 * Uses @zegocloud/zego-uikit-prebuilt-call-rn to render a full-screen
 * one-on-one video call.  The appointmentId is used as the ZEGOCLOUD room
 * (callID) so both parties joining with the same appointmentId are routed to
 * the same call room.
 *
 * Platform resolution: Metro picks this file for iOS / Android builds.
 * The .web.tsx variant is used when running in a browser (expo web).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ZegoUIKitPrebuiltCall, ONE_ON_ONE_VIDEO_CALL_CONFIG } from '@zegocloud/zego-uikit-prebuilt-call-rn';
import { useRouter } from 'expo-router';
import { useZegoConfig } from '@/hooks/useZegoConfig';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ConsultationRoomProps {
  /** MongoDB _id of the appointment – used as the ZEGOCLOUD call/room ID. */
  appointmentId: string;
  /** Unique identifier for the current user (ZEGOCLOUD userID). */
  userID: string;
  /** Display name shown inside the call to the remote participant. */
  userName: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ConsultationRoom({
  appointmentId,
  userID,
  userName,
}: ConsultationRoomProps) {
  const router = useRouter();
  const { appID, appSign, error } = useZegoConfig();

  // ── Credential error guard ─────────────────────────────────────────────────
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Configuration Error</Text>
        <Text style={styles.errorBody}>{error}</Text>
      </View>
    );
  }

  // ── Sanity check (TypeScript narrowing) ───────────────────────────────────
  if (appID === null) {
    return null;
  }

  // ── Video call UI ─────────────────────────────────────────────────────────
  return (
    <ZegoUIKitPrebuiltCall
      appID={appID}
      appSign={appSign}
      userID={userID}
      userName={userName}
      callID={appointmentId}
      config={{
        ...ONE_ON_ONE_VIDEO_CALL_CONFIG,
        /**
         * Navigate back to the previous screen when the local user ends or
         * leaves the call.  Both the "hang up" button and a remote-initiated
         * end-call event fire this callback.
         */
        onHangUp: () => router.back(),
      }}
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#fef2f2',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#991b1b',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorBody: {
    fontSize: 14,
    color: '#b91c1c',
    textAlign: 'center',
    lineHeight: 22,
  },
});
