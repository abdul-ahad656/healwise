import React from "react";
import { 
  Pressable, 
  Text, 
  ActivityIndicator, 
  StyleSheet, 
  ViewStyle, 
  TextStyle, 
  StyleProp 
} from "react-native";

type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
type ButtonSize = "default" | "sm" | "lg" | "icon";

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  onPress,
  variant = "default",
  size = "default",
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }: { pressed: boolean }) => [
        styles.base,
        variantStyles[variant],
        sizeStyles[size],
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "default" ? "#fff" : "#2563eb"}
          style={{ flex: 1 }}
        />
      ) : (
        <Text style={[styles.textBase, textStyles[variant]]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 8,
  width: "100%",
  height: 48,
},
  textBase: { fontWeight: "500", textAlign: "center", flex: 1 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.7 },
});

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  default: { backgroundColor: "#2563eb" },
  destructive: { backgroundColor: "#dc2626" },
  outline: { borderWidth: 1, borderColor: "#d1d5db", backgroundColor: "transparent" },
  secondary: { backgroundColor: "#e5e7eb" },
  ghost: { backgroundColor: "transparent" },
  link: { backgroundColor: "transparent" },
};

const textStyles: Record<ButtonVariant, TextStyle> = {
  default: { color: "#ffffff" },
  destructive: { color: "#ffffff" },
  outline: { color: "#111827" },
  secondary: { color: "#111827" },
  ghost: { color: "#111827" },
  link: { color: "#2563eb", textDecorationLine: "underline" },
};

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  default: { height: 48, paddingHorizontal: 20 },
  sm: { height: 40, paddingHorizontal: 16 },
  lg: { height: 56, paddingHorizontal: 24 },
  icon: { height: 48, width: 48 },
};
