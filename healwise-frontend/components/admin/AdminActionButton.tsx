import React from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {
  Pencil,
  Trash2,
  UserCheck,
  UserX,
  CircleOff,
  Ban,
  type LucideIcon,
} from 'lucide-react-native';

export type AdminActionVariant =
  | 'edit'
  | 'delete'
  | 'enable'
  | 'disable'
  | 'deactivate'
  | 'inactive';

type Props = {
  variant: AdminActionVariant;
  onPress?: () => void;
  /** Screen reader label; defaults from variant if omitted */
  accessibilityLabel?: string;
};

const ICON_SIZE = 22;

const defaultLabels: Record<AdminActionVariant, string> = {
  edit: 'Edit',
  delete: 'Delete',
  enable: 'Enable',
  disable: 'Disable',
  deactivate: 'Deactivate',
  inactive: 'Inactive',
};

const buttonByVariant: Record<AdminActionVariant, ViewStyle> = {
  edit: { backgroundColor: '#dbeafe', borderColor: '#1d4ed8' },
  delete: { backgroundColor: '#fee2e2', borderColor: '#b91c1c' },
  enable: { backgroundColor: '#dcfce7', borderColor: '#15803d' },
  disable: { backgroundColor: '#ffedd5', borderColor: '#c2410c' },
  deactivate: { backgroundColor: '#fed7aa', borderColor: '#9a3412' },
  inactive: { backgroundColor: '#f3f4f6', borderColor: '#4b5563' },
};

const iconColorByVariant: Record<AdminActionVariant, string> = {
  edit: '#1d4ed8',
  delete: '#b91c1c',
  enable: '#15803d',
  disable: '#c2410c',
  deactivate: '#9a3412',
  inactive: '#6b7280',
};

const iconByVariant: Record<AdminActionVariant, LucideIcon> = {
  edit: Pencil,
  delete: Trash2,
  enable: UserCheck,
  disable: UserX,
  deactivate: CircleOff,
  inactive: Ban,
};

export function AdminActionButton({
  variant,
  onPress,
  accessibilityLabel,
}: Props) {
  const boxStyle = [styles.button, buttonByVariant[variant]];
  const color = iconColorByVariant[variant];
  const Icon = iconByVariant[variant];
  const a11y = accessibilityLabel ?? defaultLabels[variant];

  const content = <Icon size={ICON_SIZE} color={color} strokeWidth={2.5} />;

  if (variant === 'inactive') {
    return (
      <View style={boxStyle} accessibilityLabel={a11y} accessibilityRole="text">
        {content}
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={boxStyle}
      accessibilityLabel={a11y}
      accessibilityRole="button"
    >
      {content}
    </TouchableOpacity>
  );
}

export const adminActionsRowStyle: ViewStyle = {
  flexDirection: 'row-reverse',
  flexWrap: 'wrap',
  alignItems: 'center',
  marginTop: 14,
  paddingTop: 14,
  borderTopWidth: 2,
  borderTopColor: '#9ca3af',
  width: '100%',
};

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginBottom: 10,
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

export const adminPrimaryButtonStyle: ViewStyle = {
  marginTop: 16,
  backgroundColor: '#047857',
  borderWidth: 2,
  borderColor: '#064e3b',
  paddingVertical: 14,
  borderRadius: 12,
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 50,
  elevation: 4,
};

export const adminPrimaryButtonTextStyle: TextStyle = {
  color: '#ffffff',
  fontSize: 16,
  fontWeight: '900',
};
