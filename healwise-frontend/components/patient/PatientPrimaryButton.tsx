import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import {
  patientButtonBase,
  patientButtonLabel,
  patientButtonVariants,
} from '@/styles/patientScreen';

export type PatientButtonVariant = keyof typeof patientButtonVariants;

type Props = {
  label: string;
  onPress?: () => void;
  variant?: PatientButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
};

export function PatientPrimaryButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  fullWidth = true,
}: Props) {
  const v = patientButtonVariants[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
      style={[
        patientButtonBase,
        v.box,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[patientButtonLabel, v.label]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.55 },
});
