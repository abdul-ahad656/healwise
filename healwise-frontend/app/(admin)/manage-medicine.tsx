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
import { Button } from '@/components/ui/button';
import {
  MedicineTypePayload,
  MedicineTypeRecord,
  saveMedicineTypeAwareness,
  getAllMedicineAwareness,
  deleteMedicineAwareness,
} from '@/services/adminService';

export default function ManageMedicineScreen() {
  const router = useRouter();
  const [payload, setPayload] = useState<MedicineTypePayload>({
    medicine_type: '',
    description: '',
    common_uses: '',
    how_to_use: '',
    precautions: '',
    side_effects: '',
    warnings: '',
    otc: false,
  });
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<MedicineTypeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<string | null>(null);

  const loadItems = async () => {
    try {
      const data = await getAllMedicineAwareness();
      setItems(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load medicine awareness');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleSave = async () => {
    if (!payload.medicine_type || !payload.description) {
      Alert.alert(
        'Validation',
        'Medicine type and description are required'
      );
      return;
    }

    setSaving(true);
    try {
      await saveMedicineTypeAwareness(payload);
      Alert.alert(
        'Success',
        editingType ? 'Medicine awareness updated' : 'Medicine awareness saved'
      );
      setEditingType(payload.medicine_type);
      await loadItems();
    } catch (err: any) {
      Alert.alert(
        'Error',
        err.message || 'Failed to save medicine awareness'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: MedicineTypeRecord) => {
    setPayload({
      medicine_type: item.medicine_type,
      description: item.description,
      common_uses: item.common_uses || '',
      how_to_use: item.how_to_use || '',
      precautions: item.precautions || '',
      side_effects: item.side_effects || '',
      warnings: item.warnings || '',
      otc: !!item.otc,
    });
    setEditingType(item.medicine_type);
  };

  const handleDelete = async (medicineType: string) => {
    try {
      await deleteMedicineAwareness(medicineType);
      await loadItems();
    } catch (err: any) {
      Alert.alert(
        'Error',
        err.message || 'Failed to delete medicine awareness'
      );
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
              <Text style={styles.headerTitle}>Medicine Awareness</Text>
              <Text style={styles.headerSubtitle}>
                Create or update content for a medicine type
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
        <Card style={styles.card}>
          <Text style={styles.label}>Medicine Type</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Antibiotic"
            value={payload.medicine_type}
            onChangeText={(text) =>
              setPayload((p) => ({ ...p, medicine_type: text }))
            }
          />

          <Text style={styles.label}>Short Description</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Overview for this medicine type"
            value={payload.description}
            onChangeText={(text) =>
              setPayload((p) => ({ ...p, description: text }))
            }
            multiline
          />

          <Text style={styles.label}>Common Uses</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Separate points with full stops"
            value={payload.common_uses}
            onChangeText={(text) =>
              setPayload((p) => ({ ...p, common_uses: text }))
            }
            multiline
          />

          <Text style={styles.label}>How To Use</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Usage guidance"
            value={payload.how_to_use}
            onChangeText={(text) =>
              setPayload((p) => ({ ...p, how_to_use: text }))
            }
            multiline
          />

          <Text style={styles.label}>Precautions</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Important precautions"
            value={payload.precautions}
            onChangeText={(text) =>
              setPayload((p) => ({ ...p, precautions: text }))
            }
            multiline
          />

          <Text style={styles.label}>Side Effects</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Common side effects"
            value={payload.side_effects}
            onChangeText={(text) =>
              setPayload((p) => ({ ...p, side_effects: text }))
            }
            multiline
          />

          <Text style={styles.label}>Warnings</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Important warnings"
            value={payload.warnings}
            onChangeText={(text) =>
              setPayload((p) => ({ ...p, warnings: text }))
            }
            multiline
          />

          <View style={styles.row}>
            <Pressable
              onPress={() =>
                setPayload((p) => ({ ...p, otc: !p.otc }))
              }
              style={({ pressed }) => [
                styles.checkbox,
                payload.otc && styles.checkboxChecked,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <View
                style={[
                  styles.checkboxInner,
                  payload.otc && styles.checkboxInnerChecked,
                ]}
              />
            </Pressable>
            <Text style={styles.checkboxLabel}>Available over the counter</Text>
          </View>

          <Button
            title={
              saving
                ? 'Saving...'
                : editingType
                ? 'Update Content'
                : 'Save Content'
            }
            onPress={handleSave}
            disabled={saving}
            style={styles.saveBtn}
          />
        </Card>

        <Text style={styles.sectionTitle}>Existing Medicine Awareness</Text>
        {loading ? (
          <Text style={styles.infoText}>Loading medicine awareness...</Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : items.length === 0 ? (
          <Text style={styles.infoText}>No medicine awareness found.</Text>
        ) : (
          items.map((item) => (
            <Card key={item._id} style={styles.itemCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{item.medicine_type}</Text>
                <Text style={styles.itemMeta} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
              <View style={styles.actionsRow}>
                <Pressable
                  onPress={() => handleEdit(item)}
                  style={({ pressed }) => [
                    styles.editBtn,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Text style={styles.editText}>Edit</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleDelete(item.medicine_type)}
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
  card: {
    padding: 16,
    borderRadius: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    backgroundColor: '#ffffff',
  },
  multiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    borderColor: '#16a34a',
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 3,
    backgroundColor: 'transparent',
  },
  checkboxInnerChecked: {
    backgroundColor: '#16a34a',
  },
  checkboxLabel: {
    fontSize: 13,
    color: '#111827',
  },
  saveBtn: {
    marginTop: 16,
    borderRadius: 999,
    backgroundColor: '#0f766e',
  },
  infoText: {
    fontSize: 13,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 13,
    color: '#b91c1c',
  },
  itemCard: {
    marginTop: 8,
    padding: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  itemMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
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
  deleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#ef4444',
  },
  deleteText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
});
