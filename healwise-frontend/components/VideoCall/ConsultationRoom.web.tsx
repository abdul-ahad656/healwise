/**
 * ConsultationRoom – Web (Browser)
 *
 * Uses @zegocloud/zego-uikit-prebuilt (standard JS SDK) to render a
 * full-page one-on-one video call inside a plain <div> container.
 *
 * The joinRoom logic runs inside a useEffect so the SDK is initialised once
 * the container div is mounted in the DOM.  The ZEGOCLOUD instance is
 * destroyed on unmount to release mic/camera resources.
 *
 * Platform resolution: Metro / Webpack prefer the .web.tsx file for all web
 * (browser) builds over the base .tsx file which targets native platforms.
 *
 * NOTE: generateKitTokenForTest embeds the App Sign client-side and is
 * intended for development / prototyping.  For production, generate the kit
 * token on your backend and pass it to ZegoUIKitPrebuilt.create().
 */

import React, { useEffect, useRef } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useRouter } from 'expo-router';
import { useZegoConfig } from '@/hooks/useZegoConfig';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ConsultationRoomProps {
  /** MongoDB _id of the appointment – used as the ZEGOCLOUD room ID. */
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
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { appID, appSign, error } = useZegoConfig();

  useEffect(() => {
    // Do not initialise if credentials are missing or the container is not yet
    // in the DOM.
    if (error || appID === null || !containerRef.current) return;

    /**
     * generateKitTokenForTest uses the App Sign directly in the browser.
     * Use a server-generated token for production deployments.
     */
    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID,
      appSign,       // called "serverSecret" in the JS SDK docs
      appointmentId, // roomID – participants with the same ID enter the same room
      userID,
      userName,
    );

    const zp = ZegoUIKitPrebuilt.create(kitToken);

    zp.joinRoom({
      container: containerRef.current,
      scenario: {
        mode: ZegoUIKitPrebuilt.OneONoneCall,
      },
      /**
       * Navigate back to the previous screen when the local user leaves the
       * call via the "Leave" button or the room is otherwise closed.
       */
      onLeaveRoom: () => router.back(),
    });

    // Cleanup: destroy the ZEGOCLOUD instance when the component unmounts so
    // camera and microphone tracks are properly released.
    return () => {
      zp.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appID, appSign, appointmentId, userID, userName]);

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
