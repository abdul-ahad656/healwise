import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { sendOtp, verifyOtp, OtpPurpose } from '@/services/otpService';
import { validateEmail } from '@/utils/emailValidator';

type Props = {
  email: string;
  purpose: OtpPurpose;
  onVerified: (verificationToken: string) => void;
  onEmailChange?: (email: string) => void;
  emailEditable?: boolean;
  customSendOtp?: () => Promise<void>;
};

export function EmailOtpVerification({
  email,
  purpose,
  onVerified,
  onEmailChange,
  emailEditable = true,
  customSendOtp,
}: Props) {
  const { t } = useTranslation();
  const [otp, setOtp] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const emailValidation = validateEmail(email);
  const normalizedEmail = email.trim().toLowerCase();
  const canSendOtp = customSendOtp ? !!normalizedEmail : emailValidation.isValid;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendOtp = async () => {
    if (!canSendOtp) {
      Alert.alert(t('otp_error_title'), t(emailValidation.error || 'email_error_invalid'));
      return;
    }

    setSending(true);
    try {
      if (customSendOtp) {
        await customSendOtp();
      } else {
        await sendOtp(normalizedEmail, purpose);
      }
      setOtpSent(true);
      setCooldown(60);
      Alert.alert(t('otp_sent_title'), t('otp_sent_message'));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('otp_send_failed');
      Alert.alert(t('otp_error_title'), message);
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.trim().length < 6) {
      Alert.alert(t('otp_error_title'), t('otp_enter_code'));
      return;
    }

    setVerifying(true);
    try {
      const result = await verifyOtp(normalizedEmail, otp);
      setVerified(true);
      onVerified(result.temp_token);
      Alert.alert(t('otp_verified_title'), t('otp_verified_message'));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('otp_verify_failed');
      Alert.alert(t('otp_error_title'), message);
    } finally {
      setVerifying(false);
    }
  };

  if (verified) {
    return (
      <View style={styles.verifiedBanner}>
        <CheckCircle size={20} color="#15803d" />
        <Text style={styles.verifiedText}>{t('otp_email_verified')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {emailEditable && onEmailChange ? (
        <View style={styles.field}>
          <Text style={styles.hint}>{t('otp_email_hint')}</Text>
          <View style={styles.inputRow}>
            <TextInput
              value={email}
              onChangeText={(v) => {
                setOtpSent(false);
                setOtp('');
                onEmailChange(v);
              }}
              placeholder={t('email_register_placeholder')}
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.textInput}
            />
          </View>
        </View>
      ) : null}

      <Pressable
        onPress={handleSendOtp}
        disabled={sending || cooldown > 0 || !canSendOtp}
        style={[
          styles.secondaryBtn,
          (sending || cooldown > 0 || !canSendOtp) && styles.btnDisabled,
        ]}
      >
        {sending ? (
          <ActivityIndicator color="#2563eb" size="small" />
        ) : (
          <Text style={styles.secondaryBtnText}>
            {cooldown > 0
              ? t('otp_resend_in', { seconds: cooldown })
              : otpSent
              ? t('otp_resend')
              : t('otp_send')}
          </Text>
        )}
      </Pressable>

      {otpSent ? (
        <>
          <Text style={styles.label}>{t('otp_code_label')}</Text>
          <View style={styles.inputRow}>
            <TextInput
              value={otp}
              onChangeText={setOtp}
              placeholder={t('otp_code_placeholder')}
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={6}
              style={[styles.textInput, styles.otpInput]}
            />
          </View>
          <Pressable
            onPress={handleVerifyOtp}
            disabled={verifying || otp.length < 6}
            style={[
              styles.primaryBtn,
              (verifying || otp.length < 6) && styles.btnDisabled,
            ]}
          >
            {verifying ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.primaryBtnText}>{t('otp_verify')}</Text>
            )}
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 8 },
  field: { marginBottom: 10 },
  hint: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  textInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#111827',
    paddingHorizontal: 14,
    paddingVertical: 0,
  },
  otpInput: {
    letterSpacing: 6,
    textAlign: 'center',
    fontWeight: '700',
  },
  secondaryBtn: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  secondaryBtnText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '800',
  },
  primaryBtn: {
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  btnDisabled: { opacity: 0.5 },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  verifiedText: {
    color: '#15803d',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
});
