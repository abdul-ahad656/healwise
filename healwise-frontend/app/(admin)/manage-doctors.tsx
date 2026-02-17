import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft } from 'lucide-react-native';
import { Card } from '@/components/ui/card';
import {
  getAdminDoctors,
  toggleDoctorStatus,
  createAdminDoctor,
  updateAdminDoctor,
  deleteAdminDoctor,
  AdminDoctor,
  CreateDoctorPayload,
} from '@/services/adminService';

export default function ManageDoctorsScreen() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<AdminDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateDoctorPayload>({
    name: '',
    email: '',
    password: '',
    language: 'en',
    specialization: '',
    experience: '',
    hospital: '',
    consultationFee: undefined,
  });
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);

  const loadDoctors = async () => {
    try {
      const data = await getAdminDoctors();
      setDoctors(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const handleToggleStatus = async (id: string) => {
    try {
      const active = await toggleDoctorStatus(id);
      setDoctors((prev) =>
        prev.map((d) => (d._id === id ? { ...d, active } : d))
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update doctor status');
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.email || (!editingDoctorId && !form.password)) {
      Alert.alert(
        'Validation',
        'Name and email are required. Password is required for new doctors'
      );
      return;
    }

    setSaving(true);
    try {
      if (editingDoctorId) {
        const updatePayload: Partial<CreateDoctorPayload> = {
          name: form.name,
          email: form.email,
          language: form.language,
          specialization: form.specialization || undefined,
          experience: form.experience || undefined,
          hospital: form.hospital || undefined,
          consultationFee: form.consultationFee
            ? Number(form.consultationFee)
            : undefined,
        };

        if (form.password) {
          updatePayload.password = form.password;
        }

        const updated = await updateAdminDoctor(
          editingDoctorId,
          updatePayload
        );

        setDoctors((prev) =>
          prev.map((d) => (d._id === editingDoctorId ? updated : d))
        );
      } else {
        const payload: CreateDoctorPayload = {
          ...form,
          consultationFee: form.consultationFee
            ? Number(form.consultationFee)
            : undefined,
        };
        await createAdminDoctor(payload);
        await loadDoctors();
      }

      setForm({
        name: '',
        email: '',
        password: '',
        language: 'en',
        specialization: '',
        experience: '',
        hospital: '',
        consultationFee: undefined,
      });
      setEditingDoctorId(null);
    } catch (err: any) {
      Alert.alert(
        'Error',
        err.message ||
          (editingDoctorId ? 'Failed to update doctor' : 'Failed to create doctor')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEditDoctor = (doctor: AdminDoctor) => {
    setForm({
      name: doctor.name,
      email: doctor.email,
      password: '',
      language: doctor.language || 'en',
      specialization: doctor.specialization || '',
      experience: doctor.experience || '',
      hospital: doctor.hospital || '',
      consultationFee: doctor.consultationFee,
    });
    setEditingDoctorId(doctor._id);
  };

  const handleDeleteDoctor = async (id: string) => {
    try {
      await deleteAdminDoctor(id);
      setDoctors((prev) => prev.filter((d) => d._id !== id));
      if (editingDoctorId === id) {
        setForm({
          name: '',
          email: '',
          password: '',
          language: 'en',
          specialization: '',
          experience: '',
          hospital: '',
          consultationFee: undefined,
        });
        setEditingDoctorId(null);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to delete doctor');
    }
  };

  return (
    <View style={styles.container}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#f9fafb' }]} />

      <LinearGradient
        colors={['#0f766e', '#22c55e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <ArrowLeft size={20} color="#ffffff" />
            </Pressable>
            <View>
              <Text style={styles.headerTitle}>Manage Doctors</Text>
              <Text style={styles.headerSubtitle}>
                Create and control doctor accounts
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Create Doctor</Text>
          <View style={styles.row}>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={form.name}
              onChangeText={(text) => setForm((f) => ({ ...f, name: text }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={form.email}
              onChangeText={(text) => setForm((f) => ({ ...f, email: text }))}
            />
          </View>
          <View style={styles.row}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={form.password}
              onChangeText={(text) =>
                setForm((f) => ({ ...f, password: text }))
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Language (en/ur)"
              value={form.language}
              onChangeText={(text) =>
                setForm((f) => ({ ...f, language: text }))
              }
            />
          </View>
          <View style={styles.row}>
            <TextInput
              style={styles.input}
              placeholder="Specialization"
              value={form.specialization}
              onChangeText={(text) =>
                setForm((f) => ({ ...f, specialization: text }))
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Experience"
              value={form.experience}
              onChangeText={(text) =>
                setForm((f) => ({ ...f, experience: text }))
              }
            />
          </View>
          <View style={styles.row}>
            <TextInput
              style={styles.input}
              placeholder="Hospital"
              value={form.hospital}
              onChangeText={(text) =>
                setForm((f) => ({ ...f, hospital: text }))
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Consultation Fee"
              keyboardType="numeric"
              value={
                form.consultationFee ? String(form.consultationFee) : ''
              }
              onChangeText={(text) =>
                setForm((f) => ({
                  ...f,
                  consultationFee: text ? Number(text) : undefined,
                }))
              }
            />
          </View>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [
              styles.primaryBtn,
              { opacity: saving ? 0.6 : pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.primaryBtnText}>
              {saving
                ? 'Saving...'
                : editingDoctorId
                ? 'Update Doctor'
                : 'Create Doctor'}
            </Text>
          </Pressable>
        </Card>

        <Text style={styles.sectionTitle}>Existing Doctors</Text>
        {loading ? (
          <Text style={styles.infoText}>Loading doctors...</Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : doctors.length === 0 ? (
          <Text style={styles.infoText}>No doctors found.</Text>
        ) : (
          doctors.map((d) => (
            <Card key={d._id} style={styles.doctorCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.doctorName}>{d.name}</Text>
                <Text style={styles.doctorMeta}>{d.email}</Text>
                <Text style={styles.doctorMeta}>
                  {d.specialization || 'Specialization not set'}
                </Text>
                <Text style={styles.doctorMeta}>
                  Status: {d.active === false ? 'Inactive' : 'Active'}
                </Text>
              </View>
              <View style={styles.actionsColumn}>
                <Pressable
                  onPress={() => handleToggleStatus(d._id)}
                  style={({ pressed }) => [
                    styles.statusBtn,
                    d.active === false
                      ? styles.statusEnable
                      : styles.statusDisable,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Text style={styles.statusBtnText}>
                    {d.active === false ? 'Enable' : 'Disable'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleEditDoctor(d)}
                  style={({ pressed }) => [
                    styles.editBtn,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Text style={styles.editBtnText}>Edit</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleDeleteDoctor(d._id)}
                  style={({ pressed }) => [
                    styles.deleteBtn,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </Pressable>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  scroll: { flex: 1, marginTop: -16 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 32 },
  formCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    backgroundColor: '#ffffff',
  },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: '#0f766e',
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  infoText: { fontSize: 13, color: '#6b7280' },
  errorText: { fontSize: 13, color: '#b91c1c' },
  doctorCard: {
    marginTop: 8,
    padding: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  doctorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  doctorMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusEnable: {
    backgroundColor: '#22c55e',
  },
  statusDisable: {
    backgroundColor: '#ef4444',
  },
  statusBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  actionsColumn: {
    alignItems: 'flex-end',
    gap: 6,
  },
  editBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#3b82f6',
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  deleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#ef4444',
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
});
