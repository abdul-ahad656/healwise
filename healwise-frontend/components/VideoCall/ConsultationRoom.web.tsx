import React, { useEffect, useRef, useState } from 'react';
import { useZegoConfig } from '@/hooks/useZegoConfig';
import {
  recordConsultationJoin,
  recordConsultationLeave,
} from '@/services/doctorPanelService';
import type { ConsultationLeaveResult } from '@/types/consultation';

export interface ConsultationRoomProps {
  appointmentId: string;
  userID: string;
  userName: string;
  onLeave?: (result?: ConsultationLeaveResult) => void;
}

export default function ConsultationRoom({
  appointmentId,
  userID,
  userName,
  onLeave,
}: ConsultationRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leaveRecordedRef = useRef(false);
  const [joinReady, setJoinReady] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const { appID, appSign, error } = useZegoConfig();

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
    if (typeof document === 'undefined') return;
    if (error || appID === null || !containerRef.current || !joinReady) return;

    let destroyed = false;
    let zp: { destroy: () => void; joinRoom: (options: Record<string, unknown>) => void } | null =
      null;

    (async () => {
      const mod = await import('@zegocloud/zego-uikit-prebuilt');
      const ZegoUIKitPrebuilt = mod.ZegoUIKitPrebuilt;

      if (destroyed || !containerRef.current) return;

      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        appSign,
        appointmentId,
        userID,
        userName
      );

      zp = ZegoUIKitPrebuilt.create(kitToken);

      zp.joinRoom({
        container: containerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.OneONoneCall,
        },
        onLeaveRoom: () => {
          if (leaveRecordedRef.current) return;
          leaveRecordedRef.current = true;
          void (async () => {
            let result: ConsultationLeaveResult | undefined;
            try {
              result = await recordConsultationLeave(appointmentId);
            } catch {
              /* ignore */
            }
            onLeave?.(result);
          })();
        },
      });
    })();

    return () => {
      destroyed = true;
      zp?.destroy();
    };
  }, [appID, appSign, appointmentId, userID, userName, onLeave, error, joinReady]);

  if (error || joinError) {
    return (
      <div style={errorContainerStyle}>
        <p style={errorTitleStyle}>Configuration Error</p>
        <p style={errorBodyStyle}>{error ?? joinError}</p>
      </div>
    );
  }

  if (!joinReady) {
    return (
      <div style={loadingStyle}>
        <p style={{ color: '#e2e8f0' }}>Connecting video call…</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100vh' }}
    />
  );
}

const loadingStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  backgroundColor: '#0f172a',
};

const errorContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  padding: '0 32px',
  backgroundColor: '#fef2f2',
};

const errorTitleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: '#991b1b',
  marginBottom: 8,
  textAlign: 'center',
};

const errorBodyStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#b91c1c',
  textAlign: 'center',
  lineHeight: '22px',
  maxWidth: 360,
};
