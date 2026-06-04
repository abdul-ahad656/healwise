import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react-native';
import { Card } from '@/components/ui/card';
import { AdminScreenHeader } from '@/components/admin/AdminScreenHeader';
import { adminScreenStyles as s } from '@/styles/adminScreen';
import { getPaymentAmountPkr } from '@/services/paymentService';
import { API_BASE_URL } from '@/services/config';
import AuthStore from '@/services/authStore';

interface PendingPayment {
  _id: string;
  amount: number;
  currency?: string;
  status: string;
  easypaisa_proof_url?: string;
  easypaisa_transaction_id?: string;
  proof_submitted_at?: string;
  createdAt: string;
  doctor_name?: string;
  appointment_date?: string;
  appointment_time?: string;
  fee_pkr?: number;
  metadata?: {
    doctorName?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    feePkr?: number;
  };
}

type BusyAction = 'confirm' | 'reject';

function normalizePayment(raw: Record<string, unknown>): PendingPayment {
  const meta = (raw.metadata as PendingPayment['metadata']) || {};
  return {
    _id: String(raw._id),
    amount: Number(raw.amount) || 0,
    currency: raw.currency as string | undefined,
    status: String(raw.status || 'pending_review'),
    easypaisa_proof_url: raw.easypaisa_proof_url as string | undefined,
    easypaisa_transaction_id: raw.easypaisa_transaction_id as string | undefined,
    proof_submitted_at: raw.proof_submitted_at as string | undefined,
    createdAt: String(raw.createdAt || ''),
    doctor_name: (raw.doctor_name as string) || meta.doctorName,
    appointment_date: (raw.appointment_date as string) || meta.appointmentDate,
    appointment_time: (raw.appointment_time as string) || meta.appointmentTime,
    fee_pkr:
      (raw.fee_pkr as number) ||
      meta.feePkr ||
      (raw.doctor_consultation_price as number),
    metadata: meta,
  };
}

function formatPkr(payment: PendingPayment): string {
  const pkr = getPaymentAmountPkr(
    payment.amount,
    payment.currency,
    payment.fee_pkr
  );
  return `PKR ${pkr}`;
}

