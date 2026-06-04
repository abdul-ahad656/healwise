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
  MedicineTypePayload,
  MedicineTypeRecord,
  saveMedicineTypeAwareness,
  getAllMedicineAwareness,
  deleteMedicineAwareness,
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

const EMPTY_PAYLOAD: MedicineTypePayload = {
  medicine_type: '',
  description: '',
  common_uses: '',
  how_to_use: '',
  precautions: '',
  side_effects: '',
  warnings: '',
  otc: false,
};

export default function ManageMedicineScreen() {
  const router = useRouter();
  const [payload, setPayload] = useState<MedicineTypePayload>(EMPTY_PAYLOAD);
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

    const isUpdate = editingType !== null;

    setSaving(true);
    try {
      await saveMedicineTypeAwareness(payload);
      Alert.alert(
        'Success',
        isUpdate ? 'Medicine awareness updated' : 'Medicine awareness saved'
      );
      if (isUpdate) {
        setEditingType(payload.medicine_type.trim());
      } else {
        setEditingType(null);
        setPayload({ ...EMPTY_PAYLOAD });
      }
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
      if (editingType === medicineType) {
        setEditingType(null);
        setPayload({ ...EMPTY_PAYLOAD });
      }
      await loadItems();
    } catch (err: any) {
      Alert.alert(
        'Error',
        err.message || 'Failed to delete medicine awareness'
      );
    }
  };

  return (
    <View style={s.container}>
      <View style={[StyleSheet.absoluteFill, s.pageBg]} />

      <AdminScreenHeader
        title="Medicine Awareness"
        subtitle="Create or update content for a medicine type"
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
            {editingType ? 'Edit content' : 'New medicine type'}
          </Text>

          <Field label="Medicine type">
            <TextInput
              style={s.input}
              placeholder="e.g. antibiotic, steroid, painkiller"
              placeholderTextColor={PLACEHOLDER_COLOR}
              value={payload.medicine_type}
              onChangeText={(text) =>
                setPayload((p) => ({ ...p, medicine_type: text }))
              }
            />
          </Field>

          <Field label="Short description">
            <TextInput
              style={[s.input, s.inputMultiline]}
              placeholder="Short overview for this medicine type"
              placeholderTextColor={PLACEHOLDER_COLOR}
              value={payload.description}
              onChangeText={(text) =>
                setPayload((p) => ({ ...p, description: text }))
              }
              multiline
            />
          </Field>

          <Field label="Common uses">
            <TextInput
              style={[s.input, s.inputMultiline]}
              placeholder="Common uses (one point per line)"
              placeholderTextColor={PLACEHOLDER_COLOR}
              value={payload.common_uses}
              onChangeText={(text) =>
                setPayload((p) => ({ ...p, common_uses: text }))
              }
              multiline
            />
          </Field>

          <Field label="How to use">
            <TextInput
              style={[s.input, s.inputMultiline]}
              placeholder="How to use safely"
              placeholderTextColor={PLACEHOLDER_COLOR}
              value={payload.how_to_use}
              onChangeText={(text) =>
                setPayload((p) => ({ ...p, how_to_use: text }))
              }
              multiline
            />
          </Field>

          <Field label="Precautions">
            <TextInput
              style={[s.input, s.inputMultiline]}
              placeholder="Precautions and warnings"
              placeholderTextColor={PLACEHOLDER_COLOR}
              value={payload.precautions}
              onChangeText={(text) =>
                setPayload((p) => ({ ...p, precautions: text }))
              }
              multiline
            />
          </Field>

          <Field label="Side effects">
            <TextInput
              style={[s.input, s.inputMultiline]}
              placeholder="Possible side effects"
              placeholderTextColor={PLACEHOLDER_COLOR}
              value={payload.side_effects}
              onChangeText={(text) =>
                setPayload((p) => ({ ...p, side_effects: text }))
              }
              multiline
            />
          </Field>

          <Field label="Warnings">
            <TextInput
              style={[s.input, s.inputMultiline]}
              placeholder="Important warnings for patients"
              placeholderTextColor={PLACEHOLDER_COLOR}
              value={payload.warnings}
              onChangeText={(text) =>
                setPayload((p) => ({ ...p, warnings: text }))
              }
              multiline
            />
          </Field>

          <View style={local.checkboxRow}>
            <Pressable
              onPress={() => setPayload((p) => ({ ...p, otc: !p.otc }))}
              style={({ pressed }) => [
                local.checkbox,
                payload.otc && local.checkboxChecked,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <View
                style={[
                  local.checkboxInner,
                  payload.otc && local.checkboxInnerChecked,
                ]}
              />
            </Pressable>
            <Text style={local.checkboxLabel}>Available over the counter</Text>
          </View>

          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={[adminPrimaryButtonStyle, { opacity: saving ? 0.6 : 1 }]}
          >
            <Text style={adminPrimaryButtonTextStyle}>
              {saving
                ? 'Saving...'
                : editingType
                ? 'Update Content'
                : 'Save Content'}
            </Text>
          </Pressable>
        </Card>

        <Text style={s.listSectionTitle}>Existing Medicine Awareness</Text>
        {loading ? (
          <Text style={s.infoText}>Loading medicine awareness...</Text>
        ) : error ? (
          <Text style={s.errorText}>{error}</Text>
        ) : items.length === 0 ? (
          <Text style={s.infoText}>No medicine awareness found.</Text>
        ) : (
          items.map((item) => (
            <Card key={item._id} style={s.listCard}>
              <Text style={s.listCardTitle}>{item.medicine_type}</Text>
              <Text style={s.listCardMeta} numberOfLines={3}>
                {item.description}
              </Text>
              <View style={adminActionsRowStyle}>
                <AdminActionButton
                  variant="edit"
                  onPress={() => handleEdit(item)}
                />
                <AdminActionButton
                  variant="delete"
                  onPress={() => handleDelete(item.medicine_type)}
                />
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const local = StyleSheet.create({
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    marginTop: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    borderColor: '#16a34a',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: 'transparent',
  },
  checkboxInnerChecked: {
    backgroundColor: '#16a34a',
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
});
