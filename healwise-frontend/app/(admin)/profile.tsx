import React, { useMemo } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { CheckCircle, ChevronRight } from 'lucide-react-native';
import { AdminScreenHeader } from '@/components/admin/AdminScreenHeader';
import { adminScreenStyles as s } from '@/styles/adminScreen';
import AuthStore from '@/services/authStore';

export default function AdminProfileScreen() {
  const router = useRouter();
  const user = AuthStore.getUser();

  const handleLogout = () => {
    AuthStore.clear();
    router.replace('/(auth)/login');
  };

  const name = useMemo(() => user?.name || 'Admin', [user]);
  const email = useMemo(() => user?.email || '', [user]);

  return (
    <View style={s.container}>
      <View style={[StyleSheet.absoluteFill, s.pageBg]} />

      <AdminScreenHeader
        title="Profile"
        subtitle="Admin account settings"
        onBack={() => router.navigate('/(admin)/dashboard' as Href)}
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.name}>{name}</Text>
        {email ? <Text style={styles.email}>{email}</Text> : null}

        <Text style={styles.sectionLabel}>History</Text>

        <Pressable
          onPress={() =>
            router.push('/(admin)/payment-approved-history' as Href)
          }
          style={({ pressed }) => [
            styles.menuRow,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#ecfdf5' }]}>
            <CheckCircle size={22} color="#047857" />
          </View>
          <View style={styles.menuText}>
            <Text style={styles.menuTitle} numberOfLines={1}>
              Approved payment history
            </Text>
            <Text style={styles.menuSubtitle} numberOfLines={2}>
              View Easypaisa payments you have confirmed
            </Text>
          </View>
          <View style={styles.chevronWrap}>
            <ChevronRight size={20} color="#9ca3af" />
          </View>
        </Pressable>

        <Pressable onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 4 },
  email: { fontSize: 14, color: '#6b7280', marginTop: 4, marginBottom: 20 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginRight: 14,
  },
  menuText: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    paddingRight: 8,
  },
  chevronWrap: {
    flexShrink: 0,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  logoutBtn: {
    marginTop: 4,
    backgroundColor: '#fee2e2',
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutText: { color: '#b91c1c', fontSize: 14, fontWeight: '800' },
});
