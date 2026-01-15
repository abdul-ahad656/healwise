import { useRouter } from "expo-router";
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"patient" | "doctor" | "admin">("patient");

  const handleLogin = () => {
    if (!email || !password) return;

    // TEMP: role-based routing (backend later)
    if (role === "patient") router.replace("/(patient)/home");
    if (role === "doctor") router.replace("/(doctor)/dashboard");
    if (role === "admin") router.replace("/(admin)/dashboard");
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-gradient-to-r from-green-500 to-blue-500 px-6 pt-14 pb-6 rounded-b-3xl">
        <View className="flex-row items-center gap-3 mb-2">
          <Pressable onPress={() => router.back()}>
            <ArrowLeft size={22} color="white" />
          </Pressable>
          <Text className="text-xl font-semibold text-white">Login</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 -mt-6">
        <Card className="p-6 rounded-2xl">
          {/* Email */}
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Email
            </Text>

          <View className="relative mb-4">
            <Mail size={16} color="#9CA3AF" className="absolute left-3 top-4" />
            <Input
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              className="pl-10"
            />
          </View>

          {/* Password */}
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Password
            </Text>

          <View className="relative mb-2">
            <Lock size={16} color="#9CA3AF" className="absolute left-3 top-4" />
            <Input
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
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

          {/* Forgot Password */}
          <Pressable className="items-end mb-6">
            <Text className="text-sm text-blue-500">
              Forgot Password?
            </Text>
          </Pressable>

          {/* Login Button */}
          <Button
            title="Login"
            onPress={handleLogin}
            disabled={!email || !password}
            className="w-full rounded-xl"
          />
        </Card>

        {/* Register */}
        <View className="items-center mt-6">
          <Text className="text-sm text-gray-600">
            Don’t have an account?
          </Text>
          <Pressable onPress={() => router.push("/(auth)/register")}>
            <Text className="text-green-600 font-medium">
              Register Now
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
