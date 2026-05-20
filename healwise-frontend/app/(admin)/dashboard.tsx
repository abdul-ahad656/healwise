import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { UserCog, Activity, FileText, Pill } from 'lucide-react-native';
import { Card } from '@/components/ui/card';
import { AdminScreenHeader } from '@/components/admin/AdminScreenHeader';
import { adminScreenStyles as s } from '@/styles/adminScreen';

export default function AdminDashboard() {
  const router = useRouter();

  return (
    <View style={s.container}>
      <View style={[StyleSheet.absoluteFill, s.pageBg]} />

      <AdminScreenHeader
        title="Admin Panel"
        subtitle="Manage doctors, content, and insights"
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.push('/(admin)/manage-doctors')}
          style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1, marginBottom: 14 }]}
        >
          <Card style={dash.card}>
            <View style={dash.cardIcon}>
              <UserCog size={22} color="#0f172a" />
            </View>
            <Text style={dash.cardTitle}>Manage Doctors</Text>
            <Text style={dash.cardSubtitle}>
              Approve, disable, and create doctor accounts
            </Text>
          </Card>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(admin)/manage-health-tips')}
          style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1, marginBottom: 14 }]}
        >
          <Card style={dash.card}>
            <View style={dash.cardIcon}>
              <FileText size={22} color="#0f172a" />
            </View>
            <Text style={dash.cardTitle}>Health Tips</Text>
            <Text style={dash.cardSubtitle}>
              Publish and deactivate health tips
            </Text>
          </Card>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(admin)/manage-medicine')}
          style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1, marginBottom: 14 }]}
        >
          <Card style={dash.card}>
            <View style={dash.cardIcon}>
              <Pill size={22} color="#0f172a" />
            </View>
            <Text style={dash.cardTitle}>Medicine Types</Text>
            <Text style={dash.cardSubtitle}>
              Edit awareness content for medicine types
            </Text>
          </Card>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(admin)/analytics')}
          style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
        >
          <Card style={dash.card}>
            <View style={dash.cardIcon}>
              <Activity size={22} color="#0f172a" />
            </View>
            <Text style={dash.cardTitle}>Analytics</Text>
            <Text style={dash.cardSubtitle}>
              View system usage and key metrics
            </Text>
          </Card>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const dash = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 14,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});
