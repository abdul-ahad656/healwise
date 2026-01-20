// import { useRouter } from "expo-router";
// import {
//   ArrowLeft,
//   Eye,
//   EyeOff,
//   Lock,
//   Mail,
//   User,
// } from "lucide-react-native";
// import { useState } from "react";
// import { Pressable, ScrollView, Text, View } from "react-native";

// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";

// export default function RegisterScreen() {
//   const router = useRouter();

//   const [form, setForm] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     password: "",
//     confirmPassword: "",
//   });

//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);

//   const isFormValid =
//     form.name &&
//     form.email &&
//     form.phone &&
//     form.password.length >= 6 &&
//     form.password === form.confirmPassword;

//   const handleRegister = () => {
//     if (!isFormValid) return;

//     // TEMP: Backend integration later
//     router.replace("/(auth)/login");
//   };

//   return (
//     <View className="flex-1 bg-gray-50">
//       {/* Header */}
//       <View className="bg-gradient-to-r from-green-500 to-blue-500 px-6 pt-14 pb-6 rounded-b-3xl">
//         <View className="flex-row items-center gap-3 mb-2">
//           <Pressable onPress={() => router.back()}>
//             <ArrowLeft size={22} color="white" />
//           </Pressable>
//           <Text className="text-xl font-semibold text-white">Register</Text>
//         </View>
//       </View>

//       <ScrollView className="flex-1 px-6 -mt-6">
//         <Card className="p-6 rounded-2xl">
//           {/* Avatar */}
//           <View className="items-center mb-6">
//             <View className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-blue-500 items-center justify-center mb-3">
//               <User size={32} color="white" />
//             </View>
//             <Text className="font-medium text-gray-800">
//               Create Your Account
//             </Text>
//           </View>

//           {/* Full Name */}
//           <Text className="text-sm font-medium text-gray-700 mb-2">
//             Full Name
//             </Text>
//           <View className="relative mb-4">
//             <User size={16} color="#9CA3AF" className="absolute left-3 top-4" />
//             <Input
//               value={form.name}
//               onChangeText={(v) => setForm({ ...form, name: v })}
//               placeholder="Enter your full name"
//               className="pl-10"
//             />
//           </View>

//           {/* Email */}
//           <Text className="text-sm font-medium text-gray-700 mb-2">
//             Email
//             </Text>
//           <View className="relative mb-4">
//             <Mail size={16} color="#9CA3AF" className="absolute left-3 top-4" />
//             <Input
//               value={form.email}
//               onChangeText={(v) => setForm({ ...form, email: v })}
//               placeholder="Enter your email"
//               keyboardType="email-address"
//               className="pl-10"
//             />
//           </View>

//           {/* Phone */}
//           {/* Password */}
//           <Text className="text-sm font-medium text-gray-700 mb-2">
//             Password
//             </Text>
//           <View className="relative mb-4">
//             <Lock size={16} color="#9CA3AF" className="absolute left-3 top-4" />
//             <Input
//               value={form.password}
//               onChangeText={(v) => setForm({ ...form, password: v })}
//               placeholder="Create a password (min 6 chars)"
//               secureTextEntry={!showPassword}
//               className="pl-10 pr-10"
//             />
//             <Pressable
//               onPress={() => setShowPassword(!showPassword)}
//               className="absolute right-3 top-4"
//             >
//               {showPassword ? (
//                 <EyeOff size={18} color="#6B7280" />
//               ) : (
//                 <Eye size={18} color="#6B7280" />
//               )}
//             </Pressable>
//           </View>

//           {/* Confirm Password */}
//           <Text className="text-sm font-medium text-gray-700 mb-2">
//             Confirm Password
//             </Text>
//           <View className="relative mb-2">
//             <Lock size={16} color="#9CA3AF" className="absolute left-3 top-4" />
//             <Input
//               value={form.confirmPassword}
//               onChangeText={(v) =>
//                 setForm({ ...form, confirmPassword: v })
//               }
//               placeholder="Re-enter password"
//               secureTextEntry={!showConfirmPassword}
//               className="pl-10 pr-10"
//             />
//             <Pressable
//               onPress={() =>
//                 setShowConfirmPassword(!showConfirmPassword)
//               }
//               className="absolute right-3 top-4"
//             >
//               {showConfirmPassword ? (
//                 <EyeOff size={18} color="#6B7280" />
//               ) : (
//                 <Eye size={18} color="#6B7280" />
//               )}
//             </Pressable>
//           </View>

