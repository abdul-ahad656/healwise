import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { AdminScreenHeader } from '@/components/admin/AdminScreenHeader';
import { adminScreenStyles as s } from '@/styles/adminScreen';
import {
  approveRefundAdmin,
  getPendingRefundsAdmin,
  rejectRefundAdmin,
  RefundRequest,
} from '@/services/paymentService';

export default function AdminRefundsScreen() {
  const router = useRouter();
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [proofs, setProofs] = useState<
    Record<string, { uri: string; name: string } | undefined>
  >({});

  const load = async () => {
    try {
      const data = await getPendingRefundsAdmin();
      setRefunds(data);
    } catch (err: unknown) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to load refund requests'
      );
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    void load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const pickProof = async (refundId: string) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setProofs((prev) => ({
      ...prev,
      [refundId]: { uri: asset.uri, name: asset.name || 'refund_proof.jpg' },
    }));
  };

  const handleApprove = async (refund: RefundRequest) => {
    const proof = proofs[refund._id];
    if (!proof) {
      Alert.alert('Proof required', 'Upload a refund transfer screenshot first.');
      return;
    }
    setBusyId(refund._id);
    try {
      await approveRefundAdmin(
        refund._id,
        proof.uri,
        proof.name,
        notes[refund._id]?.trim() || undefined
      );
      Alert.alert('Approved', 'Refund marked as sent.');
      await load();
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = (refund: RefundRequest) => {
    Alert.alert('Reject refund', 'Reject this refund request?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          setBusyId(refund._id);
          try {
            await rejectRefundAdmin(
              refund._id,
              notes[refund._id]?.trim() || undefined
            );
            await load();
          } catch (err: unknown) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed');
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  };

  return (
    <View style={s.container}>
      <View style={[StyleSheet.absoluteFill, s.pageBg]} />
      <AdminScreenHeader
        title="Refund requests"
        subtitle="Approve Easypaisa refunds after transfer"
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
          <ActivityIndicator size="large" color="#0f172a" style={{ marginTop: 24 }} />
        ) : refunds.length === 0 ? (
          <Text style={s.infoText}>No pending refund requests.</Text>
        ) : (
          refunds.map((refund) => (
            <View key={refund._id} style={styles.card}>
              <Text style={styles.title}>
                {refund.patientName || 'Patient'} · PKR {refund.amount}
              </Text>
              <Text style={styles.meta}>
                {refund.appointmentDate} · {refund.appointmentTime}
              </Text>
              <Text style={styles.label}>Reason</Text>
              <Text style={styles.value}>{refund.reason}</Text>
              <Text style={styles.label}>Easypaisa number</Text>
              <Text style={styles.value}>{refund.easypaisa_number}</Text>
              <TextInput
                value={notes[refund._id] || ''}
                onChangeText={(text) =>
                  setNotes((prev) => ({ ...prev, [refund._id]: text }))
                }
                placeholder="Admin notes (optional)"
                placeholderTextColor="#9ca3af"
                style={styles.input}
              />
              <TouchableOpacity
                style={local.pickBtn}
                onPress={() => pickProof(refund._id)}
              >
                <Text style={local.pickBtnText}>
                  {proofs[refund._id]
                    ? 'Change refund proof'
                    : 'Upload refund proof'}
                </Text>
              </TouchableOpacity>
              {proofs[refund._id] ? (
                <Image
                  source={{ uri: proofs[refund._id]!.uri }}
                  style={styles.preview}
                />
              ) : null}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={local.approveBtn}
                  disabled={busyId === refund._id}
                  onPress={() => handleApprove(refund)}
                >
                  <Text style={local.approveBtnText}>
                    {busyId === refund._id ? 'Working…' : 'Approve refund'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={local.rejectBtn}
                  disabled={busyId === refund._id}
                  onPress={() => handleReject(refund)}
                >
                  <Text style={local.rejectBtnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
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
  title: { fontSize: 16, fontWeight: '800', color: '#111827' },
  meta: { fontSize: 13, color: '#6b7280', marginTop: 4, marginBottom: 8 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    marginTop: 8,
    textTransform: 'uppercase',
  },
  value: { fontSize: 14, color: '#111827', marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
  },
  preview: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginTop: 10,
    backgroundColor: '#f3f4f6',
  },
  actions: { marginTop: 12, gap: 8 },
});

const local = StyleSheet.create({
  pickBtn: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  pickBtnText: { fontSize: 14, fontWeight: '700', color: '#374151' },
  approveBtn: {
    backgroundColor: '#047857',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  approveBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 15 },
  rejectBtn: {
    backgroundColor: '#fee2e2',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  rejectBtnText: { color: '#b91c1c', fontWeight: '800', fontSize: 15 },
});
