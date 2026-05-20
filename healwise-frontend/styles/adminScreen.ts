import { StyleSheet } from 'react-native';

export const PLACEHOLDER_COLOR = '#9CA3AF';

export const adminScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageBg: {
    backgroundColor: '#f9fafb',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  formCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
  },
  listSectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  formSectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  fieldSpacing: {
    marginBottom: 16,
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
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#b91c1c',
    marginBottom: 8,
  },
  listCard: {
    marginBottom: 14,
    padding: 16,
    borderRadius: 16,
  },
  listCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  listCardMeta: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    lineHeight: 18,
  },
});

export const adminHeaderStyles = StyleSheet.create({
  gradient: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  safe: {
    paddingTop: 4,
  },
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
  textBlock: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 13,
    color: '#ffffff',
    opacity: 0.92,
    marginTop: 4,
    lineHeight: 18,
  },
});
