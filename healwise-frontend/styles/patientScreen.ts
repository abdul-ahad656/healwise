import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

export const PLACEHOLDER_COLOR = '#9CA3AF';

export const patientScreenStyles = StyleSheet.create({
  container: { flex: 1 },
  pageBg: { backgroundColor: '#f9fafb' },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  infoText: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  errorText: { fontSize: 14, color: '#b91c1c', marginBottom: 8 },
  listCard: {
    marginBottom: 14,
    padding: 16,
    borderRadius: 16,
  },
  tabListContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
    gap: 0,
  },
});

export const patientHeaderStyles = StyleSheet.create({
  gradient: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  safe: { paddingTop: 4 },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { flex: 1, paddingRight: 8 },
  title: { fontSize: 20, fontWeight: '800', color: '#ffffff' },
  subtitle: {
    fontSize: 13,
    color: '#ffffff',
    opacity: 0.92,
    marginTop: 4,
    lineHeight: 18,
  },
});

type BtnVariant = 'primary' | 'success' | 'danger' | 'outline' | 'accent';

export const patientButtonVariants: Record<
  BtnVariant,
  { box: ViewStyle; label: TextStyle }
> = {
  primary: {
    box: { backgroundColor: '#2563eb', borderColor: '#1e3a8a' },
    label: { color: '#ffffff' },
  },
  accent: {
    box: { backgroundColor: '#9333ea', borderColor: '#6b21a8' },
    label: { color: '#ffffff' },
  },
  success: {
    box: { backgroundColor: '#dcfce7', borderColor: '#15803d' },
    label: { color: '#14532d' },
  },
  danger: {
    box: { backgroundColor: '#fee2e2', borderColor: '#b91c1c' },
    label: { color: '#991b1b' },
  },
  outline: {
    box: { backgroundColor: '#faf5ff', borderColor: '#9333ea' },
    label: { color: '#6b21a8' },
  },
};

export const patientButtonBase: ViewStyle = {
  minHeight: 50,
  paddingHorizontal: 18,
  paddingVertical: 14,
  borderRadius: 12,
  borderWidth: 2,
  alignItems: 'center',
  justifyContent: 'center',
  elevation: 4,
};

export const patientButtonLabel: TextStyle = {
  fontSize: 16,
  fontWeight: '800',
  textAlign: 'center',
};
