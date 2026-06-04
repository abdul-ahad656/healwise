import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CreditCard, CheckCircle, Copy, Upload, X } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Card } from '@/components/ui/card';
import { PatientPrimaryButton } from '@/components/patient/PatientPrimaryButton';
import { PatientScreenHeader } from '@/components/patient/PatientScreenHeader';
import {
  createPayment,
  submitPaymentProof,
  submitPaymentProofWithImage,
  getPaymentAmountPkr,
  PaymentResponse,
  PaymentMethod,
  EasypaisaPaymentResponse,
} from '@/services/paymentService';
import { getPatientAppointments } from '@/services/doctorPanelService';

function generateAppointmentId() {
  return `appt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

const PAYMENT_METHOD_OPTIONS: {
  value: PaymentMethod | null;
  label: string;
}[] = [
  { value: null, label: 'None' },
  { value: 'stripe', label: 'Credit/Debit Card (Instant)' },
  { value: 'easypaisa', label: 'Easypaisa Transfer (Manual)' },
];

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

  const [appointmentId] = useState(() => {
    const id = generateAppointmentId();
    console.log('Generated appointmentId:', id);
    return id;
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentResponse, setPaymentResponse] = useState<PaymentResponse | null>(null);
  const [methodLoading, setMethodLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [proofSubmitted, setProofSubmitted] = useState(false);
  const [showPaymentMethodDropdown, setShowPaymentMethodDropdown] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvc: '',
  });
  const [easypaisaProof, setEasypaisaProof] = useState({
    type: 'screenshot' as 'screenshot' | 'transaction_id',
    value: '',
    imageUri: '', // Add image URI for uploaded file
    imageName: '', // Add image name
  });

  useEffect(() => {
    if (!doctorId || !appointmentDate || !appointmentTime) {
      setError('Missing appointment details');
    }
  }, [doctorId, appointmentDate, appointmentTime]);

  const getPaymentMethodLabel = (method: PaymentMethod | null) => {
    if (method === null) return 'None';
    const option = PAYMENT_METHOD_OPTIONS.find((item) => item.value === method);
    return option?.label ?? 'None';
  };

  const handlePaymentMethodChange = async (method: PaymentMethod | null) => {
    setShowPaymentMethodDropdown(false);

    if (method === paymentMethod) return;

    if (method === null) {
      setPaymentMethod(null);
      setPaymentResponse(null);
      setError(null);
      setCardDetails({ number: '', expiry: '', cvc: '' });
      setEasypaisaProof({ type: 'screenshot', value: '', imageUri: '', imageName: '' });
      return;
    }

    setMethodLoading(true);
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
      setError(err.message || 'Failed to load payment method');
    } finally {
      setMethodLoading(false);
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
    // Validate based on proof type
    if (easypaisaProof.type === 'transaction_id') {
      // Validate transaction ID: must be numeric and exactly 11 digits
      const txId = easypaisaProof.value.trim();
      
      if (!txId) {
        Alert.alert('Error', 'Please enter your transaction ID');
        return;
      }
      
      if (!/^\d+$/.test(txId)) {
        Alert.alert('Error', 'Transaction ID must contain only numbers');
        return;
      }
      
      if (txId.length !== 11) {
        Alert.alert('Error', 'Transaction ID must be exactly 11 digits long');
        return;
      }
    } else if (easypaisaProof.type === 'screenshot') {
      // Validate screenshot image is selected
      if (!easypaisaProof.imageUri) {
        Alert.alert('Error', 'Please upload a screenshot');
        return;
      }
    }

    if (!paymentResponse || paymentResponse.payment_method !== 'easypaisa') {
      setError('Invalid payment method');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      await submitPaymentProofWithImage(
        paymentResponse.paymentId,
        easypaisaProof.type,
        easypaisaProof.value,
        easypaisaProof.imageUri,
        easypaisaProof.imageName
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

  const pickImage = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
      });

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setEasypaisaProof({
          ...easypaisaProof,
          imageUri: asset.uri,
          imageName: asset.name || 'payment_proof.jpg',
          value: asset.uri, // Store URI as value
        });
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeImage = () => {
    setEasypaisaProof({
      ...easypaisaProof,
      imageUri: '',
      imageName: '',
      value: '',
    });
  };

  if (!doctorId || !appointmentDate || !appointmentTime) {
    return (
      <View style={styles.container}>
        <PatientScreenHeader
          title="Payment"
          colors={['#a855f7', '#ec4899']}
          onBack={() => router.back()}
        />
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error || 'Missing appointment details'}</Text>
        </View>
      </View>
    );
  }

  if (paymentSuccess || proofSubmitted) {
    return (
      <View style={styles.container}>
        <PatientScreenHeader
          title={paymentSuccess ? 'Payment Complete' : 'Proof Submitted'}
          colors={['#a855f7', '#ec4899']}
        />
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
      <PatientScreenHeader
        title="Payment"
        colors={['#a855f7', '#ec4899']}
        onBack={() => router.back()}
      />

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

        {/* Payment Method Selector */}
        <Card style={styles.methodCard}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>

          <Pressable
            style={[
              styles.dropdownButton,
              paymentMethod === null && styles.dropdownButtonPlaceholder,
            ]}
            onPress={() => setShowPaymentMethodDropdown(!showPaymentMethodDropdown)}
            disabled={methodLoading}
          >
            <Text
              style={[
                styles.dropdownButtonText,
                paymentMethod === null && styles.dropdownButtonTextPlaceholder,
              ]}
            >
              {getPaymentMethodLabel(paymentMethod)}
            </Text>
            {methodLoading ? (
              <ActivityIndicator size="small" color="#a855f7" />
            ) : (
              <Text style={styles.dropdownArrow}>
                {showPaymentMethodDropdown ? '▲' : '▼'}
              </Text>
            )}
          </Pressable>

          {showPaymentMethodDropdown && (
            <View style={styles.dropdownMenu}>
              {PAYMENT_METHOD_OPTIONS.map((option) => {
                const isActive =
                  option.value === paymentMethod ||
                  (option.value === null && paymentMethod === null);

                return (
                  <Pressable
                    key={option.value ?? 'none'}
                    style={[
                      styles.dropdownOption,
                      isActive && styles.dropdownOptionActive,
                    ]}
                    onPress={() => handlePaymentMethodChange(option.value)}
                    disabled={methodLoading}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        isActive && styles.dropdownOptionTextActive,
                        option.value === null && styles.dropdownOptionNone,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {paymentMethod === null && !methodLoading && (
            <Text style={styles.methodHint}>
              Choose a payment method to continue with your booking.
            </Text>
          )}

          {error && paymentMethod === null && (
            <Text style={styles.errorText}>{error}</Text>
          )}
        </Card>

        {/* Payment Summary */}
        {paymentMethod && (
        <Card style={styles.paymentCard}>
          <Text style={styles.sectionTitle}>Payment Amount</Text>
          {paymentResponse && (
            <>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Consultation Fee</Text>
                <Text style={styles.amount}>
                  PKR {getPaymentAmountPkr(
                    paymentResponse.amount,
                    paymentResponse.currency,
                    paymentResponse.fee_pkr
                  )}
                </Text>
              </View>
              <View style={[styles.amountRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>
                  PKR {getPaymentAmountPkr(
                    paymentResponse.amount,
                    paymentResponse.currency,
                    paymentResponse.fee_pkr
                  )}
                </Text>
              </View>
            </>
          )}
        </Card>
        )}

        {/* Stripe / Easypaisa forms follow below */}

        {/* Stripe Payment Form */}
        {paymentMethod === 'stripe' && paymentResponse?.payment_method === 'stripe' && (
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

            <PatientPrimaryButton
              label={processing ? 'Processing...' : 'Confirm Payment'}
              onPress={handleStripePayment}
              disabled={processing || !paymentResponse}
              variant="accent"
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
                  PKR {getPaymentAmountPkr(
                    paymentResponse.amount,
                    paymentResponse.currency,
                    paymentResponse.fee_pkr
                  )}
                </Text>
              </View>

              <View style={styles.instructionsBox}>
                <Text style={styles.instructionsLabel}>Instructions:</Text>
                <Text style={styles.instructions}>
                  1. Open Easypaisa app or visit an agent{'\n'}
                  2. Send PKR {getPaymentAmountPkr(
                    paymentResponse.amount,
                    paymentResponse.currency,
                    paymentResponse.fee_pkr
                  )} to {(paymentResponse as EasypaisaPaymentResponse).receiver_number}{'\n'}
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
                  onPress={() => {
                    setEasypaisaProof({ type: 'screenshot', value: '', imageUri: '', imageName: '' });
                  }}
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
                  onPress={() => {
                    setEasypaisaProof({ type: 'transaction_id', value: '', imageUri: '', imageName: '' });
                  }}
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

              {/* Screenshot Upload Section */}
              {easypaisaProof.type === 'screenshot' && (
                <View style={styles.screenshotSection}>
                  {!easypaisaProof.imageUri ? (
                    <Pressable
                      style={styles.uploadButton}
                      onPress={pickImage}
                      disabled={processing}
                    >
                      <Upload size={24} color="#a855f7" />
                      <Text style={styles.uploadButtonText}>Upload Screenshot</Text>
                      <Text style={styles.uploadButtonSubtext}>Tap to select image</Text>
                    </Pressable>
                  ) : (
                    <View style={styles.imagePreviewContainer}>
                      <View style={styles.imagePreview}>
                        <Image
                          source={{ uri: easypaisaProof.imageUri }}
                          style={styles.previewImage}
                        />
                      </View>
                      <Text style={styles.imageNameText} numberOfLines={1}>
                        {easypaisaProof.imageName}
                      </Text>
                      <Pressable
                        style={styles.removeImageButton}
                        onPress={removeImage}
                        disabled={processing}
                      >
                        <X size={18} color="#dc2626" />
                        <Text style={styles.removeImageText}>Remove</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              )}

              {/* Transaction ID Input Section */}
              {easypaisaProof.type === 'transaction_id' && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    Transaction ID (11 digits)
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 11-digit transaction ID"
                    keyboardType="numeric"
                    maxLength={11}
                    value={easypaisaProof.value}
                    onChangeText={(text) => {
                      // Only allow digits
                      const numericText = text.replace(/[^0-9]/g, '');
                      setEasypaisaProof({ ...easypaisaProof, value: numericText });
                    }}
                    editable={!processing}
                  />
                  {easypaisaProof.value && (
                    <Text style={[
                      styles.digitCountText,
                      easypaisaProof.value.length === 11 ? styles.digitCountValid : styles.digitCountInvalid
                    ]}>
                      {easypaisaProof.value.length} / 11 digits
                    </Text>
                  )}
                </View>
              )}

              {error && <Text style={styles.errorText}>{error}</Text>}

              <PatientPrimaryButton
                label={processing ? 'Submitting...' : 'Submit Proof'}
                onPress={handleEasypaisaSubmitProof}
                disabled={processing || !easypaisaProof.value}
                variant="accent"
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
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  dropdownButtonPlaceholder: {
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  dropdownButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  dropdownButtonTextPlaceholder: {
    color: '#9ca3af',
    fontWeight: '500',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#6b7280',
  },
  dropdownMenu: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  dropdownOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dropdownOptionActive: {
    backgroundColor: '#f3e8ff',
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#6b7280',
  },
  dropdownOptionTextActive: {
    color: '#a855f7',
    fontWeight: '600',
  },
  dropdownOptionNone: {
    fontStyle: 'italic',
  },
  methodHint: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },

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
  
  // Screenshot Upload
  screenshotSection: { gap: 12 },
  uploadButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#a855f7',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#faf5ff',
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a855f7',
  },
  uploadButtonSubtext: {
    fontSize: 12,
    color: '#9ca3af',
  },
  imagePreviewContainer: {
    gap: 12,
  },
  imagePreview: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  imageNameText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  removeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    backgroundColor: '#fef2f2',
  },
  removeImageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2626',
  },

  // Transaction ID
  digitCountText: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  digitCountValid: {
    color: '#10b981',
  },
  digitCountInvalid: {
    color: '#f59e0b',
  },

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