export default function AdminPaymentsScreen() {
  const router = useRouter();
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<BusyAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const fetchPendingPayments = useCallback(async (isRefresh = false) => {
    try {
      setError(null);
      const token = AuthStore.getToken();

      if (!token) {
        setError('Not authenticated');
        setPendingPayments([]);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/payments/admin/pending-easypaisa`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch pending payments');
        setPendingPayments([]);
        return;
      }

      const payments = (data.payments || []).map((p: Record<string, unknown>) =>
        normalizePayment(p)
      );
      setPendingPayments(payments);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch pending payments';
      setError(message);
      setPendingPayments([]);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingPayments();
  }, [fetchPendingPayments]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPendingPayments(true);
  };

  const removePaymentFromList = (paymentId: string) => {
    setPendingPayments((prev) => prev.filter((p) => p._id !== paymentId));
    setNotes((prev) => {
      const next = { ...prev };
      delete next[paymentId];
      return next;
    });
  };

  const handleConfirmPayment = async (paymentId: string) => {
    setBusyId(paymentId);
    setBusyAction('confirm');
    setError(null);

    try {
      const token = AuthStore.getToken();
      if (!token) {
        Alert.alert('Error', 'Not authenticated');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/payments/admin/confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          payment_id: paymentId,
          admin_notes: notes[paymentId] || '',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Error', data.error || 'Failed to confirm payment');
        return;
      }

      Alert.alert('Success', 'Payment confirmed. Appointment is now active.');
      removePaymentFromList(paymentId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to confirm payment';
      Alert.alert('Error', message);
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    setBusyId(paymentId);
    setBusyAction('reject');
    setError(null);

    try {
      const token = AuthStore.getToken();
      if (!token) {
        Alert.alert('Error', 'Not authenticated');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/payments/admin/reject-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          payment_id: paymentId,
          admin_notes: notes[paymentId] || '',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Error', data.error || 'Failed to reject payment');
        return;
      }

      Alert.alert('Rejected', 'Payment rejected. No appointment was created.');
      removePaymentFromList(paymentId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reject payment';
      Alert.alert('Error', message);
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  };

  const promptReject = (paymentId: string) => {
    Alert.alert(
      'Reject payment',
      'Reject this Easypaisa payment? The patient will need to pay again to book.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => handleRejectPayment(paymentId),
        },
      ]
    );
  };

  const refreshButton = (
    <Pressable
      onPress={onRefresh}
      disabled={loading || refreshing}
      style={({ pressed }) => [local.iconButton, { opacity: pressed ? 0.7 : 1 }]}
      accessibilityLabel="Refresh payments"
    >
      <RefreshCw size={20} color="#ffffff" />
    </Pressable>
  );

  return (
    <View style={s.container}>
      <View style={[StyleSheet.absoluteFill, s.pageBg]} />

      <AdminScreenHeader
        title="Payment approval"
        subtitle={
          loading
            ? 'Loading…'
            : `${pendingPayments.length} Easypaisa payment(s) awaiting review`
        }
        onBack={() => router.back()}
        rightElement={refreshButton}
      />

      {error ? (
        <Card style={local.errorCard}>
          <View style={local.errorRow}>
            <AlertCircle size={20} color="#b91c1c" />
            <Text style={s.errorText}>{error}</Text>
          </View>
        </Card>
      ) : null}

      {loading ? (
        <View style={local.center}>
          <ActivityIndicator size="large" color="#047857" />
          <Text style={s.infoText}>Loading payments…</Text>
        </View>
      ) : (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={[s.scrollContent, local.scrollContent]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {pendingPayments.length === 0 ? (
            <Card style={local.emptyCard}>
              <CheckCircle size={48} color="#16a34a" />
              <Text style={local.emptyTitle}>All caught up</Text>
              <Text style={local.emptyText}>No pending Easypaisa payments to review.</Text>
            </Card>
          ) : (
            pendingPayments.map((payment) => {
              const isBusy = busyId === payment._id;
              const isCardLocked = busyId !== null;

              return (
                <View key={payment._id} style={local.paymentCard}>
                  <View style={local.cardHeader}>
                    <View style={local.statusBadge}>
                      <AlertCircle size={16} color="#b45309" />
                      <Text style={local.statusText}>Pending review</Text>
                    </View>
                    <Text style={local.amountText}>{formatPkr(payment)}</Text>
                  </View>

                  <View style={local.section}>
                    <Text style={local.sectionLabel}>Appointment</Text>
                    <View style={local.detailRow}>
                      <Text style={local.detailKey}>Doctor</Text>
                      <Text style={local.detailValue}>
                        {payment.doctor_name || '—'}
                      </Text>
                    </View>
                    <View style={local.detailRow}>
                      <Text style={local.detailKey}>Date & time</Text>
                      <Text style={local.detailValue}>
                        {payment.appointment_date || '—'}
                        {payment.appointment_time
                          ? ` · ${payment.appointment_time}`
                          : ''}
                      </Text>
                    </View>
                  </View>

                  {payment.easypaisa_proof_url ? (
                    <View style={local.section}>
                      <Text style={local.sectionLabel}>Payment proof</Text>
                      <Image
                        source={{ uri: payment.easypaisa_proof_url }}
                        style={local.proofImage}
                        resizeMode="cover"
                      />
                    </View>
                  ) : payment.easypaisa_transaction_id ? (
                    <View style={local.section}>
                      <Text style={local.sectionLabel}>Transaction ID</Text>
                      <Text style={local.detailValue}>
                        {payment.easypaisa_transaction_id}
                      </Text>
                    </View>
                  ) : null}

                  <View style={local.section}>
                    <Text style={local.sectionLabel}>Timeline</Text>
                    <Text style={local.timelineText}>
                      Created:{' '}
                      {payment.createdAt
                        ? new Date(payment.createdAt).toLocaleString()
                        : '—'}
                    </Text>
                    {payment.proof_submitted_at ? (
                      <Text style={local.timelineText}>
                        Proof submitted:{' '}
                        {new Date(payment.proof_submitted_at).toLocaleString()}
                      </Text>
                    ) : null}
                  </View>

                  <View style={local.section}>
                    <Text style={local.sectionLabel}>Admin notes (optional)</Text>
                    <TextInput
                      style={[s.input, local.notesInput]}
                      placeholder="Verification notes…"
                      placeholderTextColor="#9ca3af"
                      multiline
                      numberOfLines={3}
                      value={notes[payment._id] || ''}
                      onChangeText={(text) =>
                        setNotes((prev) => ({ ...prev, [payment._id]: text }))
                      }
                      editable={!isCardLocked}
                    />
                  </View>

                  <View style={local.actionsBar}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => handleConfirmPayment(payment._id)}
                      disabled={isCardLocked}
                      style={[
                        local.confirmBtn,
                        isCardLocked && local.btnDisabled,
                      ]}
                    >
                      {isBusy && busyAction === 'confirm' ? (
                        <ActivityIndicator color="#047857" size="small" />
                      ) : (
                        <View style={local.btnInner}>
                          <CheckCircle size={20} color="#047857" strokeWidth={2.5} />
                          <Text style={local.confirmBtnText}>Confirm payment</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => promptReject(payment._id)}
                      disabled={isCardLocked}
                      style={[
                        local.rejectBtn,
                        isCardLocked && local.btnDisabled,
                      ]}
                    >
                      {isBusy && busyAction === 'reject' ? (
                        <ActivityIndicator color="#dc2626" size="small" />
                      ) : (
                        <View style={local.btnInner}>
                          <AlertCircle size={20} color="#dc2626" strokeWidth={2.5} />
                          <Text style={local.rejectBtnText}>Reject</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const local = StyleSheet.create({
  scrollContent: {
    paddingBottom: 120,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorCard: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  emptyCard: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  paymentCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  actionsBar: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#9ca3af',
    width: '100%',
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#047857',
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#047857',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fffbeb',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexShrink: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b45309',
  },
  amountText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#047857',
  },
  section: {
    gap: 8,
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailKey: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    flex: 1.2,
    textAlign: 'right',
  },
  proofImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  timelineText: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 18,
  },
  notesInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  rejectBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f87171',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    elevation: 2,
  },
  rejectBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#dc2626',
  },
  btnDisabled: {
    opacity: 0.55,
  },
});
