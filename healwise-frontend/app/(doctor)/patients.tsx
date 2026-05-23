import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/card';
import { DoctorScreenHeader } from '@/components/doctor/DoctorScreenHeader';
import { doctorScreenStyles as s } from '@/styles/doctorScreen';
import { getDoctorAppointments, Appointment } from '@/services/doctorPanelService';

export default function PatientsScreen() {
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
        setError(err.message || 'Failed to load patients');
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  return (
    <View style={s.container}>
      <View style={[StyleSheet.absoluteFill, s.pageBg]} />

      <DoctorScreenHeader
        title="My Patients"
        subtitle="Appointments assigned to you"
        onBack={() => router.back()}
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <Text style={s.infoText}>Loading patients...</Text>
        ) : error ? (
          <Text style={s.errorText}>{error}</Text>
        ) : appointments.length === 0 ? (
          <Text style={s.infoText}>No patients yet.</Text>
        ) : (
          appointments.map((a) => (
            <Card key={a._id} style={s.listCard}>
              <Text style={s.listCardTitle}>
                {a.patientName || `Patient ${a.patientId}`}
              </Text>
              <Text style={s.listCardMeta}>
                {a.appointmentDate} · {a.appointmentTime}
              </Text>
              <Text style={s.listCardMeta}>Status: {a.status}</Text>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}