//           {form.confirmPassword &&
//             form.password !== form.confirmPassword && (
//               <Text className="text-xs text-red-500 mt-1">
//                 Passwords do not match
//               </Text>
//             )}

//           {/* Terms */}
//           <Text className="text-xs text-gray-600 text-center mt-4">
//             By registering, you agree to our{" "}
//             <Text className="text-green-600">Terms & Conditions</Text> and{" "}
//             <Text className="text-green-600">Privacy Policy</Text>
//           </Text>

//           {/* Register Button */}
//           <Button
//             title="Create Account"
//             onPress={handleRegister}
//             disabled={!isFormValid}
//             className="w-full mt-6 rounded-xl"
//           />
//         </Card>

//         {/* Login Link */}
//         <View className="items-center mt-6">
//           <Text className="text-sm text-gray-600">
//             Already have an account?
//           </Text>
//           <Pressable onPress={() => router.replace("/(auth)/login")}>
//             <Text className="text-green-600 font-medium">
//               Login
//             </Text>
//           </Pressable>
//         </View>
//       </ScrollView>
//     </View>
//   );
// }

// import React, { useState } from "react";
// import {
//   StyleSheet,
//   Text,
//   View,
//   Pressable,
//   ScrollView,
//   SafeAreaView,
//   KeyboardAvoidingView,
//   Platform,
// } from "react-native";
// import { useRouter } from "expo-router";
// import { ArrowLeft, Eye, EyeOff, Lock, Mail, User, Phone } from "lucide-react-native";

// // Assuming these are your custom UI components adapted for StyleSheet
// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";

// export default function RegisterScreen() {
//   const router = useRouter();

//   const [form, setForm] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     password: "",
//     confirmPassword: "",
//   });

//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);

//   const isFormValid =
//     form.name &&
//     form.email &&
//     form.password.length >= 6 &&
//     form.password === form.confirmPassword;

//   const handleRegister = () => {
//     if (!isFormValid) return;
//     router.replace("/(auth)/login");
//   };

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <SafeAreaView>
//           <View style={styles.headerContent}>
//             <Pressable onPress={() => router.back()} hitSlop={20}>
//               <ArrowLeft size={22} color="white" />
//             </Pressable>
//             <Text style={styles.headerTitle}>Register</Text>
//           </View>
//         </SafeAreaView>
//       </View>

//       <KeyboardAvoidingView
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         style={{ flex: 1 }}
//       >
//         <ScrollView 
//           style={styles.scrollView} 
//           contentContainerStyle={styles.scrollContent}
//           showsVerticalScrollIndicator={false}
//         >
//           <Card style={styles.card}>
//             {/* Avatar Section */}
//             <View style={styles.avatarSection}>
//               <View style={styles.avatarIconContainer}>
//                 <User size={32} color="white" />
//               </View>
//               <Text style={styles.avatarText}>Create Your Account</Text>
//             </View>

//             {/* Full Name */}
//             <Text style={styles.label}>Full Name</Text>
//             <View style={styles.inputWrapper}>
//               <User size={16} color="#9CA3AF" style={styles.inputIcon} />
//               <Input
//                 value={form.name}
//                 onChangeText={(v) => setForm({ ...form, name: v })}
//                 placeholder="Enter your full name"
//                 style={styles.inputField}
//               />
//             </View>

//             {/* Email */}
//             <Text style={styles.label}>Email</Text>
//             <View style={styles.inputWrapper}>
//               <Mail size={16} color="#9CA3AF" style={styles.inputIcon} />
//               <Input
//                 value={form.email}
//                 onChangeText={(v) => setForm({ ...form, email: v })}
//                 placeholder="Enter your email"
//                 keyboardType="email-address"
//                 style={styles.inputField}
//               />
//             </View>

//             {/* Phone (Added for completeness as it was in state) */}
//             <Text style={styles.label}>Phone Number</Text>
//             <View style={styles.inputWrapper}>
//               <Phone size={16} color="#9CA3AF" style={styles.inputIcon} />
//               <Input
//                 value={form.phone}
//                 onChangeText={(v) => setForm({ ...form, phone: v })}
//                 placeholder="Enter your phone number"
//                 keyboardType="phone-pad"
//                 style={styles.inputField}
//               />
//             </View>

