import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/card';
import { AdminScreenHeader } from '@/components/admin/AdminScreenHeader';
import { adminScreenStyles as s } from '@/styles/adminScreen';

export default function AnalyticsScreen() {
  const router = useRouter();

  return (
    <View style={s.container}>
      <View style={[StyleSheet.absoluteFill, s.pageBg]} />

      <AdminScreenHeader
        title="Analytics"
        subtitle="High-level overview of platform activity"
        onBack={() => router.back()}
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={metric.card}>
          <Text style={metric.label}>Total Registered Users</Text>
          <Text style={metric.value}>—</Text>
        </Card>
        <Card style={metric.card}>
          <Text style={metric.label}>Total Appointments</Text>
          <Text style={metric.value}>—</Text>
        </Card>
        <Card style={metric.card}>
          <Text style={metric.label}>Health Tips Published</Text>
          <Text style={metric.value}>—</Text>
        </Card>
        <Text style={metric.hint}>
          Backend analytics endpoints can be integrated later to populate these
          metrics in real time.
        </Text>
      </ScrollView>
    </View>
  );
}

const metric = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  value: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  hint: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});
