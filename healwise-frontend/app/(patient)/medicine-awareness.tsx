import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  ChevronRight 
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getMedicineTypeAwareness, MedicineTypeAwareness } from '@/services/medicineService';

export default function MedicineSafety() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string>('antibiotic');
  const [awareness, setAwareness] = useState<MedicineTypeAwareness | null>(null);
  const [loadingAwareness, setLoadingAwareness] = useState(true);
  const [awarenessError, setAwarenessError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAwareness = async () => {
      setLoadingAwareness(true);
      setAwarenessError(null);
      try {
        const data = await getMedicineTypeAwareness(selectedType);
        setAwareness(data);
      } catch (error: any) {
        setAwareness(null);
        setAwarenessError(error.message || 'Failed to load medicine awareness');
      } finally {
        setLoadingAwareness(false);
      }
    };

    fetchAwareness();
  }, [selectedType]);

  // const safetyTips = [
  //   {
  //     id: 1,
  //     title: 'Drug Interaction Checker',
  //     subtitle: 'دوائیوں کا تعامل چیک کریں',
  //     icon: '⚠️',
  //     category: 'Safety Check',
  //     description: 'Check if your medications interact with each other',
  //     importance: 'High'
  //   },
  //   {
  //     id: 2,
  //     title: 'Proper Dosage Guide',
  //     subtitle: 'مناسب خوراک کی رہنمائی',
  //     icon: '💊',
  //     category: 'Dosage',
  //     description: 'Learn the correct dosage for common medicines',
  //     importance: 'High'
  //   },
  //   {
  //     id: 3,
  //     title: 'Storage Instructions',
  //     subtitle: 'ذخیرہ کرنے کی ہدایات',
  //     icon: '🌡️',
  //     category: 'Storage',
  //     description: 'How to properly store your medications',
  //     importance: 'Medium'
  //   }
  // ];

  // const commonWarnings = [
  //   {
  //     medicine: 'Antibiotics',
  //     warning: 'Complete the full course',
  //     risk: 'Medium',
  //     details: 'Stopping early can lead to resistance'
  //   },
  //   {
  //     medicine: 'Blood Pressure Meds',
  //     warning: 'Take at the same time daily',
  //     risk: 'High',
  //     details: 'Irregular timing affects effectiveness'
  //   }
  // ];

  const normalizeList = (value: string[] | string | undefined | null) => {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      return [value];
    }
    return [];
  };

  const safetyGuidelines = [
    'Always read the label before taking any medicine',
    'Keep medicines out of reach of children',
    'Check expiry dates regularly',
    'Do not share prescription medicines',
  ];

  return (
    <View style={styles.container}>
      {/* Background Tint */}
      <LinearGradient
        colors={["#fff7ed", "#ffffff", "#fef2f2"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <LinearGradient
        colors={["#f97316", "#ef4444"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Pressable 
              onPress={() => router.back()} 
              hitSlop={20} 
              style={({ pressed }: { pressed: boolean }) => [
                styles.backButton,
                { opacity: pressed ? 0.6 : 1 }
              ]}
            >
              <ArrowLeft size={22} color="white" />
            </Pressable>
            <View>
              <Text style={styles.headerTitle}>Medicine Awareness</Text>
              <Text style={styles.headerSubtitle}>دوا کی آگاہی</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Medicine Type Awareness from Backend */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color="#16a34a" />
            <Text style={styles.sectionTitle}>Medicine Type Awareness</Text>
          </View>
          <View style={styles.typeChipsRow}>
            {['Antibiotics', 'steroid', 'painkiller'].map((type) => (
              <Pressable
                key={type}
                onPress={() => setSelectedType(type)}
                style={[
                  styles.typeChip,
                  selectedType === type && styles.typeChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.typeChipText,
                    selectedType === type && styles.typeChipTextActive,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          {loadingAwareness ? (
            <ActivityIndicator size="small" color="#16a34a" />
          ) : awarenessError ? (
            <Text style={styles.errorText}>{awarenessError}</Text>
          ) : awareness ? (
            <View style={{ gap: 12 }}>
              <Card style={styles.awarenessCard}>
                <Text style={styles.awarenessTitle}>{awareness.medicine_type}</Text>
                <Text style={styles.awarenessDesc}>{awareness.description}</Text>
              </Card>

              <Card style={styles.awarenessCard}>
                <Text style={styles.awarenessHeading}>Common Uses</Text>
                {normalizeList(awareness.common_uses).map((item, idx) => (
                  <Text key={idx} style={styles.awarenessItemText}>• {item}</Text>
                ))}
              </Card>

              <Card style={styles.awarenessCard}>
                <Text style={styles.awarenessHeading}>How to Use</Text>
                {normalizeList(awareness.how_to_use).map((item, idx) => (
                  <Text key={idx} style={styles.awarenessItemText}>• {item}</Text>
                ))}
              </Card>

              <Card style={styles.awarenessCard}>
                <Text style={styles.awarenessHeading}>Precautions</Text>
                {normalizeList(awareness.precautions).map((item, idx) => (
                  <Text key={idx} style={styles.awarenessItemText}>• {item}</Text>
                ))}
              </Card>

              <Card style={styles.awarenessCard}>
                <Text style={styles.awarenessHeading}>Side Effects</Text>
                {normalizeList(awareness.side_effects).map((item, idx) => (
                  <Text key={idx} style={styles.awarenessItemText}>• {item}</Text>
                ))}
              </Card>

              <Card style={styles.awarenessCard}>
                <Text style={styles.awarenessHeading}>Warnings</Text>
                {normalizeList(awareness.warnings).map((item, idx) => (
                  <Text key={idx} style={styles.awarenessItemText}>• {item}</Text>
                ))}
                <Text style={styles.awarenessOtc}>
                  {awareness.otc ? 'Available over the counter (OTC)' : 'Prescription only'}
                </Text>
              </Card>

              <Text style={styles.awarenessDisclaimer}>{awareness.disclaimer}</Text>
            </View>
          ) : null}
        </View>

        {/* Important Warnings */}
        {/* <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlertTriangle size={20} color="#f97316" />
            <Text style={styles.sectionTitle}>Important Warnings</Text>
          </View>
          
          <View style={{ gap: 12 }}>
            {commonWarnings.map((item, index) => (
              <Card 
                key={index} 
                style={[
                  styles.warningCard,
                  { borderLeftColor: item.risk === 'High' ? '#ef4444' : '#f97316' }
                ]}
              >
                <View style={styles.warningRow}>
                  <Text style={styles.medicineName}>{item.medicine}</Text>
                  <View style={[styles.riskBadge, { backgroundColor: item.risk === 'High' ? '#fee2e2' : '#ffedd5' }]}>
                    <Text style={[styles.riskText, { color: item.risk === 'High' ? '#b91c1c' : '#9a3412' }]}>{item.risk}</Text>
                  </View>
                </View>
                <Text style={styles.warningText}>{item.warning}</Text>
                <Text style={styles.detailsText}>{item.details}</Text>
              </Card>
            ))}
          </View>
        </View> */}

        {/* Safety Tips Cards */}
        {/* <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color="#3b82f6" />
            <Text style={styles.sectionTitle}>Safety Resources</Text>
          </View>

          {safetyTips.map((tip) => (
            <Card key={tip.id} style={styles.tipCard}>
              <View style={styles.tipContent}>
                <View style={styles.iconContainer}>
                  <Text style={{ fontSize: 24 }}>{tip.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.badgeRow}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{tip.category}</Text>
                    </View>
                  </View>
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <Text style={styles.tipSubtitle}>{tip.subtitle}</Text>
                  <Text style={styles.tipDesc}>{tip.description}</Text>
                </View>
                <ChevronRight size={20} color="#d1d5db" />
              </View>
            </Card>
          ))}
        </View> */}

        {/* General Guidelines */}
        <Card style={styles.guidelinesCard}>
          <View style={styles.guidelinesHeader}>
            <View style={styles.checkCircle}>
              <CheckCircle size={16} color="white" />
            </View>
            <View>
              <Text style={styles.guidelinesTitle}>General Safety Guidelines</Text>
              <Text style={styles.guidelinesSubtitle}>عمومی حفاظتی رہنما اصول</Text>
            </View>
          </View>
          {safetyGuidelines.map((guideline, index) => (
            <View key={index} style={styles.guidelineItem}>
              <View style={styles.bullet} />
              <Text style={styles.guidelineText}>{guideline}</Text>
            </View>
          ))}
        </Card>

        {/* Emergency Helpline */}
        <Card style={styles.emergencyCard}>
          <AlertTriangle size={24} color="#b91c1c" />
          <View style={{ flex: 1 }}>
            <Text style={styles.emergencyTitle}>Emergency Helpline</Text>
            <Text style={styles.emergencyDesc}>Overdose or adverse reaction? Call:</Text>
            <Text style={styles.emergencyNumber}>1166</Text>
            <Text style={styles.emergencyUrdu}>زہر کنٹرول ہیلپ لائن: ١١٦٦</Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    zIndex: 10,
  },
  headerContent: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  backButton: { padding: 8, marginLeft: -8, marginRight: 8, zIndex: 20 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#FFFFFF" },
  headerSubtitle: { fontSize: 14, color: "#FFFFFF", opacity: 0.9 },
  scrollView: { flex: 1, marginTop: -20 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  warningCard: {
    padding: 16,
    borderLeftWidth: 4,
    backgroundColor: '#ffffff',
  },
  warningRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  medicineName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  riskBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  riskText: { fontSize: 10, fontWeight: '700' },
  warningText: { fontSize: 13, color: '#4b5563', marginBottom: 2 },
  detailsText: { fontSize: 12, color: '#6b7280' },
  tipCard: { padding: 16, marginBottom: 12 },
  tipContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconContainer: { width: 48, height: 48, backgroundColor: '#fff7ed', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, borderWidth: 1, borderColor: '#e5e7eb' },
  categoryText: { fontSize: 10, color: '#6b7280' },
  tipTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  tipSubtitle: { fontSize: 12, color: '#94a3b8', marginBottom: 4 },
  tipDesc: { fontSize: 13, color: '#64748b' },
  guidelinesCard: { padding: 20, backgroundColor: '#eff6ff', borderColor: '#bfdbfe', borderWidth: 1 },
  guidelinesHeader: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  checkCircle: { width: 32, height: 32, backgroundColor: '#3b82f6', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  guidelinesTitle: { fontSize: 15, fontWeight: '700', color: '#1e40af' },
  guidelinesSubtitle: { fontSize: 12, color: '#3b82f6' },
  guidelineItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10, paddingLeft: 44 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3b82f6', marginTop: 7 },
  guidelineText: { flex: 1, fontSize: 14, color: '#1e3a8a' },
  emergencyCard: { padding: 20, backgroundColor: '#fef2f2', borderColor: '#fecaca', borderWidth: 1, flexDirection: 'row', gap: 16, alignItems: 'center' },
  emergencyTitle: { fontSize: 16, fontWeight: '700', color: '#991b1b' },
  emergencyDesc: { fontSize: 13, color: '#b91c1c' },
  emergencyNumber: { fontSize: 24, fontWeight: '800', color: '#991b1b', marginVertical: 4 },
  emergencyUrdu: { fontSize: 12, color: '#ef4444' },
  typeChipsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  typeChipActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  typeChipText: { fontSize: 12, color: '#374151' },
  typeChipTextActive: { color: '#ffffff', fontWeight: '600' },
  awarenessCard: { padding: 14, backgroundColor: '#f0fdf4', borderRadius: 12, borderWidth: 1, borderColor: '#bbf7d0' },
  awarenessTitle: { fontSize: 16, fontWeight: '700', color: '#14532d', marginBottom: 4, textTransform: 'capitalize' },
  awarenessDesc: { fontSize: 13, color: '#166534' },
  awarenessHeading: { fontSize: 14, fontWeight: '700', color: '#14532d', marginBottom: 4 },
  awarenessItemText: { fontSize: 13, color: '#166534', marginBottom: 2 },
  awarenessOtc: { fontSize: 12, color: '#15803d', marginTop: 6, fontStyle: 'italic' },
  awarenessDisclaimer: { fontSize: 11, color: '#6b7280', marginTop: 8 },
  errorText: { fontSize: 12, color: '#b91c1c' },
  emptyText: { fontSize: 12, color: '#6b7280' },
});