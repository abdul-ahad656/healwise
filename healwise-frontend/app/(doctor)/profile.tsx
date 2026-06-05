import React, { useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { History, KeyRound, LogOut } from 'lucide-react-native';
import { Card } from '@/components/ui/card';
import { DoctorScreenHeader } from '@/components/doctor/DoctorScreenHeader';
import { doctorScreenStyles as s } from '@/styles/doctorScreen';
import AuthStore from '@/services/authStore';

export default function DoctorProfileScreen() {
  const router = useRouter();
  const user = AuthStore.getUser();
  const name = useMemo(() => user?.name || 'Doctor', [user]);
  const email = useMemo(() => user?.email || '', [user]);

  const handleLogout = () => {
    AuthStore.clear();
    router.replace('/(auth)/login');
  };

  return (
    <View style={s.container}>
      <View style={[StyleSheet.absoluteFill, s.pageBg]} />

      <DoctorScreenHeader
        title="Profile"
        subtitle="Account and quick links"
        onBack={() => router.navigate('/(doctor)/dashboard' as Href)}
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.name}>{name}</Text>
        {email ? <Text style={styles.email}>{email}</Text> : null}

        <Card style={styles.menuCard}>
          <Pressable
            onPress={() => router.push('/(doctor)/history')}
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.85 : 1 }]}
          >
            <View style={styles.iconCircle}>
              <History size={20} color="#1d4ed8" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Appointment history</Text>
              <Text style={styles.rowSubtitle}>
                View Appointment History
              </Text>
            </View>
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            onPress={() => router.push('/(doctor)/update-password' as Href)}
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.85 : 1 }]}
          >
            <View style={styles.iconCircle}>
              <KeyRound size={20} color="#1d4ed8" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Update password</Text>
              <Text style={styles.rowSubtitle}>
                Change your account password with email verification
              </Text>
            </View>
          </Pressable>
        </Card>

        <Pressable onPress={handleLogout} style={styles.logoutBtn}>
          <LogOut size={18} color="#b91c1c" />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  menuCard: {
    padding: 4,
    borderRadius: 18,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowText: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 14,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  rowSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    lineHeight: 18,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    backgroundColor: '#fee2e2',
    borderWidth: 2,
    borderColor: '#fecaca',
    height: 50,
    borderRadius: 14,
  },
  logoutText: {
    color: '#b91c1c',
    fontSize: 15,
    fontWeight: '800',
  },
});
