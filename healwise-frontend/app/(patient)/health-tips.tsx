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
import { useRouter, type Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
  BookOpen,
  ChevronDown,
  Search,
  X,
  Check,
  Info,
  Heart,
  Stethoscope,
  Sparkles,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/card';
import { PatientScreenHeader } from '@/components/patient/PatientScreenHeader';
import {
  getHealthTips,
  getHealthTipCategories,
  HealthTip,
  HealthTipCategory,
} from '@/services/healthTipService';
import { useTranslation } from 'react-i18next';

function categoryIcon(type: string) {
  return type === 'general' ? Heart : Stethoscope;
}

export default function HealthEducation() {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const [categories, setCategories] = useState<HealthTipCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<HealthTipCategory | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');

  const [tips, setTips] = useState<HealthTip[]>([]);
  const [loadingTips, setLoadingTips] = useState(false);
  const [tipsError, setTipsError] = useState<string | null>(null);
  const [expandedTip, setExpandedTip] = useState<HealthTip | null>(null);

  const loadCategories = useCallback(async (showLoader = false) => {
    if (showLoader) setLoadingCategories(true);
    try {
      setCategoriesError(null);
      const list = await getHealthTipCategories();
      setCategories(list);
      setSelectedCategory((current) =>
        current && !list.some((c) => c.key === current.key) ? null : current
      );
    } catch {
      setCategoriesError(t('health_categories_error'));
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, [t, i18n.language]);

  useEffect(() => {
    loadCategories(true);
  }, [loadCategories]);

  useFocusEffect(
    useCallback(() => {
      loadCategories(false);
    }, [loadCategories])
  );

  useEffect(() => {
    if (!selectedCategory) {
      setTips([]);
      setTipsError(null);
      return;
    }

    const fetchTips = async () => {
      setLoadingTips(true);
      setTipsError(null);
      try {
        const data = await getHealthTips(selectedCategory);
        setTips(data);
      } catch (error: unknown) {
        setTips([]);
        const msg = error instanceof Error ? error.message : t('health_no_tips');
        setTipsError(msg);
      } finally {
        setLoadingTips(false);
      }
    };

    fetchTips();
  }, [selectedCategory, i18n.language, t]);

  const filteredCategories = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.key.toLowerCase().includes(q)
    );
  }, [categories, categorySearch]);

  const featuredTip = tips.length > 0 ? tips[0] : null;

  const openCategoryModal = () => {
    setCategorySearch('');
    setShowCategoryModal(true);
    loadCategories(false);
  };

  const selectCategory = (category: HealthTipCategory) => {
    setSelectedCategory(category);
    setShowCategoryModal(false);
    setCategorySearch('');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#f0fdf4', '#ffffff', '#f0f9ff']}
        style={StyleSheet.absoluteFill}
      />

      <PatientScreenHeader
        title={t('health_education_title')}
        colors={['#22c55e', '#10b981']}
        onBack={() => router.navigate('/(patient)/home' as Href)}
      />

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
              <BookOpen size={18} color="#16a34a" />
            </View>
            <Text style={styles.sectionTitle}>{t('health_learn_section')}</Text>
          </View>

          <Pressable
            onPress={openCategoryModal}
            disabled={loadingCategories}
            style={({ pressed }) => [
              styles.dropdownTrigger,
              selectedCategory && styles.dropdownTriggerSelected,
              pressed && styles.dropdownTriggerPressed,
              loadingCategories && styles.dropdownTriggerDisabled,
            ]}
          >
            <LinearGradient
              colors={selectedCategory ? ['#f0fdf4', '#ffffff'] : ['#ffffff', '#fafafa']}
              style={styles.dropdownTriggerInner}
            >
              <View style={styles.dropdownIconCircle}>
                {selectedCategory ? (
                  React.createElement(categoryIcon(selectedCategory.type), {
                    size: 22,
                    color: '#16a34a',
                  })
                ) : (
                  <BookOpen size={22} color="#9ca3af" />
                )}
              </View>
              <View style={styles.dropdownTextBlock}>
                <Text style={styles.dropdownLabel}>{t('health_select_category_label')}</Text>
                {loadingCategories ? (
                  <ActivityIndicator size="small" color="#16a34a" style={{ alignSelf: 'flex-start' }} />
                ) : (
                  <Text
                    style={[
                      styles.dropdownValue,
                      !selectedCategory && styles.dropdownValuePlaceholder,
                    ]}
                    numberOfLines={1}
                  >
                    {selectedCategory
                      ? selectedCategory.label
                      : t('health_select_category')}
                  </Text>
                )}
              </View>
              <View style={styles.chevronWrap}>
                <ChevronDown size={20} color="#6b7280" />
              </View>
            </LinearGradient>
          </Pressable>

          {categoriesError ? (
            <Text style={styles.typesErrorText}>{categoriesError}</Text>
          ) : null}
        </View>

        {/* Content */}
        <View style={styles.contentSection}>
          {!selectedCategory ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconRing}>
                <Info size={32} color="#22c55e" />
              </View>
              <Text style={styles.emptyTitle}>{t('health_select_category')}</Text>
              <Text style={styles.emptySubtitle}>{t('health_select_prompt')}</Text>
            </View>
          ) : loadingTips ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#22c55e" />
              <Text style={styles.loadingText}>{t('health_loading')}</Text>
            </View>
          ) : tipsError ? (
            <Card style={styles.errorCard}>
              <Text style={styles.errorText}>{tipsError}</Text>
            </Card>
          ) : tips.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptySubtitle}>{t('health_no_tips')}</Text>
            </View>
          ) : (
            <View style={styles.tipsStack}>
              <LinearGradient
                colors={['#22c55e', '#10b981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCard}
              >
                <View style={styles.heroTopRow}>
                  <View style={styles.heroIconWrap}>
                    {React.createElement(categoryIcon(selectedCategory.type), {
                      size: 28,
                      color: '#fff',
                    })}
                  </View>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>
                      {t('health_articles_count', { count: tips.length })}
                    </Text>
                  </View>
                </View>
                <Text style={styles.heroTitle}>{selectedCategory.label}</Text>
                <Text style={styles.heroDesc}>
                  {selectedCategory.type === 'general'
                    ? t('health_type_general')
                    : t('health_type_disease')}
                </Text>
              </LinearGradient>

              {tips.map((tip) => (
                <Pressable
                  key={tip._id}
                  onPress={() => setExpandedTip(tip)}
                  style={({ pressed }) => [styles.tipCard, pressed && styles.tipCardPressed]}
                >
                  <View style={styles.tipCardAccent} />
                  <View style={styles.tipEmojiBox}>
                    <Text style={styles.tipEmoji}>{tip.media?.image || '📖'}</Text>
                  </View>
                  <View style={styles.tipCardBody}>
                    <View style={styles.tipMetaRow}>
                      <View
                        style={[
                          styles.tipTypeBadge,
                          tip.type === 'disease' && styles.tipTypeBadgeDisease,
                        ]}
                      >
                        <Text style={styles.tipTypeText}>
                          {tip.type === 'disease'
                            ? t('health_type_disease')
                            : t('health_type_general')}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.tipTitle}>{tip.title}</Text>
                    <Text style={styles.tipDesc} numberOfLines={2}>
                      {tip.description}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Category bottom sheet */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.sheetOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.sheetBackdrop} onPress={() => setShowCategoryModal(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{t('health_select_category_label')}</Text>
              <Pressable
                onPress={() => setShowCategoryModal(false)}
                hitSlop={12}
                style={styles.sheetClose}
              >
                <X size={22} color="#6b7280" />
              </Pressable>
            </View>

            <View style={styles.searchBox}>
              <Search size={18} color="#9ca3af" />
              <TextInput
                value={categorySearch}
                onChangeText={setCategorySearch}
                placeholder={t('health_search_categories')}
                placeholderTextColor="#9ca3af"
                style={styles.searchInput}
                autoCorrect={false}
              />
              {categorySearch.length > 0 ? (
                <Pressable onPress={() => setCategorySearch('')} hitSlop={8}>
                  <X size={18} color="#9ca3af" />
                </Pressable>
              ) : null}
            </View>

            <ScrollView
              style={styles.sheetList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {loadingCategories ? (
                <ActivityIndicator color="#16a34a" style={{ marginVertical: 24 }} />
              ) : filteredCategories.length === 0 ? (
                <Text style={styles.noResultsText}>
                  {categories.length === 0 && !categorySearch.trim()
                    ? t('health_categories_empty')
                    : t('health_no_categories')}
                </Text>
              ) : (
                filteredCategories.map((cat) => {
                  const isSelected = selectedCategory?.key === cat.key;
                  const Icon = categoryIcon(cat.type);
                  return (
                    <Pressable
                      key={cat.key}
                      onPress={() => selectCategory(cat)}
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
                          {isSelected ? (
                            <Check size={14} color="#fff" strokeWidth={3} />
                          ) : (
                            <Icon size={14} color="#6b7280" />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.sheetOptionText,
                            isSelected && styles.sheetOptionTextSelected,
                          ]}
                        >
                          {cat.label}
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

      {/* Article detail modal */}
      <Modal
        visible={expandedTip !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setExpandedTip(null)}
      >
        <View style={styles.detailOverlay}>
          <Pressable style={styles.sheetBackdrop} onPress={() => setExpandedTip(null)} />
          <View style={styles.detailCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {expandedTip ? (
                <>
                  <View style={styles.detailHeader}>
                    <Text style={styles.detailEmoji}>{expandedTip.media?.image || '📖'}</Text>
                    <Pressable onPress={() => setExpandedTip(null)} style={styles.detailClose}>
                      <X size={22} color="#6b7280" />
                    </Pressable>
                  </View>
                  <Text style={styles.detailTitle}>{expandedTip.title}</Text>
                  <View
                    style={[
                      styles.tipTypeBadge,
                      expandedTip.type === 'disease' && styles.tipTypeBadgeDisease,
                      { alignSelf: 'flex-start', marginBottom: 16 },
                    ]}
                  >
                    <Text style={styles.tipTypeText}>
                      {expandedTip.type === 'disease'
                        ? t('health_type_disease')
                        : t('health_type_general')}
                    </Text>
                  </View>
                  <Text style={styles.detailBody}>{expandedTip.description}</Text>
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
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
  dropdownLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
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
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 22 },

  loadingContainer: { alignItems: 'center', paddingVertical: 48 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6b7280' },

  errorCard: { padding: 16, backgroundColor: '#fef2f2', borderColor: '#fecaca', borderWidth: 1 },
  errorText: { fontSize: 14, color: '#b91c1c' },

  tipsStack: { gap: 14 },
  heroCard: { borderRadius: 20, padding: 20, overflow: 'hidden' },
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
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  countBadgeText: { fontSize: 12, fontWeight: '700', color: '#166534' },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 6 },
  heroDesc: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },

  featuredCard: {
    borderRadius: 16,
    padding: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  featuredHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  featuredLabel: { fontSize: 13, fontWeight: '700', color: '#059669' },
  featuredTitle: { fontSize: 18, fontWeight: '700', color: '#14532d', marginBottom: 8 },
  featuredDesc: { fontSize: 14, color: '#166534', lineHeight: 21 },
  readMore: { marginTop: 10, fontSize: 13, fontWeight: '600', color: '#059669' },

  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tipCardPressed: { opacity: 0.92 },
  tipCardAccent: { width: 4, backgroundColor: '#22c55e' },
  tipEmojiBox: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  tipEmoji: { fontSize: 28 },
  tipCardBody: { flex: 1, padding: 14, paddingLeft: 10 },
  tipMetaRow: { flexDirection: 'row', marginBottom: 6 },
  tipTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#dcfce7',
  },
  tipTypeBadgeDisease: { backgroundColor: '#dbeafe' },
  tipTypeText: { fontSize: 10, fontWeight: '700', color: '#166534' },
  tipTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  tipDesc: { fontSize: 13, color: '#6b7280', lineHeight: 19 },

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
  noResultsText: { textAlign: 'center', color: '#9ca3af', fontSize: 14, paddingVertical: 24 },
  sheetOption: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  sheetOptionSelected: { backgroundColor: '#f0fdf4', borderColor: '#86efac' },
  sheetOptionPressed: { backgroundColor: '#f3f4f6' },
  sheetOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sheetOptionDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetOptionDotSelected: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  sheetOptionText: { fontSize: 16, fontWeight: '500', color: '#374151' },
  sheetOptionTextSelected: { fontWeight: '700', color: '#14532d' },

  detailOverlay: { flex: 1, justifyContent: 'center', padding: 20 },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailEmoji: { fontSize: 40 },
  detailClose: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8 },
  detailBody: { fontSize: 16, color: '#374151', lineHeight: 26 },
});
