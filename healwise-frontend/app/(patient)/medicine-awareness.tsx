import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Search,
  X,
  Check,
  Pill,
  ClipboardList,
  Clock,
  AlertCircle,
  Activity,
  Info,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/card';
import {
  getMedicineTypeAwareness,
  MedicineTypeAwareness,
  getMedicineTypes,
} from '@/services/medicineService';
import { useTranslation } from 'react-i18next';

function normalizeList(value: string[] | string | undefined | null): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string' && !!item.trim())
      .flatMap((item) => {
        const lines = item.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
        return lines.length > 1 ? lines : [item.trim()];
      });
  }
  if (typeof value === 'string' && value.trim()) {
    const lines = value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    return lines.length > 1 ? lines : [value.trim()];
  }
  return [];
}

function formatTypeName(type: string): string {
  return type
    .split(/[\s_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

type AwarenessSection = {
  key: string;
  titleKey: string;
  items: string[];
  icon: React.ComponentType<{ size?: number; color?: string }>;
  accent: string;
  bg: string;
  border: string;
};

function buildSections(awareness: MedicineTypeAwareness): AwarenessSection[] {
  return [
    {
      key: 'uses',
      titleKey: 'medicine_awareness_common_uses',
      items: normalizeList(awareness.common_uses),
      icon: ClipboardList,
      accent: '#059669',
      bg: '#ecfdf5',
      border: '#a7f3d0',
    },
    {
      key: 'how',
      titleKey: 'medicine_awareness_how_to_use',
      items: normalizeList(awareness.how_to_use),
      icon: Clock,
      accent: '#2563eb',
      bg: '#eff6ff',
      border: '#bfdbfe',
    },
    {
      key: 'precautions',
      titleKey: 'medicine_awareness_precautions',
      items: normalizeList(awareness.precautions),
      icon: AlertCircle,
      accent: '#d97706',
      bg: '#fffbeb',
      border: '#fde68a',
    },
    {
      key: 'side',
      titleKey: 'medicine_awareness_side_effects',
      items: normalizeList(awareness.side_effects),
      icon: Activity,
      accent: '#ea580c',
      bg: '#fff7ed',
      border: '#fed7aa',
    },
    {
      key: 'warnings',
      titleKey: 'medicine_awareness_warnings',
      items: normalizeList(awareness.warnings),
      icon: AlertTriangle,
      accent: '#dc2626',
      bg: '#fef2f2',
      border: '#fecaca',
    },
  ].filter((s) => s.items.length > 0);
}

export default function MedicineSafety() {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const [selectedType, setSelectedType] = useState<string>('');
  const [medicineTypes, setMedicineTypes] = useState<string[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [typesError, setTypesError] = useState<string | null>(null);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [typeSearch, setTypeSearch] = useState('');

  const [awareness, setAwareness] = useState<MedicineTypeAwareness | null>(null);
  const [loadingAwareness, setLoadingAwareness] = useState(false);
  const [awarenessError, setAwarenessError] = useState<string | null>(null);

  const loadMedicineTypes = useCallback(async (showLoader = false) => {
    if (showLoader) setLoadingTypes(true);
    try {
      setTypesError(null);
      const types = await getMedicineTypes();
      setMedicineTypes(types);
      setSelectedType((current) =>
        current && !types.some((t) => t.toLowerCase() === current.toLowerCase()) ? '' : current
      );
    } catch {
      setTypesError(t('medicine_awareness_types_error'));
      setMedicineTypes([]);
    } finally {
      setLoadingTypes(false);
    }
  }, [t]);

  useEffect(() => {
    loadMedicineTypes(true);
  }, [loadMedicineTypes]);

  useFocusEffect(
    useCallback(() => {
      loadMedicineTypes(false);
    }, [loadMedicineTypes])
  );

  useEffect(() => {
    if (!selectedType) {
      setAwareness(null);
      setAwarenessError(null);
      return;
    }

    const fetchAwareness = async () => {
      setLoadingAwareness(true);
      setAwarenessError(null);
      try {
        const data = await getMedicineTypeAwareness(selectedType);
        setAwareness(data);
      } catch (error: unknown) {
        setAwareness(null);
        const msg = error instanceof Error ? error.message : t('medicine_awareness_error');
        setAwarenessError(msg);
      } finally {
        setLoadingAwareness(false);
      }
    };

    fetchAwareness();
  }, [selectedType, i18n.language, t]);

  const filteredTypes = useMemo(() => {
    const q = typeSearch.trim().toLowerCase();
    if (!q) return medicineTypes;
    return medicineTypes.filter(
      (type) =>
        type.toLowerCase().includes(q) ||
        formatTypeName(type).toLowerCase().includes(q)
    );
  }, [medicineTypes, typeSearch]);

  const sections = awareness ? buildSections(awareness) : [];

  const safetyGuidelines = [
    t('medicine_guideline_1'),
    t('medicine_guideline_2'),
    t('medicine_guideline_3'),
    t('medicine_guideline_4'),
  ];

  const openTypeModal = () => {
    setTypeSearch('');
    setShowTypeModal(true);
    loadMedicineTypes(false);
  };

  const selectType = (type: string) => {
    setSelectedType(type);
    setShowTypeModal(false);
    setTypeSearch('');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#fff7ed', '#ffffff', '#fef2f2']}
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
        colors={['#f97316', '#ef4444']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top', 'left', 'right']}>
          <View style={styles.headerContent}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={20}
              style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
            >
              <ArrowLeft size={22} color="white" />
            </Pressable>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>{t('medicine_awareness_title')}</Text>
              {/* <Text style={styles.headerSubtitle}>{t('medicine_awareness_subtitle')}</Text> */}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Category picker */}
        <View style={styles.dropdownSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Shield size={18} color="#16a34a" />
            </View>
            <Text style={styles.sectionTitle}>{t('medicine_awareness_section_title')}</Text>
          </View>

          <Pressable
            onPress={openTypeModal}
            disabled={loadingTypes}
            style={({ pressed }) => [
              styles.dropdownTrigger,
              selectedType ? styles.dropdownTriggerSelected : null,
              pressed && styles.dropdownTriggerPressed,
              loadingTypes && styles.dropdownTriggerDisabled,
            ]}
          >
            <LinearGradient
              colors={selectedType ? ['#f0fdf4', '#ffffff'] : ['#ffffff', '#fafafa']}
              style={styles.dropdownTriggerInner}
            >
              <View style={styles.dropdownIconCircle}>
                <Pill size={22} color={selectedType ? '#16a34a' : '#9ca3af'} />
              </View>
              <View style={styles.dropdownTextBlock}>
                <Text style={styles.dropdownLabel}>{t('medicine_awareness_select_label')}</Text>
                {loadingTypes ? (
                  <ActivityIndicator size="small" color="#16a34a" style={{ alignSelf: 'flex-start' }} />
                ) : (
                  <Text
                    style={[
                      styles.dropdownValue,
                      !selectedType && styles.dropdownValuePlaceholder,
                    ]}
                    numberOfLines={1}
                  >
                    {selectedType
                      ? formatTypeName(selectedType)
                      : t('medicine_awareness_select_placeholder')}
                  </Text>
                )}
              </View>
              <View style={styles.chevronWrap}>
                <ChevronDown size={20} color="#6b7280" />
              </View>
            </LinearGradient>
          </Pressable>

          {typesError ? (
            <Text style={styles.typesErrorText}>{typesError}</Text>
          ) : null}
        </View>

        {/* Awareness content */}
        <View style={styles.contentSection}>
          {!selectedType ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconRing}>
                <Info size={32} color="#f97316" />
              </View>
              <Text style={styles.emptyTitle}>{t('medicine_awareness_select_placeholder')}</Text>
              <Text style={styles.emptySubtitle}>{t('medicine_awareness_select_prompt')}</Text>
            </View>
          ) : loadingAwareness ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#f97316" />
              <Text style={styles.loadingText}>{t('medicine_awareness_loading')}</Text>
            </View>
          ) : awarenessError ? (
            <Card style={styles.errorCard}>
              <AlertTriangle size={22} color="#b91c1c" />
              <Text style={styles.errorText}>{awarenessError}</Text>
            </Card>
          ) : awareness ? (
            <View style={styles.awarenessStack}>
              {/* Hero */}
              <LinearGradient
                colors={['#f97316', '#ef4444']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCard}
              >
                <View style={styles.heroTopRow}>
                  <View style={styles.heroIconWrap}>
                    <Pill size={28} color="#fff" />
                  </View>
                  <View
                    style={[
                      styles.otcBadge,
                      awareness.otc ? styles.otcBadgeGreen : styles.otcBadgeAmber,
                    ]}
                  >
                    <Text style={styles.otcBadgeText}>
                      {awareness.otc
                        ? t('medicine_awareness_otc_true')
                        : t('medicine_awareness_otc_false')}
                    </Text>
                  </View>
                </View>
                <Text style={styles.heroTitle}>
                  {formatTypeName(awareness.medicine_type || selectedType)}
                </Text>
                {awareness.description ? (
                  <Text style={styles.heroDesc}>{awareness.description}</Text>
                ) : null}
              </LinearGradient>

              {/* Section cards */}
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <View
                    key={section.key}
                    style={[
                      styles.infoSection,
                      { backgroundColor: section.bg, borderColor: section.border },
                    ]}
                  >
                    <View style={styles.infoSectionHeader}>
                      <View
                        style={[styles.infoIconCircle, { backgroundColor: section.accent + '22' }]}
                      >
                        <Icon size={18} color={section.accent} />
                      </View>
                      <Text style={[styles.infoSectionTitle, { color: section.accent }]}>
                        {t(section.titleKey)}
                      </Text>
                    </View>
                    {section.items.map((item, idx) => (
                      <View key={idx} style={styles.infoRow}>
                        <View style={[styles.infoBullet, { backgroundColor: section.accent }]} />
                        <Text style={styles.infoItemText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                );
              })}

              {awareness.disclaimer ? (
                <View style={styles.disclaimerBox}>
                  <Info size={16} color="#6b7280" />
                  <Text style={styles.disclaimerText}>{awareness.disclaimer}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Guidelines */}
        <Card style={styles.guidelinesCard}>
          <View style={styles.guidelinesHeader}>
            <View style={styles.checkCircle}>
              <CheckCircle size={16} color="white" />
            </View>
            <View>
              <Text style={styles.guidelinesTitle}>{t('medicine_guidelines_title')}</Text>
              <Text style={styles.guidelinesSubtitle}>{t('medicine_guidelines_subtitle')}</Text>
            </View>
          </View>
          {safetyGuidelines.map((guideline, index) => (
            <View key={index} style={styles.guidelineItem}>
              <View style={styles.bullet} />
              <Text style={styles.guidelineText}>{guideline}</Text>
            </View>
          ))}
        </Card>

        {/* Emergency */}
        <Card style={styles.emergencyCard}>
          <AlertTriangle size={24} color="#b91c1c" />
          <View style={{ flex: 1 }}>
            <Text style={styles.emergencyTitle}>{t('medicine_emergency_title')}</Text>
            <Text style={styles.emergencyDesc}>{t('medicine_emergency_desc')}</Text>
            <Text style={styles.emergencyNumber}>{t('medicine_emergency_number_label')}</Text>
          </View>
        </Card>
      </ScrollView>

      {/* Searchable type picker — bottom sheet */}
      <Modal
        visible={showTypeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTypeModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.sheetOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.sheetBackdrop} onPress={() => setShowTypeModal(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{t('medicine_awareness_select_label')}</Text>
              <Pressable
                onPress={() => setShowTypeModal(false)}
                hitSlop={12}
                style={styles.sheetClose}
              >
                <X size={22} color="#6b7280" />
              </Pressable>
            </View>

            <View style={styles.searchBox}>
              <Search size={18} color="#9ca3af" />
              <TextInput
                value={typeSearch}
                onChangeText={setTypeSearch}
                placeholder={t('medicine_awareness_search_types')}
                placeholderTextColor="#9ca3af"
                style={styles.searchInput}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {typeSearch.length > 0 ? (
                <Pressable onPress={() => setTypeSearch('')} hitSlop={8}>
                  <X size={18} color="#9ca3af" />
                </Pressable>
              ) : null}
            </View>

            <ScrollView
              style={styles.sheetList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {loadingTypes ? (
                <ActivityIndicator color="#16a34a" style={{ marginVertical: 24 }} />
              ) : filteredTypes.length === 0 ? (
                <Text style={styles.noResultsText}>
                  {medicineTypes.length === 0 && !typeSearch.trim()
                    ? t('medicine_awareness_types_empty')
                    : t('medicine_awareness_no_types')}
                </Text>
              ) : (
                filteredTypes.map((type) => {
                  const isSelected = selectedType === type;
                  return (
                    <Pressable
                      key={type}
                      onPress={() => selectType(type)}
                      style={({ pressed }) => [
                        styles.sheetOption,
                        isSelected && styles.sheetOptionSelected,
                        pressed && !isSelected && styles.sheetOptionPressed,
                      ]}
                    >
                      <View style={styles.sheetOptionLeft}>
                        <View
                          style={[
                            styles.sheetOptionDot,
                            isSelected && styles.sheetOptionDotSelected,
                          ]}
                        >
                          {isSelected ? <Check size={14} color="#fff" strokeWidth={3} /> : null}
                        </View>
                        <Text
                          style={[
                            styles.sheetOptionText,
                            isSelected && styles.sheetOptionTextSelected,
                          ]}
                        >
                          {formatTypeName(type)}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  backButton: { padding: 8, marginLeft: -8, marginTop: 4 },
  headerTextContainer: { flex: 1, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 14, color: '#FFFFFF', opacity: 0.9, marginTop: 2 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  dropdownSection: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1f2937', flex: 1 },

  dropdownTrigger: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  dropdownTriggerSelected: { borderColor: '#86efac' },
  dropdownTriggerPressed: { opacity: 0.92 },
  dropdownTriggerDisabled: { opacity: 0.7 },
  dropdownTriggerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  dropdownIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownTextBlock: { flex: 1 },
  dropdownLabel: { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 },
  dropdownValue: { fontSize: 17, fontWeight: '700', color: '#111827' },
  dropdownValuePlaceholder: { fontWeight: '500', color: '#9ca3af' },
  chevronWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typesErrorText: { marginTop: 8, fontSize: 13, color: '#b91c1c' },

  contentSection: { marginBottom: 20 },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderStyle: 'dashed',
  },
  emptyIconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 22 },

  loadingContainer: { alignItems: 'center', paddingVertical: 48 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6b7280' },

  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
  },
  errorText: { flex: 1, fontSize: 14, color: '#b91c1c', lineHeight: 20 },

  awarenessStack: { gap: 14 },
  heroCard: {
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otcBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    maxWidth: '55%',
  },
  otcBadgeGreen: { backgroundColor: 'rgba(255,255,255,0.95)' },
  otcBadgeAmber: { backgroundColor: 'rgba(255,255,255,0.9)' },
  otcBadgeText: { fontSize: 11, fontWeight: '700', color: '#1f2937', textAlign: 'center' },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  heroDesc: { fontSize: 15, color: 'rgba(255,255,255,0.92)', lineHeight: 22 },

  infoSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  infoSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  infoIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSectionTitle: { fontSize: 16, fontWeight: '700', flex: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  infoBullet: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  infoItemText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 21 },

  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  disclaimerText: { flex: 1, fontSize: 12, color: '#6b7280', lineHeight: 18, fontStyle: 'italic' },

  guidelinesCard: {
    padding: 20,
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderWidth: 1,
    marginBottom: 16,
  },
  guidelinesHeader: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  checkCircle: {
    width: 32,
    height: 32,
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guidelinesTitle: { fontSize: 15, fontWeight: '700', color: '#1e40af' },
  guidelinesSubtitle: { fontSize: 12, color: '#3b82f6' },
  guidelineItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10, paddingLeft: 44 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3b82f6', marginTop: 7 },
  guidelineText: { flex: 1, fontSize: 14, color: '#1e3a8a' },

  emergencyCard: {
    padding: 20,
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  emergencyTitle: { fontSize: 16, fontWeight: '700', color: '#991b1b' },
  emergencyDesc: { fontSize: 13, color: '#b91c1c' },
  emergencyNumber: { fontSize: 24, fontWeight: '800', color: '#991b1b', marginTop: 4 },

  sheetOverlay: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    maxHeight: '78%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e5e7eb',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  sheetClose: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 16, color: '#111827', paddingVertical: 4 },
  sheetList: { maxHeight: 360 },
  noResultsText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 14,
    paddingVertical: 24,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  sheetOptionSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  sheetOptionPressed: { backgroundColor: '#f3f4f6' },
  sheetOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  sheetOptionDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetOptionDotSelected: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  sheetOptionText: { fontSize: 16, fontWeight: '500', color: '#374151' },
  sheetOptionTextSelected: { fontWeight: '700', color: '#14532d' },
});
