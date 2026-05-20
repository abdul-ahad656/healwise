import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/card';
import { AdminScreenHeader } from '@/components/admin/AdminScreenHeader';
import { AdminSelect } from '@/components/admin/AdminSelect';
import {
  getAdminHealthTips,
  createHealthTip,
  deactivateHealthTip,
  updateHealthTip,
  deleteHealthTip,
  AdminHealthTip,
} from '@/services/adminService';
import {
  AdminActionButton,
  adminActionsRowStyle,
  adminPrimaryButtonStyle,
  adminPrimaryButtonTextStyle,
} from '@/components/admin/AdminActionButton';
import { adminScreenStyles as s, PLACEHOLDER_COLOR } from '@/styles/adminScreen';

const TIP_TYPE_OPTIONS = [
  {
    value: 'general' as const,
    label: 'General',
    description: 'Health tips for all patients',
  },
  {
    value: 'disease' as const,
    label: 'Disease-specific',
    description: 'Tips tied to a specific disease or condition',
  },
];


export default function ManageHealthTipsScreen() {
  const router = useRouter();
  const [tips, setTips] = useState<AdminHealthTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'general' as 'general' | 'disease',
    disease: '',
    language: 'en' as 'en' | 'ur',
  });
  const [editingTipId, setEditingTipId] = useState<string | null>(null);

  const loadTips = async () => {
    try {
      const data = await getAdminHealthTips();
      setTips(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load health tips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTips();
  }, []);

  const handleSave = async () => {
    if (!form.title || !form.description) {
      Alert.alert('Validation', 'Title and description are required');
      return;
    }
    if (form.type === 'disease' && !form.disease.trim()) {
      Alert.alert('Validation', 'Enter a disease name for disease-specific tips');
      return;
    }

    setSaving(true);
    try {
      if (editingTipId) {
        await updateHealthTip(editingTipId, {
          title: form.title,
          description: form.description,
          type: form.type,
          disease: form.type === 'disease' ? form.disease : undefined,
          language: form.language,
        });
      } else {
        await createHealthTip({
          title: form.title,
          description: form.description,
          type: form.type,
          disease: form.type === 'disease' ? form.disease : undefined,
          language: form.language,
        });
      }
      setForm({
        title: '',
        description: '',
        type: 'general',
        disease: '',
        language: form.language,
      });
      setEditingTipId(null);
      await loadTips();
    } catch (err: any) {
      Alert.alert(
        'Error',
        err.message ||
          (editingTipId ? 'Failed to update health tip' : 'Failed to create health tip')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateHealthTip(id);
      await loadTips();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to deactivate tip');
    }
  };

  const handleEditTip = (tip: AdminHealthTip) => {
    setForm({
      title: tip.title,
      description: tip.description,
      type: tip.type,
      disease: tip.disease || '',
      language: (tip.language === 'ur' ? 'ur' : 'en') as 'en' | 'ur',
    });
    setEditingTipId(tip._id);
  };

  const handleDeleteTip = async (id: string) => {
    try {
      await deleteHealthTip(id);
      await loadTips();
      if (editingTipId === id) {
        setForm({
          title: '',
          description: '',
          type: 'general',
          disease: '',
          language: 'en',
        });
        setEditingTipId(null);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to delete tip');
    }
  };

  return (
    <View style={s.container}>
      <View style={[StyleSheet.absoluteFill, s.pageBg]} />

      <AdminScreenHeader
        title="Manage Health Tips"
        subtitle="Publish and deactivate health tips"
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
            {editingTipId ? 'Edit Health Tip' : 'Create Health Tip'}
          </Text>

          <View style={s.fieldSpacing}>
            <Text style={s.fieldLabel}>Title</Text>
            <TextInput
              style={s.input}
              placeholder="Tip title"
              placeholderTextColor={PLACEHOLDER_COLOR}
              value={form.title}
              onChangeText={(text) => setForm((f) => ({ ...f, title: text }))}
            />
          </View>

          <View style={s.fieldSpacing}>
            <Text style={s.fieldLabel}>Description</Text>
            <TextInput
              style={[s.input, s.inputMultiline]}
              placeholder="Full description for patients"
              placeholderTextColor={PLACEHOLDER_COLOR}
              value={form.description}
              onChangeText={(text) =>
                setForm((f) => ({ ...f, description: text }))
              }
              multiline
            />
          </View>

          <AdminSelect
            label="Tip type"
            value={form.type}
            options={TIP_TYPE_OPTIONS}
            placeholder="Choose General or Disease-specific"
            onChange={(type) =>
              setForm((f) => ({
                ...f,
                type,
                disease: type === 'general' ? '' : f.disease,
              }))
            }
          />

          {form.type === 'disease' ? (
            <View style={s.fieldSpacing}>
              <Text style={s.fieldLabel}>Disease name</Text>
              <TextInput
                style={s.input}
                placeholder="e.g. Diabetes, Hypertension"
                placeholderTextColor={PLACEHOLDER_COLOR}
                value={form.disease}
                onChangeText={(text) =>
                  setForm((f) => ({ ...f, disease: text }))
                }
              />
            </View>
          ) : null}


          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={[adminPrimaryButtonStyle, { opacity: saving ? 0.6 : 1 }]}
          >
            <Text style={adminPrimaryButtonTextStyle}>
              {saving
                ? 'Saving...'
                : editingTipId
                ? 'Update Tip'
                : 'Publish Tip'}
            </Text>
          </Pressable>
        </Card>

        <Text style={s.listSectionTitle}>Existing Tips</Text>
        {loading ? (
          <Text style={s.infoText}>Loading tips...</Text>
        ) : error ? (
          <Text style={s.errorText}>{error}</Text>
        ) : tips.length === 0 ? (
          <Text style={s.infoText}>No tips found.</Text>
        ) : (
          tips.map((tip) => (
            <Card key={tip._id} style={s.listCard}>
              <Text style={s.listCardTitle}>{tip.title}</Text>
              <Text style={s.listCardMeta}>
                Type:{' '}
                {tip.type === 'general'
                  ? 'General'
                  : `Disease – ${tip.disease || 'N/A'}`}
              </Text>
              <Text style={s.listCardMeta}>
                Language: {tip.language === 'ur' ? 'Urdu' : 'English'}
              </Text>
              <Text style={s.listCardMeta}>
                Status: {tip.active ? 'Active' : 'Inactive'}
              </Text>
              <View style={adminActionsRowStyle}>
                <AdminActionButton
                  variant="edit"
                  onPress={() => handleEditTip(tip)}
                />
                {tip.active ? (
                  <AdminActionButton
                    variant="deactivate"
                    onPress={() => handleDeactivate(tip._id)}
                  />
                ) : (
                  <AdminActionButton variant="inactive" />
                )}
                <AdminActionButton
                  variant="delete"
                  onPress={() => handleDeleteTip(tip._id)}
                />
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}
