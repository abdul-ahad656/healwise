// // import { Pressable, Text, ActivityIndicator } from "react-native";
// // import { cn } from "@/lib/utils";

// // type ButtonVariant =
// //   | "default"
// //   | "destructive"
// //   | "outline"
// //   | "secondary"
// //   | "ghost"
// //   | "link";

// // type ButtonSize = "default" | "sm" | "lg" | "icon";

// // interface ButtonProps {
// //   title: string;
// //   onPress?: () => void;
// //   variant?: ButtonVariant;
// //   size?: ButtonSize;
// //   disabled?: boolean;
// //   loading?: boolean;
// //   className?: string;
// // }

// // export function Button({
// //   title,
// //   onPress,
// //   variant = "default",
// //   size = "default",
// //   disabled = false,
// //   loading = false,
// //   className,
// // }: ButtonProps) {
// //   return (
// //     <Pressable
// //       onPress={onPress}
// //       disabled={disabled || loading}
// //       className={cn(
// //         "flex-row items-center justify-center rounded-md",
// //         variantStyles[variant],
// //         sizeStyles[size],
// //         disabled && "opacity-50",
// //         className
// //       )}
// //     >
// //       {loading ? (
// //         <ActivityIndicator color="#fff" />
// //       ) : (
// //         <Text className={cn("font-medium", textStyles[variant])}>
// //           {title}
// //         </Text>
// //       )}
// //     </Pressable>
// //   );
// // }

// // /* ---------------- styles ---------------- */

// // const variantStyles: Record<ButtonVariant, string> = {
// //   default: "bg-blue-600",
// //   destructive: "bg-red-600",
// //   outline: "border border-gray-300 bg-transparent",
// //   secondary: "bg-gray-200",
// //   ghost: "bg-transparent",
// //   link: "bg-transparent",
// // };

// // const textStyles: Record<ButtonVariant, string> = {
// //   default: "text-white",
// //   destructive: "text-white",
// //   outline: "text-gray-900",
// //   secondary: "text-gray-900",
// //   ghost: "text-gray-900",
// //   link: "text-blue-600 underline",
// // };

// // const sizeStyles: Record<ButtonSize, string> = {
// //   default: "h-12 px-5",
// //   sm: "h-10 px-4",
// //   lg: "h-14 px-6",
// //   icon: "h-12 w-12",
// // };

// import { Pressable, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from "react-native";
// import { cn } from "@/lib/utils";

// type ButtonVariant =
//   | "default"
//   | "destructive"
//   | "outline"
//   | "secondary"
//   | "ghost"
//   | "link";

// type ButtonSize = "default" | "sm" | "lg" | "icon";

// interface ButtonProps {
//   title: string;
//   onPress?: () => void;
//   variant?: ButtonVariant;
//   size?: ButtonSize;
//   disabled?: boolean;
//   loading?: boolean;
//   className?: string;
//   style?: ViewStyle | ViewStyle[]; // ADDED: Allow StyleSheet objects
// }

// export function Button({
//   title,
//   onPress,
//   variant = "default",
//   size = "default",
//   disabled = false,
//   loading = false,
//   className,
//   style, // Destructure style
// }: ButtonProps) {
//   return (
//     <Pressable
//       onPress={onPress}
//       disabled={disabled || loading}
//       // MERGE: [ Tailwind classes (via cn), StyleSheet styles ]
//       style={({ pressed }) => [
//         { opacity: pressed ? 0.8 : 1 }, // Optional: adds touch feedback
//         style, 
//       ]}
//       className={cn(
//         "flex-row items-center justify-center rounded-md",
//         variantStyles[variant],
//         sizeStyles[size],
//         disabled && "opacity-50",
//         className
//       )}
//     >
//       {loading ? (
//         <ActivityIndicator color={variant === "default" ? "#fff" : "#000"} />
//       ) : (
//         <Text className={cn("font-medium", textStyles[variant])}>
//           {title}
//         </Text>
//       )}
//     </Pressable>
//   );
// }

// /* ---------------- styles (Tailwind Classes) ---------------- */

// const variantStyles: Record<ButtonVariant, string> = {
//   default: "bg-blue-600",
//   destructive: "bg-red-600",
//   outline: "border border-gray-300 bg-transparent",
//   secondary: "bg-gray-200",
//   ghost: "bg-transparent",
//   link: "bg-transparent",
// };

// const textStyles: Record<ButtonVariant, string> = {
//   default: "text-white",
//   destructive: "text-white",
//   outline: "text-gray-900",
//   secondary: "text-gray-900",
//   ghost: "text-gray-900",
//   link: "text-blue-600 underline",
// };

// const sizeStyles: Record<ButtonSize, string> = {
//   default: "h-12 px-5",
//   sm: "h-10 px-4",
//   lg: "h-14 px-6",
//   icon: "h-12 w-12",
// };

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
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        sizeStyles[size],
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "default" ? "#fff" : "#2563eb"} />
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
  },
  textBase: { fontWeight: "500" },
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