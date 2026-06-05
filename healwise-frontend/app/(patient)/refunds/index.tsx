import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
  Linking,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { PatientScreenHeader } from '@/components/patient/PatientScreenHeader';
import { patientScreenStyles as s } from '@/styles/patientScreen';
import { getMyRefundRequests, RefundRequest } from '@/services/paymentService';

function statusColor(status: string) {
  switch (status) {
    case 'approved':
      return { bg: '#dcfce7', text: '#166534', border: '#86efac' };
    case 'rejected':
      return { bg: '#fee2e2', text: '#b91c1c', border: '#fecaca' };
    default:
      return { bg: '#fef9c3', text: '#a16207', border: '#fde047' };
  }
}

export default function PatientRefundsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await getMyRefundRequests();
      setRefunds(data);
    } catch {
      setRefunds([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={s.container}>
      <View style={[StyleSheet.absoluteFill, s.pageBg]} />
      <PatientScreenHeader
        title={t('refunds_title')}
        subtitle={t('refunds_subtitle')}
        onBack={() => router.back()}
      />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#06b6d4" style={{ marginTop: 24 }} />
        ) : refunds.length === 0 ? (
          <Text style={s.infoText}>{t('refunds_empty')}</Text>
        ) : (
          refunds.map((item) => {
            const colors = statusColor(item.status);
            return (
              <View key={item._id} style={styles.card}>
                <View style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                  <Text style={[styles.badgeText, { color: colors.text }]}>
                    {t(`refunds_status_${item.status}`)}
                  </Text>
                </View>
                <Text style={styles.meta}>
                  {item.appointmentDate} · {item.appointmentTime}
                </Text>
                <Text style={styles.label}>{t('refunds_reason')}</Text>
                <Text style={styles.value}>{item.reason}</Text>
                <Text style={styles.label}>{t('refunds_easypaisa_number')}</Text>
                <Text style={styles.value}>{item.easypaisa_number}</Text>
                {item.refundProofUrl ? (
                  <>
                    <Text style={styles.label}>{t('refunds_proof')}</Text>
                    <Pressable onPress={() => Linking.openURL(item.refundProofUrl!)}>
                      <Image
                        source={{ uri: item.refundProofUrl }}
                        style={styles.proofImage}
                        resizeMode="cover"
                      />
                    </Pressable>
                    <Text style={styles.proofHint}>{t('refunds_proof_tap')}</Text>
                  </>
                ) : null}
                {item.adminNotes ? (
                  <>
                    <Text style={styles.label}>{t('refunds_admin_notes')}</Text>
                    <Text style={styles.value}>{item.adminNotes}</Text>
                  </>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 14,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 10,
  },
  badgeText: { fontSize: 12, fontWeight: '800' },
  meta: { fontSize: 13, color: '#6b7280', marginBottom: 10 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    marginTop: 8,
    textTransform: 'uppercase',
  },
  value: { fontSize: 14, color: '#111827', marginTop: 4, lineHeight: 20 },
  proofImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginTop: 8,
    backgroundColor: '#f3f4f6',
  },
  proofHint: { fontSize: 12, color: '#2563eb', marginTop: 6 },
});