//             {/* Password */}
//             <Text style={styles.label}>Password</Text>
//             <View style={styles.inputWrapper}>
//               <Lock size={16} color="#9CA3AF" style={styles.inputIcon} />
//               <Input
//                 value={form.password}
//                 onChangeText={(v) => setForm({ ...form, password: v })}
//                 placeholder="Create a password (min 6 chars)"
//                 secureTextEntry={!showPassword}
//                 style={[styles.inputField, { paddingRight: 40 }]}
//               />
//               <Pressable
//                 onPress={() => setShowPassword(!showPassword)}
//                 style={styles.eyeIcon}
//               >
//                 {showPassword ? <EyeOff size={18} color="#6B7280" /> : <Eye size={18} color="#6B7280" />}
//               </Pressable>
//             </View>

//             {/* Confirm Password */}
//             <Text style={styles.label}>Confirm Password</Text>
//             <View style={styles.inputWrapper}>
//               <Lock size={16} color="#9CA3AF" style={styles.inputIcon} />
//               <Input
//                 value={form.confirmPassword}
//                 onChangeText={(v) => setForm({ ...form, confirmPassword: v })}
//                 placeholder="Re-enter password"
//                 secureTextEntry={!showConfirmPassword}
//                 style={[styles.inputField, { paddingRight: 40 }]}
//               />
//               <Pressable
//                 onPress={() => setShowConfirmPassword(!showConfirmPassword)}
//                 style={styles.eyeIcon}
//               >
//                 {showConfirmPassword ? <EyeOff size={18} color="#6B7280" /> : <Eye size={18} color="#6B7280" />}
//               </Pressable>
//             </View>

//             {form.confirmPassword && form.password !== form.confirmPassword && (
//               <Text style={styles.errorText}>Passwords do not match</Text>
//             )}

//             {/* Terms */}
//             <Text style={styles.termsText}>
//               By registering, you agree to our{" "}
//               <Text style={styles.linkText}>Terms & Conditions</Text> and{" "}
//               <Text style={styles.linkText}>Privacy Policy</Text>
//             </Text>

//             <Button
//               title="Create Account"
//               onPress={handleRegister}
//               disabled={!isFormValid}
//               style={styles.registerButton}
//             />
//           </Card>

//           {/* Login Link */}
//           <View style={styles.footer}>
//             <Text style={styles.footerText}>Already have an account?</Text>
//             <Pressable onPress={() => router.replace("/(auth)/login")}>
//               <Text style={styles.loginLink}>Login</Text>
//             </Pressable>
//           </View>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#F9FAFB", // gray-50
//   },
//   header: {
//     backgroundColor: "#10B981", // Fallback for green-500
//     paddingHorizontal: 24,
//     paddingBottom: 32,
//     borderBottomLeftRadius: 32,
//     borderBottomRightRadius: 32,
//   },
//   headerContent: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginTop: 10,
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: "600",
//     color: "white",
//     marginLeft: 12,
//   },
//   scrollView: {
//     flex: 1,
//     paddingHorizontal: 24,
//     marginTop: -24,
//   },
//   scrollContent: {
//     paddingBottom: 40,
//   },
//   card: {
//     backgroundColor: "white",
//     borderRadius: 24,
//     padding: 24,
//     elevation: 4,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//   },
//   avatarSection: {
//     alignItems: "center",
//     marginBottom: 24,
//   },
//   avatarIconContainer: {
//     width: 64,
//     height: 64,
//     borderRadius: 16,
//     backgroundColor: "#10B981", // green-500
//     alignItems: "center",
//     justifyContent: "center",
//     marginBottom: 12,
//   },
//   avatarText: {
//     fontSize: 16,
//     fontWeight: "500",
//     color: "#1F2937", // gray-800
//   },
//   label: {
//     fontSize: 14,
//     fontWeight: "500",
//     color: "#374151", // gray-700
//     marginBottom: 8,
//   },
//   inputWrapper: {
//     position: "relative",
//     marginBottom: 16,
//     justifyContent: "center",
//   },
//   inputIcon: {
//     position: "absolute",
//     left: 12,
//     zIndex: 10,
//   },
//   inputField: {
//     paddingLeft: 40,
//   },
//   eyeIcon: {
//     position: "absolute",
//     right: 12,
//   },
//   errorText: {
//     fontSize: 12,
//     color: "#EF4444", // red-500
//     marginTop: -8,
//     marginBottom: 8,
//   },
//   termsText: {
//     fontSize: 12,
//     color: "#4B5563", // gray-600
//     textAlign: "center",
//     marginTop: 16,
//     lineHeight: 18,
//   },
//   linkText: {
//     color: "#059669", // green-600
//   },
//   registerButton: {
//     width: "100%",
//     marginTop: 24,
//     borderRadius: 12,
//   },
//   footer: {
//     alignItems: "center",
//     marginTop: 24,
//   },
//   footerText: {
//     fontSize: 14,
//     color: "#4B5563",
//   },
//   loginLink: {
//     color: "#059669",
//     fontWeight: "600",
//     fontSize: 16,
//     marginTop: 4,
//   },
// });

