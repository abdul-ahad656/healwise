import React from "react";
import { TextInput, View, Text, StyleSheet, TextInputProps, StyleProp, ViewStyle } from "react-native";

interface InputProps extends TextInputProps {
  error?: string;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({
  error,
  disabled = false,
  containerStyle,
  style,
  ...props
}: InputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        editable={!disabled}
        placeholderTextColor="#9CA3AF"
        style={[
          styles.input,
          disabled && styles.disabled,
          error && styles.inputError,
          style,
        ]}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%" },
  input: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#ffffff",
    color: "#111827",
  },
  disabled: {
    opacity: 0.5,
    backgroundColor: "#f9fafb",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  errorText: {
    marginTop: 4,
    fontSize: 14,
    color: "#ef4444",
  },
});