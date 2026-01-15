import { Pressable, Text, ActivityIndicator } from "react-native";
import { cn } from "@/lib/utils";

type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";

type ButtonSize = "default" | "sm" | "lg" | "icon";

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function Button({
  title,
  onPress,
  variant = "default",
  size = "default",
  disabled = false,
  loading = false,
  className,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={cn(
        "flex-row items-center justify-center rounded-md",
        variantStyles[variant],
        sizeStyles[size],
        disabled && "opacity-50",
        className
      )}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text className={cn("font-medium", textStyles[variant])}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

/* ---------------- styles ---------------- */

const variantStyles: Record<ButtonVariant, string> = {
  default: "bg-blue-600",
  destructive: "bg-red-600",
  outline: "border border-gray-300 bg-transparent",
  secondary: "bg-gray-200",
  ghost: "bg-transparent",
  link: "bg-transparent",
};

const textStyles: Record<ButtonVariant, string> = {
  default: "text-white",
  destructive: "text-white",
  outline: "text-gray-900",
  secondary: "text-gray-900",
  ghost: "text-gray-900",
  link: "text-blue-600 underline",
};

const sizeStyles: Record<ButtonSize, string> = {
  default: "h-12 px-5",
  sm: "h-10 px-4",
  lg: "h-14 px-6",
  icon: "h-12 w-12",
};
