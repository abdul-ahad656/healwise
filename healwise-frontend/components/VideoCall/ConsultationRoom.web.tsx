import React, { useEffect, useRef } from 'react';
import { useZegoConfig } from '@/hooks/useZegoConfig';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ConsultationRoomProps {
  /** MongoDB _id of the appointment – used as the ZEGOCLOUD room ID. */
  appointmentId: string;
  /** Unique identifier for the current user (ZEGOCLOUD userID). */
  userID: string;
  /** Display name shown inside the call to the remote participant. */
  userName: string;
  /** Called when the user leaves the call — parent should clear call state. */
  onLeave?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ConsultationRoom({
  appointmentId,
  userID,
  userName,
  onLeave,
}: ConsultationRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { appID, appSign, error } = useZegoConfig();

  useEffect(() => {
    // SSR guard: expo-router web SSR runs in Node where `document` doesn't exist.
    if (typeof document === 'undefined') return;

    // Do not initialise if credentials are missing or the container is not yet
    // in the DOM.
    if (error || appID === null || !containerRef.current) return;

    let destroyed = false;
    let zp: { destroy: () => void; joinRoom: (options: any) => void } | null =
      null;

    (async () => {
      const mod = await import('@zegocloud/zego-uikit-prebuilt');
      const ZegoUIKitPrebuilt = mod.ZegoUIKitPrebuilt;

      if (destroyed || !containerRef.current) return;

      /**
       * generateKitTokenForTest uses the App Sign directly in the browser.
       * Use a server-generated token for production deployments.
       */
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        appSign, // called "serverSecret" in the JS SDK docs
        appointmentId, // roomID – participants with the same ID enter the same room
        userID,
        userName
      );

      zp = ZegoUIKitPrebuilt.create(kitToken);

      zp.joinRoom({
        container: containerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.OneONoneCall,
        },
        /**
         * Navigate back to the previous screen when the local user leaves the
         * call via the "Leave" button or the room is otherwise closed.
         */
        onLeaveRoom: () => onLeave?.(),
      });
    })();

    // Cleanup: destroy the ZEGOCLOUD instance when the component unmounts so
    // camera and microphone tracks are properly released.
    return () => {
      destroyed = true;
      zp?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appID, appSign, appointmentId, userID, userName, onLeave]);

  // ── Credential error guard ─────────────────────────────────────────────────
  if (error) {
    return (
      <div style={errorContainerStyle}>
        <p style={errorTitleStyle}>Configuration Error</p>
        <p style={errorBodyStyle}>{error}</p>
      </div>
    );
  }

  // ── Video call container ───────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100vh' }}
    />
  );
}

// ─── Inline styles (no StyleSheet on web) ────────────────────────────────────

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