import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User, Phone } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

// Custom UI Components (StyleSheet versions)
import { Card } from "@/components/ui/card";
import { TextInput } from "react-native";

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
    form.password.length >= 6 &&
    form.password === form.confirmPassword;

  const handleRegister = () => {
    if (!isFormValid) return;
    router.replace("/(auth)/login");
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={["#f0fdf4", "#ffffff", "#eff6ff"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header with Brand Gradient */}
      <LinearGradient
        colors={["#22c55e", "#3b82f6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Pressable onPress={() => router.back()} hitSlop={20} style={styles.backButton}>
              <ArrowLeft size={22} color="white" />
            </Pressable>
            <Text style={styles.headerTitle}>Create Account</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.card}>
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <LinearGradient
                colors={["#22c55e", "#3b82f6"]}
                style={styles.avatarIconContainer}
              >
                <User size={32} color="white" />
              </LinearGradient>
              <Text style={styles.avatarText}>Join HealWise Today</Text>
            </View>

            {/* Inputs */}
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <User size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.inputField}
                value={form.name}
                onChangeText={(v) => setForm({ ...form, name: v })}
                placeholder="Enter your full name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Mail size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.inputField}
                value={form.email}
                onChangeText={(v) => setForm({ ...form, email: v })}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Phone size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.inputField}
                value={form.phone}
                onChangeText={(v) => setForm({ ...form, phone: v })}
                placeholder="Enter your phone number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.inputField}
                value={form.password}
                onChangeText={(v) => setForm({ ...form, password: v })}
                placeholder="Min. 6 characters"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                {showPassword ? <EyeOff size={20} color="#6B7280" /> : <Eye size={20} color="#6B7280" />}
              </Pressable>
            </View>

            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.inputField}
                value={form.confirmPassword}
                onChangeText={(v) => setForm({ ...form, confirmPassword: v })}
                placeholder="Re-enter password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showConfirmPassword}
              />
              <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                {showConfirmPassword ? <EyeOff size={20} color="#6B7280" /> : <Eye size={20} color="#6B7280" />}
              </Pressable>
            </View>

            {form.confirmPassword && form.password !== form.confirmPassword && (
              <Text style={styles.errorText}>Passwords do not match</Text>
            )}

            <Text style={styles.termsText}>
              By registering, you agree to our{" "}
              <Text style={styles.linkText}>Terms</Text> and{" "}
              <Text style={styles.linkText}>Privacy Policy</Text>
            </Text>

            {/* Gradient Button */}
            <Pressable
              onPress={handleRegister}
              disabled={!isFormValid}
              style={({ pressed }) => [
                styles.buttonWrapper,
                !isFormValid && { opacity: 0.6 },
                pressed && { opacity: 0.9 }
              ]}
            >
              <LinearGradient
                colors={["#22c55e", "#3b82f6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.registerButton}
              >
                <Text style={styles.buttonText}>Create Account / رجسٹریشن کریں</Text>
              </LinearGradient>
            </Pressable>
          </Card>

          {/* Login Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Pressable onPress={() => router.replace("/(auth)/login")}>
              <Text style={styles.loginLink}>Login Now / لاگ ان کریں</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 44,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "white",
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
    marginTop: -24,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 16,
    height: 52,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 4,
  },
  termsText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 18,
  },
  linkText: {
    color: "#3b82f6",
    fontWeight: "600",
  },
  buttonWrapper: {
    marginTop: 24,
    borderRadius: 16,
    overflow: "hidden",
  },
  registerButton: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  footer: {
    alignItems: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: "#6B7280",
  },
  loginLink: {
    color: "#16a34a",
    fontWeight: "700",
    fontSize: 15,
    marginTop: 6,
  },
});