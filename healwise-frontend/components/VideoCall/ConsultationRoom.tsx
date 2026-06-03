import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { PhoneOff } from 'lucide-react-native';
import { useZegoConfig } from '@/hooks/useZegoConfig';

export interface ConsultationRoomProps {
  appointmentId: string;
  userID: string;
  userName: string;
  /** Called when the call ends — parent should clear call state. */
  onLeave?: () => void;
}

type ZegoCallModule = typeof import('@zegocloud/zego-uikit-prebuilt-call-rn');

export default function ConsultationRoom({
  appointmentId,
  userID,
  userName,
  onLeave,
}: ConsultationRoomProps) {
  const { appID, appSign, error } = useZegoConfig();
  const [zego, setZego] = useState<ZegoCallModule | null>(null);
  const [zegoLoadError, setZegoLoadError] = useState<string | null>(null);
  const callRef = useRef<{ hangUp?: (showConfirmation?: boolean) => void } | null>(
    null
  );
  const hasLeftRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    import('@zegocloud/zego-uikit-prebuilt-call-rn')
      .then((mod) => {
        if (!cancelled) setZego(mod);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setZegoLoadError(
            err instanceof Error ? err.message : 'Failed to load video call SDK'
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  if (error || zegoLoadError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Configuration Error</Text>
        <Text style={styles.errorBody}>{error ?? zegoLoadError}</Text>
      </View>
    );
  }

  if (appID === null || !zego) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Connecting video call…</Text>
      </View>
    );
  }

  const { ZegoUIKitPrebuiltCall, ONE_ON_ONE_VIDEO_CALL_CONFIG } = zego;

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0f172a',
  },
  loadingText: {
    color: '#e2e8f0',
    fontSize: 14,
  },
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
