// import { TextInput, View, Text } from "react-native";
// import { cn } from "@/lib/utils";

// interface InputProps {
//   value?: string;
//   onChangeText?: (text: string) => void;
//   placeholder?: string;
//   secureTextEntry?: boolean;
//   keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
//   error?: string;
//   disabled?: boolean;
//   className?: string;
// }

// export function Input({
//   value,
//   onChangeText,
//   placeholder,
//   secureTextEntry = false,
//   keyboardType = "default",
//   error,
//   disabled = false,
//   className,
// }: InputProps) {
//   return (
//     <View className="w-full">
//       <TextInput
//         value={value}
//         onChangeText={onChangeText}
//         placeholder={placeholder}
//         secureTextEntry={secureTextEntry}
//         keyboardType={keyboardType}
//         editable={!disabled}
//         placeholderTextColor="#9CA3AF"
//         className={cn(
//           "h-12 rounded-md border px-4 text-base bg-white text-gray-900",
//           "border-gray-300",
//           disabled && "opacity-50",
//           error && "border-red-500",
//           className
//         )}
//       />

//       {error && (
//         <Text className="mt-1 text-sm text-red-500">
//           {error}
//         </Text>
//       )}
//     </View>
//   );
// }

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