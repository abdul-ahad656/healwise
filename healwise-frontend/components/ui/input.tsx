import { TextInput, View, Text } from "react-native";
import { cn } from "@/lib/utils";

interface InputProps {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function Input({
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = "default",
  error,
  disabled = false,
  className,
}: InputProps) {
  return (
    <View className="w-full">
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        editable={!disabled}
        placeholderTextColor="#9CA3AF"
        className={cn(
          "h-12 rounded-md border px-4 text-base bg-white text-gray-900",
          "border-gray-300",
          disabled && "opacity-50",
          error && "border-red-500",
          className
        )}
      />

      {error && (
        <Text className="mt-1 text-sm text-red-500">
          {error}
        </Text>
      )}
    </View>
  );
}
