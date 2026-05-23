import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPaymentAmount } from '@/services/paymentService';

interface PendingPayment {
  _id: string;
  payment_id: string;
  userId: string;
  amount: number;
  status: string;
  easypaisa_proof_url?: string;
  proof_submitted_at: string;
  createdAt: string;
  doctor_name?: string;
  appointment_date?: string;
  appointment_time?: string;
}

export default function AdminPaymentsScreen() {
  const router = useRouter();
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      setError(null);
      // TODO: Implement this endpoint call
      // const response = await fetch(`${API_BASE_URL}/payments/admin/pending-easypaisa`, {
      //   headers: { Authorization: `Bearer ${AuthStore.getToken()}` }
      // });
      // const data = await response.json();
      // setPendingPayments(data.payments || []);

      // Mock data for development
      setPendingPayments([
        {
          _id: 'mock_1',
          payment_id: 'pay_123',
          userId: 'user_456',
          amount: 5000,
          status: 'pending_review',
          easypaisa_proof_url: 'https://example.com/screenshot.jpg',
          proof_submitted_at: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          doctor_name: 'Dr. Ali Khan',
          appointment_date: '2026-05-25',
          appointment_time: '14:30',
        },
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pending payments');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async (paymentId: string) => {
    setConfirming(paymentId);
    setError(null);

    try {
      // TODO: Implement this endpoint call
      // const response = await fetch(`${API_BASE_URL}/payments/admin/confirm-payment`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${AuthStore.getToken()}`,
      //   },
      //   body: JSON.stringify({
      //     payment_id: paymentId,
      //     admin_notes: notes[paymentId] || '',
      //   }),
      // });

      // Mock success
      Alert.alert('Success', 'Payment confirmed! Appointment created.');
      setPendingPayments(pendingPayments.filter(p => p.payment_id !== paymentId));
      setNotes({ ...notes, [paymentId]: '' });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to confirm payment');
    } finally {
      setConfirming(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#a855f7', '#ec4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <SafeAreaView>
            <View style={styles.headerContent}>
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              >
                <ArrowLeft size={24} color="white" />
              </Pressable>
              <Text style={styles.headerTitle}>Pending Payments</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#a855f7" />
          <Text style={styles.loadingText}>Loading payments...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#a855f7', '#ec4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            >
              <ArrowLeft size={24} color="white" />
            </Pressable>
            <View style={styles.headerTitle}>
              <Text style={styles.titleText}>Pending Payments</Text>
              <Text style={styles.subtitleText}>
                {pendingPayments.length} payment(s) awaiting confirmation
              </Text>
            </View>
            <Pressable
              onPress={fetchPendingPayments}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            >
              <RefreshCw size={24} color="white" />
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {error && (
        <Card style={styles.errorCard}>
          <View style={styles.errorContent}>
            <AlertCircle size={20} color="#dc2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </Card>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {pendingPayments.length === 0 ? (
          <View style={styles.emptyState}>
            <CheckCircle size={48} color="#10b981" />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptyText}>No pending payments to review</Text>
          </View>
        ) : (
          pendingPayments.map((payment) => (
            <Card key={payment.payment_id} style={styles.paymentCard}>
              {/* Payment Status Header */}
              <View style={styles.cardHeader}>
                <View style={styles.statusBadge}>
                  <AlertCircle size={16} color="#dc2626" />
                  <Text style={styles.statusText}>Pending Review</Text>
                </View>
                <Text style={styles.amountBadge}>
                  {formatPaymentAmount(payment.amount, 'usd')}
                </Text>
              </View>

              {/* Appointment Details */}
              <View style={styles.detailsSection}>
                <Text style={styles.sectionLabel}>Appointment Details</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Doctor</Text>
                  <Text style={styles.detailValue}>{payment.doctor_name || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Date & Time</Text>
                  <Text style={styles.detailValue}>
                    {payment.appointment_date || 'N/A'} {payment.appointment_time || ''}
                  </Text>
                </View>
              </View>

              {/* Proof of Payment */}
              {payment.easypaisa_proof_url && (
                <View style={styles.proofSection}>
                  <Text style={styles.sectionLabel}>Proof of Payment</Text>
                  <Image
                    source={{ uri: payment.easypaisa_proof_url }}
                    style={styles.proofImage}
                  />
                  <Pressable
                    onPress={() => {
                      Alert.alert('Proof URL', payment.easypaisa_proof_url || 'No URL available');
                    }}
                    style={styles.viewProofButton}
                  >
                    <Text style={styles.viewProofText}>View Full Size</Text>
                  </Pressable>
                </View>
              )}

              {/* Submission Timeline */}
              <View style={styles.timelineSection}>
                <Text style={styles.sectionLabel}>Timeline</Text>
                <View style={styles.timelineItem}>
                  <Text style={styles.timelineLabel}>Created</Text>
                  <Text style={styles.timelineTime}>
                    {new Date(payment.createdAt).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.timelineItem}>
                  <Text style={styles.timelineLabel}>Proof Submitted</Text>
                  <Text style={styles.timelineTime}>
                    {new Date(payment.proof_submitted_at).toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Admin Notes */}
              <View style={styles.notesSection}>
                <Text style={styles.sectionLabel}>Admin Notes (Optional)</Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Add verification notes..."
                  multiline
                  numberOfLines={3}
                  value={notes[payment.payment_id] || ''}
                  onChangeText={(text) =>
                    setNotes({ ...notes, [payment.payment_id]: text })
                  }
                  editable={confirming !== payment.payment_id}
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <Pressable
                  onPress={() =>
                    Alert.alert('Reject', 'Reject this payment?', [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Reject',
                        onPress: () => {
                          Alert.alert('Info', 'Reject functionality coming soon');
                        },
                        style: 'destructive',
                      },
                    ])
                  }
                  style={styles.rejectButton}
                  disabled={confirming !== null}
                >
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </Pressable>

                <Button
                  title={
                    confirming === payment.payment_id ? 'Confirming...' : 'Confirm Payment'
                  }
                  onPress={() => handleConfirmPayment(payment.payment_id)}
                  disabled={confirming !== null}
                  style={styles.confirmButton}
                />
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    gap: 2,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  subtitleText: {
    fontSize: 12,
    color: '#f3e8ff',
  },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 14, color: '#6b7280' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 16, gap: 12 },

  // Error Card
  errorCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#fee2e2',
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#b91c1c',
    fontWeight: '500',
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
  },

  // Payment Card
  paymentCard: {
    gap: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b91c1c',
  },
  amountBadge: {
    fontSize: 16,
    fontWeight: '700',
    color: '#a855f7',
  },

  // Details Section
  detailsSection: {
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailKey: {
    fontSize: 13,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },

  // Proof Section
  proofSection: {
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  proofImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  viewProofButton: {
    backgroundColor: '#f3e8ff',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewProofText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a855f7',
  },

  // Timeline
  timelineSection: {
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  timelineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  timelineTime: {
    fontSize: 12,
    color: '#1f2937',
    fontWeight: '500',
  },

  // Notes Section
  notesSection: {
    gap: 6,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#1f2937',
    textAlignVertical: 'top',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#f87171',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  rejectButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#dc2626',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
});
