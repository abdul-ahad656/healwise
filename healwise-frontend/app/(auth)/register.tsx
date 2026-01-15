import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function RegisterScreen() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isFormValid =
    form.name &&
    form.email &&
    form.phone &&
    form.password.length >= 6 &&
    form.password === form.confirmPassword;

  const handleRegister = () => {
    if (!isFormValid) return;

    // TEMP: Backend integration later
    router.replace("/(auth)/login");
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-gradient-to-r from-green-500 to-blue-500 px-6 pt-14 pb-6 rounded-b-3xl">
        <View className="flex-row items-center gap-3 mb-2">
          <Pressable onPress={() => router.back()}>
            <ArrowLeft size={22} color="white" />
          </Pressable>
          <Text className="text-xl font-semibold text-white">Register</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 -mt-6">
        <Card className="p-6 rounded-2xl">
          {/* Avatar */}
          <View className="items-center mb-6">
            <View className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-blue-500 items-center justify-center mb-3">
              <User size={32} color="white" />
            </View>
            <Text className="font-medium text-gray-800">
              Create Your Account
            </Text>
          </View>

          {/* Full Name */}
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Full Name
            </Text>
          <View className="relative mb-4">
            <User size={16} color="#9CA3AF" className="absolute left-3 top-4" />
            <Input
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
              placeholder="Enter your full name"
              className="pl-10"
            />
          </View>

          {/* Email */}
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Email
            </Text>
          <View className="relative mb-4">
            <Mail size={16} color="#9CA3AF" className="absolute left-3 top-4" />
            <Input
              value={form.email}
              onChangeText={(v) => setForm({ ...form, email: v })}
              placeholder="Enter your email"
              keyboardType="email-address"
              className="pl-10"
            />
          </View>

          {/* Phone */}
          {/* Password */}
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Password
            </Text>
          <View className="relative mb-4">
            <Lock size={16} color="#9CA3AF" className="absolute left-3 top-4" />
            <Input
              value={form.password}
              onChangeText={(v) => setForm({ ...form, password: v })}
              placeholder="Create a password (min 6 chars)"
              secureTextEntry={!showPassword}
              className="pl-10 pr-10"
            />
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-4"
            >
              {showPassword ? (
                <EyeOff size={18} color="#6B7280" />
              ) : (
                <Eye size={18} color="#6B7280" />
              )}
            </Pressable>
          </View>

          {/* Confirm Password */}
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Confirm Password
            </Text>
          <View className="relative mb-2">
            <Lock size={16} color="#9CA3AF" className="absolute left-3 top-4" />
            <Input
              value={form.confirmPassword}
              onChangeText={(v) =>
                setForm({ ...form, confirmPassword: v })
              }
              placeholder="Re-enter password"
              secureTextEntry={!showConfirmPassword}
              className="pl-10 pr-10"
            />
            <Pressable
              onPress={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
              className="absolute right-3 top-4"
            >
              {showConfirmPassword ? (
                <EyeOff size={18} color="#6B7280" />
              ) : (
                <Eye size={18} color="#6B7280" />
              )}
            </Pressable>
          </View>

          {form.confirmPassword &&
            form.password !== form.confirmPassword && (
              <Text className="text-xs text-red-500 mt-1">
                Passwords do not match
              </Text>
            )}

          {/* Terms */}
          <Text className="text-xs text-gray-600 text-center mt-4">
            By registering, you agree to our{" "}
            <Text className="text-green-600">Terms & Conditions</Text> and{" "}
            <Text className="text-green-600">Privacy Policy</Text>
          </Text>

          {/* Register Button */}
          <Button
            title="Create Account"
            onPress={handleRegister}
            disabled={!isFormValid}
            className="w-full mt-6 rounded-xl"
          />
        </Card>

        {/* Login Link */}
        <View className="items-center mt-6">
          <Text className="text-sm text-gray-600">
            Already have an account?
          </Text>
          <Pressable onPress={() => router.replace("/(auth)/login")}>
            <Text className="text-green-600 font-medium">
              Login
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
