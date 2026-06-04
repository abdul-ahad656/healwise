import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, LogBox } from 'react-native';
import { useZegoConfig } from '@/hooks/useZegoConfig';
import {
  recordConsultationJoin,
  recordConsultationLeave,
} from '@/services/doctorPanelService';
import type { ConsultationLeaveResult } from '@/types/consultation';

export type { ConsultationLeaveResult };

export interface ConsultationRoomProps {
  appointmentId: string;
  userID: string;
  userName: string;
  /** Called after leave is recorded — parent should clear call state. */
  onLeave?: (result?: ConsultationLeaveResult) => void;
}

type ZegoCallModule = typeof import('@zegocloud/zego-uikit-prebuilt-call-rn');

const ZEGO_LOG_IGNORE = [
  'SafeAreaView has been deprecated',
  'componentWillReceiveProps has been renamed',
];

export default function ConsultationRoom({
  appointmentId,
  userID,
  userName,
  onLeave,
}: ConsultationRoomProps) {
  const { appID, appSign, error } = useZegoConfig();
  const [zego, setZego] = useState<ZegoCallModule | null>(null);
  const [zegoLoadError, setZegoLoadError] = useState<string | null>(null);
  const [joinReady, setJoinReady] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const hasLeftRef = useRef(false);
  const leaveRecordedRef = useRef(false);

  useEffect(() => {
    LogBox.ignoreLogs(ZEGO_LOG_IGNORE);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setJoinReady(false);
    setJoinError(null);

    (async () => {
      try {
        await recordConsultationJoin(appointmentId);
        if (!cancelled) setJoinReady(true);
      } catch (err: unknown) {
        if (!cancelled) {
          setJoinError(
            err instanceof Error ? err.message : 'Could not register for consultation'
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [appointmentId]);

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

  const finishCall = useCallback(async () => {
    if (hasLeftRef.current) return;
    hasLeftRef.current = true;

    let result: ConsultationLeaveResult | undefined;
    if (!leaveRecordedRef.current) {
      leaveRecordedRef.current = true;
      try {
        result = await recordConsultationLeave(appointmentId);
      } catch {
        // Parent may still refresh; duration can be reconciled on next load.
      }
    }
    onLeave?.(result);
  }, [appointmentId, onLeave]);

  if (error || zegoLoadError || joinError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Configuration Error</Text>
        <Text style={styles.errorBody}>{error ?? zegoLoadError ?? joinError}</Text>
      </View>
    );
  }

  if (appID === null || !zego || !joinReady) {
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
        appID={appID}
        appSign={appSign}
        userID={userID}
        userName={userName}
        callID={appointmentId}
        config={{
          ...ONE_ON_ONE_VIDEO_CALL_CONFIG,
          hangUpConfirmDialogInfo: {
            title: 'End consultation?',
            message:
              'Leave the video call? Your consultation time is saved when you end the call.',
            cancelButtonName: 'Stay',
            confirmButtonName: 'End call',
          },
          onCallEnd: () => {
            void finishCall();
          },
        }}
      />
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
