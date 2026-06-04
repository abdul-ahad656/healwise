import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { CheckCircle, Calendar, User } from 'lucide-react-native';
import { Card } from '@/components/ui/card';
import { AdminScreenHeader } from '@/components/admin/AdminScreenHeader';
import { adminScreenStyles as s } from '@/styles/adminScreen';
import {
  AdminPaymentRecord,
  formatAdminPaymentPkr,
  getAdminApprovedPayments,
} from '@/services/adminPaymentService';

function formatWhen(dateString?: string) {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export default function PaymentApprovedHistoryScreen() {
  const router = useRouter();
  const [items, setItems] = useState<AdminPaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      setError(null);
      const data = await getAdminApprovedPayments();
      setItems(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load approved payments';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadHistory();
    }, [loadHistory])
  );

  return (
    <View style={s.container}>
      <View style={[StyleSheet.absoluteFill, s.pageBg]} />

      <AdminScreenHeader
        title="Approved payments"
        subtitle="Easypaisa payments you have confirmed"
        onBack={() => router.back()}
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadHistory();
            }}
          />
        }
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#047857" />
            <Text style={s.infoText}>Loading approved payments…</Text>
          </View>
        ) : error ? (
          <Card style={styles.errorCard}>
            <Text style={s.errorText}>{error}</Text>
          </Card>
        ) : items.length === 0 ? (
          <View style={styles.emptyWrap}>
            <CheckCircle size={48} color="#86efac" />
            <Text style={styles.emptyTitle}>No approved payments yet</Text>
            <Text style={styles.emptyBody}>
              Payments you confirm from Payment approval will appear here.
            </Text>
          </View>
        ) : (
          items.map((payment) => (
            <Card key={payment._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.approvedBadge}>
                  <CheckCircle size={14} color="#15803d" />
                  <Text style={styles.approvedText}>Approved</Text>
                </View>
                <Text style={styles.amountText}>
                  {formatAdminPaymentPkr(payment)}
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Patient</Text>
                <View style={styles.detailRow}>
                  <User size={16} color="#6b7280" />
                  <Text style={styles.detailValue}>
                    {payment.patient_name || '—'}
                    {payment.patient_email ? ` · ${payment.patient_email}` : ''}
                  </Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Appointment</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Doctor</Text>
                  <Text style={styles.detailValue}>
                    {payment.doctor_name || '—'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Calendar size={16} color="#6b7280" />
                  <Text style={styles.detailValue}>
                    {payment.appointment_date || '—'}
                    {payment.appointment_time
                      ? ` · ${payment.appointment_time}`
                      : ''}
                  </Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Timeline</Text>
                <Text style={styles.timelineText}>
                  Approved: {formatWhen(payment.admin_approved_at)}
                </Text>
                {payment.proof_submitted_at ? (
                  <Text style={styles.timelineText}>
                    Proof submitted: {formatWhen(payment.proof_submitted_at)}
                  </Text>
                ) : null}
                <Text style={styles.timelineText}>
                  Created: {formatWhen(payment.createdAt)}
                </Text>
              </View>

              {payment.admin_notes ? (
                <View style={styles.notesBox}>
                  <Text style={styles.sectionLabel}>Admin notes</Text>
                  <Text style={styles.notesText}>{payment.admin_notes}</Text>
                </View>
              ) : null}

              {payment.easypaisa_transaction_id ? (
                <Text style={styles.txnId}>
                  Txn ID: {payment.easypaisa_transaction_id}
                </Text>
              ) : null}
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  errorCard: {
    padding: 16,
    borderRadius: 16,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    marginBottom: 14,
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  approvedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803d',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  section: { gap: 6 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  detailKey: {
    fontSize: 13,
    color: '#6b7280',
    width: 56,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 20,
  },
  timelineText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  notesBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  notesText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  txnId: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
});
