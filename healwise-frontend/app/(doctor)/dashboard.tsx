import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Calendar,
  Video,
  Upload,
  History,
  Users,
} from 'lucide-react-native';
import { Card } from '@/components/ui/card';
import { DoctorScreenHeader } from '@/components/doctor/DoctorScreenHeader';
import { doctorScreenStyles as s } from '@/styles/doctorScreen';
import {
  getDoctorAppointments,
  Appointment,
} from '@/services/doctorPanelService';

export default function DoctorDashboard() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const data = await getDoctorAppointments();
        setAppointments(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const completed = appointments.filter((a) => a.status === 'completed');
  const upcoming = appointments.filter((a) =>
    ['pending', 'accepted', 'confirmed', 'in_progress'].includes(a.status)
  );

  const menuItems = [
    {
      title: 'My Patients',
      subtitle: 'View patients from your appointments',
      icon: Users,
      route: '/(doctor)/patients' as const,
    },
    {
      title: 'Manage Schedule',
      subtitle: 'Set days and booking time slots',
      icon: Calendar,
      route: '/(doctor)/schedule' as const,
    },
    {
      title: 'Appointments',
      subtitle: 'Accept, reject, and complete bookings',
      icon: History,
      route: '/(doctor)/history' as const,
    },
    {
      title: 'Teleconsultation',
      subtitle: 'Start video calls with patients',
      icon: Video,
      route: '/(doctor)/teleconsult' as const,
    },
    {
      title: 'Upload Prescription',
      subtitle: 'Share Rx files with patients',
      icon: Upload,
      route: '/(doctor)/upload-prescription' as const,
    },
  ];

  return (
    <View style={s.container}>
      <View style={[StyleSheet.absoluteFill, s.pageBg]} />

      <DoctorScreenHeader
        title="Doctor Panel"
        subtitle="Manage appointments, schedule, and consultations"
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={dash.statsRow}>
          <Card style={[dash.statCard, { backgroundColor: '#f5f3ff', borderColor: '#ddd6fe' }]}>
            <Text style={dash.statValue}>{completed.length}</Text>
            <Text style={dash.statLabel}>Completed</Text>
          </Card>
          <Card style={[dash.statCard, { backgroundColor: '#ecfdf5', borderColor: '#bbf7d0' }]}>
            <Text style={dash.statValue}>{upcoming.length}</Text>
            <Text style={dash.statLabel}>Upcoming</Text>
          </Card>
        </View>

        {menuItems.map((item) => (
          <Pressable
            key={item.route}
            onPress={() => router.push(item.route)}
            style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1, marginBottom: 12 }]}
          >
            <Card style={dash.menuCard}>
              <View style={dash.menuIcon}>
                <item.icon size={22} color="#1d4ed8" />
              </View>
              <View style={dash.menuText}>
                <Text style={dash.menuTitle}>{item.title}</Text>
                <Text style={dash.menuSubtitle}>{item.subtitle}</Text>
              </View>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const dash = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  statLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    gap: 14,
    marginBottom: 12,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: { flex: 1 },
  menuTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  link: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1d4ed8',
  },
});
