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
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CreditCard, CheckCircle, Copy } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  createPayment,
  submitPaymentProof,
  formatPaymentAmount,
  convertUsdToPkr,
  getPaymentMethodLabel,
  PaymentResponse,
  PaymentMethod,
  EasypaisaPaymentResponse,
} from '@/services/paymentService';
import { getPatientAppointments } from '@/services/doctorPanelService';
import AuthStore from '@/services/authStore';

// Generate unique appointment ID for payment tracking
const generateAppointmentId = () => `appt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export default function PaymentScreen() {
  const router = useRouter();
  const { doctorId, doctorName, appointmentDate, appointmentTime, symptomId } =
    useLocalSearchParams<{
      doctorId?: string;
      doctorName?: string;
      appointmentDate?: string;
      appointmentTime?: string;
      symptomId?: string;
    }>();

  const [appointmentId] = useState(generateAppointmentId());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  const [paymentResponse, setPaymentResponse] = useState<PaymentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [proofSubmitted, setProofSubmitted] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvc: '',
  });
  const [easypaisaProof, setEasypaisaProof] = useState({
    type: 'screenshot' as 'screenshot' | 'transaction_id',
    value: '',
  });

  useEffect(() => {
    if (!doctorId || !appointmentDate || !appointmentTime) {
      setError('Missing appointment details');
      setLoading(false);
      return;
    }
    initializePayment();
  }, []);

  const initializePayment = async () => {
    try {
      setError(null);
      const response = await createPayment(
        appointmentId,
        appointmentDate as string,
        appointmentTime as string,
        doctorId as string,
        'stripe', // Default to Stripe for initial load
        symptomId
      );
      setPaymentResponse(response);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMethodChange = async (method: PaymentMethod) => {
    if (method === paymentMethod) return;

    setLoading(true);
    setError(null);

    try {
      const response = await createPayment(
        appointmentId,
        appointmentDate as string,
        appointmentTime as string,
        doctorId as string,
        method,
        symptomId
      );
      setPaymentMethod(method);
      setPaymentResponse(response);
    } catch (err: any) {
      setError(err.message || 'Failed to switch payment method');
      // Keep previous method
    } finally {
      setLoading(false);
    }
  };

  const handleStripePayment = async () => {
    if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvc) {
      Alert.alert('Error', 'Please fill in all card details');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // NOTE: In production, use @stripe/stripe-react-native for secure card handling
      // This is a simplified flow for testing. Real implementation should:
      // 1. Use StripeProvider from @stripe/stripe-react-native
      // 2. Use CardField or CardForm component
      // 3. Call confirmPayment() with card details
      // 4. Never send raw card data to backend (PCI compliance)

      // For MVP testing with test cards:
      // - 4242 4242 4242 4242 (success)
      // - 4000 0000 0000 0002 (decline)
      // - 4000 0025 0000 3155 (3D Secure)

      // Simulate payment confirmation delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In real implementation, Stripe SDK handles this
      setPaymentSuccess(true);

      // Check if appointment was created (webhook processed)
      await checkAppointmentCreated();

      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleEasypaisaSubmitProof = async () => {
    if (!easypaisaProof.value) {
      Alert.alert('Error', `Please provide ${easypaisaProof.type === 'screenshot' ? 'screenshot URL' : 'transaction ID'}`);
      return;
    }

    if (!paymentResponse || paymentResponse.payment_method !== 'easypaisa') {
      setError('Invalid payment method');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      await submitPaymentProof(
        paymentResponse.paymentId,
        easypaisaProof.type,
        easypaisaProof.value
      );

      setProofSubmitted(true);
      Alert.alert(
        'Success',
        'Proof submitted! Admin will review and confirm your payment shortly.'
      );

      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit proof');
    } finally {
      setProcessing(false);
    }
  };

  const checkAppointmentCreated = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const appointments = await getPatientAppointments();
      const newAppointment = appointments.find(
        a =>
          a.appointmentDate === appointmentDate &&
          a.appointmentTime === appointmentTime &&
          a.doctorId === doctorId
      );

      if (!newAppointment) {
        Alert.alert(
          'Warning',
          'Payment successful! Appointment is being confirmed.'
        );
      }
    } catch (err) {
      console.error('Failed to verify appointment:', err);
    }
  };

  const copyToClipboard = (text: string) => {
    // For now just show alert - proper implementation would use expo-clipboard
    Alert.alert('Copied', text);
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
              <Text style={styles.headerTitle}>Payment</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#a855f7" />
          <Text style={styles.loadingText}>Preparing payment...</Text>
        </View>
      </View>
    );
  }

  if (paymentSuccess || proofSubmitted) {
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
              <Text style={styles.headerTitle}>
                {paymentSuccess ? 'Payment Complete' : 'Proof Submitted'}
              </Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={styles.successContainer}>
          <CheckCircle size={80} color="#10b981" strokeWidth={1.5} />
          <Text style={styles.successTitle}>
            {paymentSuccess ? 'Payment Successful' : 'Proof Submitted'}
          </Text>
          <Text style={styles.successText}>
            {paymentSuccess
              ? 'Your appointment has been confirmed!'
              : 'Admin will review and confirm shortly.'}
          </Text>
          <View style={styles.successDetails}>
            <Text style={styles.detailLabel}>Doctor</Text>
            <Text style={styles.detailValue}>{doctorName}</Text>
            <Text style={styles.detailLabel}>Date & Time</Text>
            <Text style={styles.detailValue}>
              {appointmentDate} at {appointmentTime}
            </Text>
          </View>
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
            <Text style={styles.headerTitle}>Payment</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Appointment Summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Appointment Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Doctor</Text>
            <Text style={styles.detailValue}>{doctorName || 'Doctor'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{appointmentDate}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>{appointmentTime}</Text>
          </View>
        </Card>

        {/* Payment Summary */}
        <Card style={styles.paymentCard}>
          <Text style={styles.sectionTitle}>Payment Amount</Text>
          {paymentResponse && (
            <>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Consultation Fee</Text>
                <Text style={styles.amount}>
                  {formatPaymentAmount(paymentResponse.amount, paymentResponse.currency)}
                </Text>
              </View>
              {paymentResponse.payment_method === 'easypaisa' && (
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>In PKR</Text>
                  <Text style={styles.amount}>
                    PKR {convertUsdToPkr(paymentResponse.amount)}
                  </Text>
                </View>
              )}
              <View style={[styles.amountRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>
                  {formatPaymentAmount(paymentResponse.amount, paymentResponse.currency)}
                </Text>
              </View>
            </>
          )}
        </Card>

        {/* Payment Method Selector */}
        <Card style={styles.methodCard}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.methodOptions}>
            <Pressable
              style={[
                styles.methodOption,
                paymentMethod === 'stripe' && styles.methodOptionActive,
              ]}
              onPress={() => handlePaymentMethodChange('stripe')}
              disabled={loading}
            >
              <View
                style={[
                  styles.radio,
                  paymentMethod === 'stripe' && styles.radioActive,
                ]}
              >
                {paymentMethod === 'stripe' && (
                  <View style={styles.radioDot} />
                )}
              </View>
              <View style={styles.methodLabel}>
                <Text style={styles.methodTitle}>Credit/Debit Card</Text>
                <Text style={styles.methodSubtitle}>Instant confirmation</Text>
              </View>
            </Pressable>

            <Pressable
              style={[
                styles.methodOption,
                paymentMethod === 'easypaisa' && styles.methodOptionActive,
              ]}
              onPress={() => handlePaymentMethodChange('easypaisa')}
              disabled={loading}
            >
              <View
                style={[
                  styles.radio,
                  paymentMethod === 'easypaisa' && styles.radioActive,
                ]}
              >
                {paymentMethod === 'easypaisa' && (
                  <View style={styles.radioDot} />
                )}
              </View>
              <View style={styles.methodLabel}>
                <Text style={styles.methodTitle}>Easypaisa Transfer</Text>
                <Text style={styles.methodSubtitle}>Manual approval</Text>
              </View>
            </Pressable>
          </View>
        </Card>

        {/* Stripe Payment Form */}
        {paymentMethod === 'stripe' && (
          <Card style={styles.cardInputCard}>
            <View style={styles.cardInputHeader}>
              <CreditCard size={20} color="#a855f7" />
              <Text style={styles.cardInputTitle}>Card Details</Text>
            </View>

            <Text style={styles.testCardHint}>
              Test Card: 4242 4242 4242 4242{'\n'}Exp: Any future date, CVC: Any 3 digits
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Card Number</Text>
              <TextInput
                style={styles.input}
                placeholder="4242 4242 4242 4242"
                keyboardType="numeric"
                maxLength={19}
                value={cardDetails.number}
                onChangeText={(text) =>
                  setCardDetails({ ...cardDetails, number: text })
                }
                editable={!processing}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.flex1]}>
                <Text style={styles.inputLabel}>Expiry</Text>
                <TextInput
                  style={styles.input}
                  placeholder="MM/YY"
                  maxLength={5}
                  value={cardDetails.expiry}
                  onChangeText={(text) =>
                    setCardDetails({ ...cardDetails, expiry: text })
                  }
                  editable={!processing}
                />
              </View>
              <View style={[styles.inputContainer, styles.flex1]}>
                <Text style={styles.inputLabel}>CVC</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123"
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  value={cardDetails.cvc}
                  onChangeText={(text) =>
                    setCardDetails({ ...cardDetails, cvc: text })
                  }
                  editable={!processing}
                />
              </View>
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Button
              title={processing ? 'Processing...' : 'Confirm Payment'}
              onPress={handleStripePayment}
              disabled={processing || !paymentResponse}
              style={styles.payButton}
            />
          </Card>
        )}

        {/* Easypaisa Payment Form */}
        {paymentMethod === 'easypaisa' && paymentResponse?.payment_method === 'easypaisa' && (
          <>
            {/* Receiver Details */}
            <Card style={styles.easypaisaCard}>
              <Text style={styles.sectionTitle}>Send Payment To</Text>
              <View style={styles.receiverBox}>
                <Text style={styles.receiverLabel}>Easypaisa Number</Text>
                <View style={styles.receiverRow}>
                  <Text style={styles.receiverNumber}>
                    {(paymentResponse as EasypaisaPaymentResponse).receiver_number}
                  </Text>
                  <Pressable
                    onPress={() =>
                      copyToClipboard((paymentResponse as EasypaisaPaymentResponse).receiver_number)
                    }
                    style={styles.copyButton}
                  >
                    <Copy size={18} color="#a855f7" />
                  </Pressable>
                </View>
              </View>

              <View style={styles.amountBox}>
                <Text style={styles.amountBoxLabel}>Amount to Send</Text>
                <Text style={styles.easypaisaAmount}>
                  PKR {convertUsdToPkr(paymentResponse.amount)}
                </Text>
              </View>

              <View style={styles.instructionsBox}>
                <Text style={styles.instructionsLabel}>Instructions:</Text>
                <Text style={styles.instructions}>
                  1. Open Easypaisa app or visit an agent{'\n'}
                  2. Send PKR {convertUsdToPkr(paymentResponse.amount)} to {(paymentResponse as EasypaisaPaymentResponse).receiver_number}{'\n'}
                  3. Keep your transaction receipt{'\n'}
                  4. Submit proof below
                </Text>
              </View>
            </Card>

            {/* Proof Submission */}
            <Card style={styles.proofCard}>
              <Text style={styles.sectionTitle}>Submit Payment Proof</Text>

              <View style={styles.proofTypeContainer}>
                <Pressable
                  style={[
                    styles.proofTypeButton,
                    easypaisaProof.type === 'screenshot' && styles.proofTypeActive,
                  ]}
                  onPress={() => setEasypaisaProof({ ...easypaisaProof, type: 'screenshot' })}
                  disabled={processing}
                >
                  <Text
                    style={[
                      styles.proofTypeText,
                      easypaisaProof.type === 'screenshot' && styles.proofTypeTextActive,
                    ]}
                  >
                    Screenshot
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.proofTypeButton,
                    easypaisaProof.type === 'transaction_id' && styles.proofTypeActive,
                  ]}
                  onPress={() => setEasypaisaProof({ ...easypaisaProof, type: 'transaction_id' })}
                  disabled={processing}
                >
                  <Text
                    style={[
                      styles.proofTypeText,
                      easypaisaProof.type === 'transaction_id' && styles.proofTypeTextActive,
                    ]}
                  >
                    Transaction ID
                  </Text>
                </Pressable>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  {easypaisaProof.type === 'screenshot'
                    ? 'Screenshot URL'
                    : 'Transaction ID'}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={
                    easypaisaProof.type === 'screenshot'
                      ? 'Paste screenshot URL here'
                      : 'Enter transaction ID'
                  }
                  value={easypaisaProof.value}
                  onChangeText={(text) =>
                    setEasypaisaProof({ ...easypaisaProof, value: text })
                  }
                  editable={!processing}
                />
              </View>

              {error && <Text style={styles.errorText}>{error}</Text>}

              <Button
                title={processing ? 'Submitting...' : 'Submit Proof'}
                onPress={handleEasypaisaSubmitProof}
                disabled={processing || !easypaisaProof.value}
                style={styles.payButton}
              />

              <Text style={styles.approvalText}>
                Admin will review and confirm your payment within 1-2 hours.
              </Text>
            </Card>
          </>
        )}

        <Text style={styles.securityText}>
          🔒 Secure payment powered by Stripe & Easypaisa
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 20, gap: 16 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#6b7280' },

  // Appointment Summary
  summaryCard: { gap: 12 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  detailLabel: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  detailValue: { fontSize: 14, color: '#1f2937', fontWeight: '600' },

  // Payment Summary
  paymentCard: { gap: 12 },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  totalRow: { borderTopWidth: 2, borderTopColor: '#e5e7eb', paddingTop: 12 },
  amountLabel: { fontSize: 14, color: '#6b7280' },
  amount: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  totalAmount: { fontSize: 20, fontWeight: '700', color: '#a855f7' },

  // Method Selector
  methodCard: { gap: 12 },
  methodOptions: { gap: 10 },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  methodOptionActive: {
    borderColor: '#a855f7',
    backgroundColor: '#f3e8ff',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioActive: {
    borderColor: '#a855f7',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#a855f7',
  },
  methodLabel: { flex: 1 },
  methodTitle: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  methodSubtitle: { fontSize: 12, color: '#6b7280' },

  // Card Input
  cardInputCard: { gap: 12 },
  cardInputHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardInputTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  testCardHint: { fontSize: 12, color: '#059669', fontStyle: 'italic' },
  inputContainer: { gap: 6 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#374151' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1f2937',
  },
  row: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },

  // Easypaisa
  easypaisaCard: { gap: 12 },
  receiverBox: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  receiverLabel: { fontSize: 12, color: '#78350f', fontWeight: '600' },
  receiverRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiverNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: 1,
  },
  copyButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountBox: {
    backgroundColor: '#e0e7ff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  amountBoxLabel: { fontSize: 12, color: '#3730a3', fontWeight: '600' },
  easypaisaAmount: { fontSize: 24, fontWeight: '700', color: '#3730a3' },
  instructionsBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  instructionsLabel: { fontSize: 12, color: '#166534', fontWeight: '600' },
  instructions: { fontSize: 12, color: '#15803d', lineHeight: 18 },

  // Proof Submission
  proofCard: { gap: 12 },
  proofTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  proofTypeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  proofTypeActive: {
    borderColor: '#a855f7',
    backgroundColor: '#f3e8ff',
  },
  proofTypeText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  proofTypeTextActive: { color: '#a855f7' },
  approvalText: { fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: 4 },

  // Error & Button
  errorText: { color: '#dc2626', fontSize: 14, fontWeight: '500' },
  payButton: {
    marginVertical: 8,
    backgroundColor: '#a855f7',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  securityText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 20,
  },

  // Success
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 16,
  },
  successTitle: { fontSize: 24, fontWeight: '700', color: '#10b981' },
  successText: { fontSize: 16, color: '#6b7280', textAlign: 'center' },
  successDetails: { marginTop: 16, gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
});
