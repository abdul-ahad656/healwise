import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import {
  doctorButtonBase,
  doctorButtonLabel,
  doctorButtonVariants,
} from '@/styles/doctorScreen';

export type DoctorButtonVariant = keyof typeof doctorButtonVariants;

type Props = {
  label: string;
  onPress?: () => void;
  variant?: DoctorButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
};

export function DoctorPrimaryButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  fullWidth = true,
}: Props) {
  const v = doctorButtonVariants[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
      style={[
        doctorButtonBase,
        v.box,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[doctorButtonLabel, v.label]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.55 },
});
