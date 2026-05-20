import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/card';
import { AdminScreenHeader } from '@/components/admin/AdminScreenHeader';
import { adminScreenStyles as s, PLACEHOLDER_COLOR } from '@/styles/adminScreen';
import {
  getAdminDoctors,
  toggleDoctorStatus,
  createAdminDoctor,
  updateAdminDoctor,
  deleteAdminDoctor,
  AdminDoctor,
  CreateDoctorPayload,
} from '@/services/adminService';
import {
  AdminActionButton,
  adminActionsRowStyle,
  adminPrimaryButtonStyle,
  adminPrimaryButtonTextStyle,
} from '@/components/admin/AdminActionButton';

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={s.fieldSpacing}>
      <Text style={s.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

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
    <View style={s.container}>
      <View style={[StyleSheet.absoluteFill, s.pageBg]} />

      <AdminScreenHeader
        title="Manage Doctors"
        subtitle="Create and control doctor accounts"
        onBack={() => router.back()}
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={s.formCard}>
          <Text style={s.formSectionTitle}>
            {editingDoctorId ? 'Edit Doctor' : 'Create Doctor'}
          </Text>

          <Field label="Full name">
            <TextInput
              style={s.input}
              placeholder="Full name"
              placeholderTextColor={PLACEHOLDER_COLOR}
              value={form.name}
              onChangeText={(text) => setForm((f) => ({ ...f, name: text }))}
            />
          </Field>
          <Field label="Email">
            <TextInput
              style={s.input}
              placeholder="Email address"
              placeholderTextColor={PLACEHOLDER_COLOR}
              autoCapitalize="none"
              keyboardType="email-address"
              value={form.email}
              onChangeText={(text) => setForm((f) => ({ ...f, email: text }))}
            />
          </Field>
          <Field label="Password">
            <TextInput
              style={s.input}
              placeholder={
                editingDoctorId ? 'New password (optional)' : 'Password'
              }
              placeholderTextColor={PLACEHOLDER_COLOR}
              secureTextEntry
              value={form.password}
              onChangeText={(text) =>
                setForm((f) => ({ ...f, password: text }))
              }
            />
          </Field>
          <Field label="Language">
            <TextInput
              style={s.input}
              placeholder="en or ur"
              placeholderTextColor={PLACEHOLDER_COLOR}
              value={form.language}
              onChangeText={(text) =>
                setForm((f) => ({ ...f, language: text }))
              }
            />
          </Field>
          <Field label="Specialization">
            <TextInput
              style={s.input}
              placeholder="e.g. Cardiologist"
              placeholderTextColor={PLACEHOLDER_COLOR}
              value={form.specialization}
              onChangeText={(text) =>
                setForm((f) => ({ ...f, specialization: text }))
              }
            />
          </Field>
          <Field label="Experience">
            <TextInput
              style={s.input}
              placeholder="Years of experience"
              placeholderTextColor={PLACEHOLDER_COLOR}
              value={form.experience}
              onChangeText={(text) =>
                setForm((f) => ({ ...f, experience: text }))
              }
            />
          </Field>
          <Field label="Hospital / clinic">
            <TextInput
              style={s.input}
              placeholder="Hospital or clinic name"
              placeholderTextColor={PLACEHOLDER_COLOR}
              value={form.hospital}
              onChangeText={(text) =>
                setForm((f) => ({ ...f, hospital: text }))
              }
            />
          </Field>
          <Field label="Consultation fee (PKR)">
            <TextInput
              style={s.input}
              placeholder="Consultation fee"
              placeholderTextColor={PLACEHOLDER_COLOR}
              keyboardType="numeric"
              value={form.consultationFee ? String(form.consultationFee) : ''}
              onChangeText={(text) =>
                setForm((f) => ({
                  ...f,
                  consultationFee: text ? Number(text) : undefined,
                }))
              }
            />
          </Field>

          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={[adminPrimaryButtonStyle, { opacity: saving ? 0.6 : 1 }]}
          >
            <Text style={adminPrimaryButtonTextStyle}>
              {saving
                ? 'Saving...'
                : editingDoctorId
                ? 'Update Doctor'
                : 'Create Doctor'}
            </Text>
          </Pressable>
        </Card>

        <Text style={s.listSectionTitle}>Existing Doctors</Text>
        {loading ? (
          <Text style={s.infoText}>Loading doctors...</Text>
        ) : error ? (
          <Text style={s.errorText}>{error}</Text>
        ) : doctors.length === 0 ? (
          <Text style={s.infoText}>No doctors found.</Text>
        ) : (
          doctors.map((d) => (
            <Card key={d._id} style={s.listCard}>
              <Text style={s.listCardTitle}>{d.name}</Text>
              <Text style={s.listCardMeta}>{d.email}</Text>
              <Text style={s.listCardMeta}>
                {d.specialization || 'Specialization not set'}
              </Text>
              <Text style={s.listCardMeta}>
                Status: {d.active === false ? 'Inactive' : 'Active'}
              </Text>
              <View style={adminActionsRowStyle}>
                <AdminActionButton
                  variant={d.active === false ? 'enable' : 'disable'}
                  onPress={() => handleToggleStatus(d._id)}
                />
                <AdminActionButton
                  variant="edit"
                  onPress={() => handleEditDoctor(d)}
                />
                <AdminActionButton
                  variant="delete"
                  onPress={() => handleDeleteDoctor(d._id)}
                />
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}
