/**
 * ConsultationRoom – Mobile (React Native)
 *
 * Uses @zegocloud/zego-uikit-prebuilt-call-rn to render a full-screen
 * one-on-one video call.  The appointmentId is used as the ZEGOCLOUD room
 * (callID) so both parties joining with the same appointmentId are routed to
 * the same call room.
 */

import React, { useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  ZegoUIKitPrebuiltCall,
  ONE_ON_ONE_VIDEO_CALL_CONFIG,
} from '@zegocloud/zego-uikit-prebuilt-call-rn';
import { PhoneOff } from 'lucide-react-native';
import { useZegoConfig } from '@/hooks/useZegoConfig';

export interface ConsultationRoomProps {
  appointmentId: string;
  userID: string;
  userName: string;
  /** Called when the call ends — parent should clear call state. */
  onLeave?: () => void;
}

export default function ConsultationRoom({
  appointmentId,
  userID,
  userName,
  onLeave,
}: ConsultationRoomProps) {
  const { appID, appSign, error } = useZegoConfig();
  const callRef = useRef<{ hangUp?: (showConfirmation?: boolean) => void } | null>(
    null
  );
  const hasLeftRef = useRef(false);

  const finishCall = useCallback(() => {
    if (hasLeftRef.current) return;
    hasLeftRef.current = true;
    onLeave?.();
  }, [onLeave]);

  const handleEndCallPress = useCallback(() => {
    try {
      callRef.current?.hangUp?.(false);
    } catch {
      // Room may already be disconnected — still exit the screen.
    }
    finishCall();
  }, [finishCall]);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Configuration Error</Text>
        <Text style={styles.errorBody}>{error}</Text>
      </View>
    );
  }

  if (appID === null) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ZegoUIKitPrebuiltCall
        ref={callRef}
        appID={appID}
        appSign={appSign}
        userID={userID}
        userName={userName}
        callID={appointmentId}
        config={{
          ...ONE_ON_ONE_VIDEO_CALL_CONFIG,
          /** Zego RN uses onCallEnd (not onHangUp) when the user or remote party leaves. */
          onCallEnd: () => {
            finishCall();
          },
        }}
      />

      <Pressable
        onPress={handleEndCallPress}
        style={({ pressed }) => [
          styles.endCallButton,
          { opacity: pressed ? 0.85 : 1 },
        ]}
        accessibilityLabel="End call"
        accessibilityRole="button"
      >
        <PhoneOff size={20} color="#ffffff" />
        <Text style={styles.endCallText}>End call</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  endCallButton: {
    position: 'absolute',
    top: 52,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: 'rgba(220, 38, 38, 0.95)',
    zIndex: 9999,
    elevation: 10,
  },
  endCallText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
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
