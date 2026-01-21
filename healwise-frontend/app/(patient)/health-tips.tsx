import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  BookOpen, 
  Play, 
  Clock, 
  Eye, 
  ChevronRight,
  Bell
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function HealthEducation() {
  const router = useRouter();

  const educationContent = [
    {
      id: 1,
      title: 'Diabetes Prevention',
      subtitle: 'ذیابیطس سے بچاؤ',
      type: 'Article',
      duration: '5 min read',
      category: 'Prevention',
      image: '🍎',
      description: 'Learn how to prevent diabetes through lifestyle changes'
    },
    {
      id: 2,
      title: 'Heart Health Tips',
      subtitle: 'دل کی صحت کے نکات',
      type: 'Video',
      duration: '3 min watch',
      category: 'Heart Health',
      image: '❤️',
      description: 'Simple exercises and diet tips for a healthy heart'
    },
    {
      id: 3,
      title: 'Mental Wellness',
      subtitle: 'ذہنی صحت',
      type: 'Guide',
      duration: '8 min read',
      category: 'Mental Health',
      image: '🧠',
      description: 'Managing stress and maintaining mental wellbeing'
    }
  ];

  const healthAlerts = [
    {
      title: 'Dengue Alert in Karachi',
      urgency: 'High',
      date: '2 days ago'
    },
    {
      title: 'Free Blood Pressure Checkup',
      urgency: 'Info',
      date: '1 week ago'
    }
  ];

  return (
    <View style={styles.container}>
      {/* Background Layer */}
      <LinearGradient
        colors={["#f0fdf4", "#ffffff", "#f0f9ff"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <LinearGradient
        colors={["#22c55e", "#10b981"]}
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
              <Text style={styles.headerTitle}>Health Education</Text>
              <Text style={styles.headerSubtitle}>صحت کی تعلیم</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Health Alerts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={18} color="#16a34a" />
            <Text style={styles.sectionTitle}>Local Health Alerts</Text>
          </View>
          
          <View style={{ gap: 10 }}>
            {healthAlerts.map((alert, index) => (
              <Card key={index} style={[
                styles.alertCard,
                { borderLeftColor: alert.urgency === 'High' ? '#ef4444' : '#3b82f6' }
              ]}>
                <View style={styles.alertRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alertTitle}>{alert.title}</Text>
                    <Text style={styles.alertDate}>{alert.date}</Text>
                  </View>
                  <View style={[styles.urgencyBadge, { backgroundColor: alert.urgency === 'High' ? '#fee2e2' : '#dbeafe' }]}>
                    <Text style={[styles.urgencyText, { color: alert.urgency === 'High' ? '#b91c1c' : '#1e40af' }]}>{alert.urgency}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        </View>

        {/* Learn Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <BookOpen size={20} color="#16a34a" />
            <Text style={styles.sectionTitle}>Learn About Health</Text>
          </View>

          {educationContent.map((content) => (
            <Card key={content.id} style={styles.contentCard}>
              <View style={styles.cardInner}>
                <View style={styles.imageBox}>
                  <Text style={{ fontSize: 24 }}>{content.image}</Text>
                </View>
                
                <View style={{ flex: 1 }}>
                  <View style={styles.metaRow}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{content.category}</Text>
                    </View>
                    <View style={styles.durationBox}>
                      {content.type === 'Video' ? <Play size={10} color="#6b7280" /> : <Clock size={10} color="#6b7280" />}
                      <Text style={styles.durationText}>{content.duration}</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.contentTitle}>{content.title}</Text>
                  <Text style={styles.contentUrdu}>{content.subtitle}</Text>
                  <Text style={styles.contentDesc} numberOfLines={2}>{content.description}</Text>
                </View>
                <ChevronRight size={18} color="#d1d5db" />
              </View>
            </Card>
          ))}
          
          <Button variant="outline" title="Explore All Topics" style={{ marginTop: 8 }} />
        </View>

        {/* Daily Tip */}
        <Card style={styles.tipCard}>
          <LinearGradient
            colors={["#f0fdf4", "#dcfce7"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.tipIconBox}>
            <Text style={{ fontSize: 20 }}>💡</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tipLabel}>Daily Health Tip</Text>
            <Text style={styles.tipText}>
              Drink at least 8 glasses of water daily to stay hydrated and maintain good health.
            </Text>
            <Text style={styles.tipUrdu}>صحت مند رہنے کے لیے روزانہ کم از کم 8 گلاس پانی پیئں۔</Text>
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
  alertCard: { padding: 12, borderLeftWidth: 4, backgroundColor: '#ffffff' },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  alertTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  alertDate: { fontSize: 12, color: '#6b7280' },
  urgencyBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  urgencyText: { fontSize: 10, fontWeight: '700' },
  contentCard: { padding: 16, marginBottom: 12 },
  cardInner: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  imageBox: { width: 50, height: 50, backgroundColor: '#f0fdf4', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  categoryBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: '#f3f4f6' },
  categoryText: { fontSize: 10, color: '#4b5563', fontWeight: '600' },
  durationBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  durationText: { fontSize: 10, color: '#6b7280' },
  contentTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  contentUrdu: { fontSize: 12, color: '#059669', marginBottom: 4 },
  contentDesc: { fontSize: 13, color: '#4b5563', lineHeight: 18 },
  tipCard: { 
    padding: 20, 
    borderRadius: 20, 
    flexDirection: 'row', 
    gap: 16, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#bbf7d0' 
  },
  tipIconBox: { width: 40, height: 40, backgroundColor: '#ffffff', borderRadius: 20, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  tipLabel: { fontSize: 15, fontWeight: '700', color: '#166534', marginBottom: 2 },
  tipText: { fontSize: 13, color: '#15803d', lineHeight: 18 },
  tipUrdu: { fontSize: 11, color: '#10b981', marginTop: 4, opacity: 0.8 }
});