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
  getAdminHealthTips,
  createHealthTip,
  deactivateHealthTip,
  updateHealthTip,
  deleteHealthTip,
  AdminHealthTip,
} from '@/services/adminService';

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
    language: 'en',
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
      language: tip.language,
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
              <Text style={styles.headerTitle}>Manage Health Tips</Text>
              <Text style={styles.headerSubtitle}>
                Publish and deactivate health tips
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
          <Text style={styles.sectionTitle}>Create Health Tip</Text>
          <TextInput
            style={styles.input}
            placeholder="Title"
            value={form.title}
            onChangeText={(text) => setForm((f) => ({ ...f, title: text }))}
          />
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Description"
            value={form.description}
            onChangeText={(text) =>
              setForm((f) => ({ ...f, description: text }))
            }
            multiline
          />
          <View style={styles.row}>
            <Pressable
              onPress={() =>
                setForm((f) => ({ ...f, type: 'general', disease: '' }))
              }
              style={({ pressed }) => [
                styles.chip,
                form.type === 'general' && styles.chipActive,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  form.type === 'general' && styles.chipTextActive,
                ]}
              >
                General
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setForm((f) => ({ ...f, type: 'disease' }))}
              style={({ pressed }) => [
                styles.chip,
                form.type === 'disease' && styles.chipActive,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  form.type === 'disease' && styles.chipTextActive,
                ]}
              >
                Disease-specific
              </Text>
            </Pressable>
          </View>
          {form.type === 'disease' && (
            <TextInput
              style={styles.input}
              placeholder="Disease name"
              value={form.disease}
              onChangeText={(text) =>
                setForm((f) => ({ ...f, disease: text }))
              }
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="Language (en/ur)"
            value={form.language}
            onChangeText={(text) =>
              setForm((f) => ({ ...f, language: text }))
            }
          />
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
                : editingTipId
                ? 'Update Tip'
                : 'Publish Tip'}
            </Text>
          </Pressable>
        </Card>

        <Text style={styles.sectionTitle}>Existing Tips</Text>
        {loading ? (
          <Text style={styles.infoText}>Loading tips...</Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : tips.length === 0 ? (
          <Text style={styles.infoText}>No tips found.</Text>
        ) : (
          tips.map((tip) => (
            <Card key={tip._id} style={styles.tipCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipMeta}>
                  Type:{' '}
                  {tip.type === 'general'
                    ? 'General'
                    : `Disease – ${tip.disease || 'N/A'}`}
                </Text>
                <Text style={styles.tipMeta}>
                  Status: {tip.active ? 'Active' : 'Inactive'}
                </Text>
              </View>
              <View style={styles.tipActions}>
                <Pressable
                  onPress={() => handleEditTip(tip)}
                  style={({ pressed }) => [
                    styles.editBtn,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Text style={styles.editText}>Edit</Text>
                </Pressable>
                {tip.active && (
                  <Pressable
                    onPress={() => handleDeactivate(tip._id)}
                    style={({ pressed }) => [
                      styles.deactivateBtn,
                      { opacity: pressed ? 0.85 : 1 },
                    ]}
                  >
                    <Text style={styles.deactivateText}>Deactivate</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => handleDeleteTip(tip._id)}
                  style={({ pressed }) => [
                    styles.deleteBtn,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Text style={styles.deleteText}>Delete</Text>
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
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    backgroundColor: '#ffffff',
    marginTop: 6,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  chipActive: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e',
  },
  chipText: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  primaryBtn: {
    marginTop: 10,
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
  infoText: {
    fontSize: 13,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 13,
    color: '#b91c1c',
  },
  tipCard: {
    marginTop: 8,
    padding: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  tipMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  tipActions: {
    alignItems: 'flex-end',
    gap: 6,
  },
  editBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#3b82f6',
  },
  editText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  deactivateBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#ef4444',
  },
  deactivateText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  deleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#b91c1c',
  },
  deleteText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
});
