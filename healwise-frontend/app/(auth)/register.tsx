// import { useRouter } from "expo-router";
// import { ArrowLeft, User, Mail, Lock, Eye, EyeOff } from "lucide-react-native";
// import { useState } from "react";
// import { Pressable, ScrollView, Text, View, Alert } from "react-native";

// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { register } from "@/services/authService";

// export default function RegisterScreen() {
//   const router = useRouter();

//   const [form, setForm] = useState({
//     name: "",
//     email: "",
//     password: "",
//     confirmPassword: "",
//   });

//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const isFormValid =
//     form.name &&
//     form.email &&
//     form.password.length >= 6 &&
//     form.password === form.confirmPassword;

//   const handleRegister = async () => {
//     if (!isFormValid) return;

//     setLoading(true);
//     try {
//       // Defaulting role to 'patient'
//       const data = await register(form.name, form.email, form.password, 'patient');
//       // TODO: Store token securely if needed for auto-login persistence
//       // await SecureStore.setItemAsync('token', data.token);

//       Alert.alert("Success", "Account created successfully!", [
//         { text: "OK", onPress: () => router.replace("/(patient)/home") }
//       ]);
      
//     } catch (error: any) {
//       Alert.alert("Registration Failed", error.message);
//     } finally {
//       setLoading(false);
//     }
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
//           {/* Avatar Placeholder */}
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
//               autoCapitalize="none"
//             />
//           </View>

//           {/* Password */}
//           <Text className="text-sm font-medium text-gray-700 mb-2">
//             Password
//             </Text>
//           <View className="relative mb-4">
//             <Lock size={16} color="#9CA3AF" className="absolute left-3 top-4" />
//             <Input
//               value={form.password}
//               onChangeText={(v) => setForm({ ...form, password: v })}
//               placeholder="Enter your password"
//               secureTextEntry={!showPassword}
//               className="pl-10 pr-10"
//             />
//             <Pressable
//                 onPress={() => setShowPassword(!showPassword)}
//                 className="absolute right-3 top-4"
//             >
//                 {showPassword ? <EyeOff size={18} color="#6B7280" /> : <Eye size={18} color="#6B7280" />}
//             </Pressable>
//           </View>

//            {/* Confirm Password */}
//            <Text className="text-sm font-medium text-gray-700 mb-2">
//             Confirm Password
//             </Text>
//           <View className="relative mb-6">
//             <Lock size={16} color="#9CA3AF" className="absolute left-3 top-4" />
//             <Input
//               value={form.confirmPassword}
//               onChangeText={(v) => setForm({ ...form, confirmPassword: v })}
//               placeholder="Confirm your password"
//               secureTextEntry={!showConfirmPassword}
//               className="pl-10 pr-10"
//             />
//             <Pressable
//                 onPress={() => setShowConfirmPassword(!showConfirmPassword)}
//                 className="absolute right-3 top-4"
//             >
//                 {showConfirmPassword ? <EyeOff size={18} color="#6B7280" /> : <Eye size={18} color="#6B7280" />}
//             </Pressable>
//           </View>

//           {/* Register Button */}
//           <Button
//             title={loading ? "Creating Account..." : "Register"}
//             onPress={handleRegister}
//             disabled={!isFormValid || loading}
//             loading={loading}
//             style={{ width: '100%', borderRadius: 12 }}
//           />
//         </Card>
        
//         {/* Login Link */}
//         <View className="items-center mt-6 flex-row justify-center gap-2 mb-10">
//            <Text className="text-sm text-gray-600">
//              Already have an account?
//            </Text>
//            <Pressable onPress={() => router.replace("/(auth)/login")}>
//              <Text className="text-green-600 font-medium">
//                Login
//              </Text>
//            </Pressable>
//         </View>

//       </ScrollView>
//     </View>
//   );
// }

import { useRouter } from "expo-router";
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View, Alert, StyleSheet } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { register } from "@/services/authService";

export default function RegisterScreen() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isFormValid =
    form.name &&
    form.email &&
    form.password.length >= 6 &&
    form.password === form.confirmPassword;

  const handleRegister = async () => {
    if (!isFormValid) return;

    setLoading(true);
    try {
      const data = await register(form.name, form.email, form.password, 'patient');
      router.replace("/(patient)/home");
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with LinearGradient */}
      <LinearGradient
        colors={["#22c55e", "#3b82f6"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Pressable 
            onPress={() => router.back()}
            style={({ pressed }: { pressed: boolean }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <ArrowLeft size={22} color="white" />
          </Pressable>
          <Text style={styles.headerTitle}>Register</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          {/* Avatar Placeholder */}
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={["#22c55e", "#3b82f6"]}
              style={styles.avatarGradient}
            >
              <User size={32} color="white" />
            </LinearGradient>
            <Text style={styles.avatarText}>Create Your Account</Text>
          </View>

          {/* Full Name */}
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputWrapper}>
            <User size={16} color="#9CA3AF" style={styles.inputIcon} />
            <Input
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
              placeholder="Enter your full name"
              style={{ paddingLeft: 40 }}
            />
          </View>

          {/* Email */}
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrapper}>
            <Mail size={16} color="#9CA3AF" style={styles.inputIcon} />
            <Input
              value={form.email}
              onChangeText={(v) => setForm({ ...form, email: v })}
              placeholder="Enter your email"
              keyboardType="email-address"
              style={{ paddingLeft: 40 }}
              autoCapitalize="none"
            />
          </View>

          {/* Password */}
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <Lock size={16} color="#9CA3AF" style={styles.inputIcon} />
            <Input
              value={form.password}
              onChangeText={(v) => setForm({ ...form, password: v })}
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
              style={{ paddingLeft: 40, paddingRight: 40 }}
            />
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              {showPassword ? <EyeOff size={18} color="#6B7280" /> : <Eye size={18} color="#6B7280" />}
            </Pressable>
          </View>

          {/* Confirm Password */}
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.inputWrapper}>
            <Lock size={16} color="#9CA3AF" style={styles.inputIcon} />
            <Input
              value={form.confirmPassword}
              onChangeText={(v) => setForm({ ...form, confirmPassword: v })}
              placeholder="Confirm your password"
              secureTextEntry={!showConfirmPassword}
              style={{ paddingLeft: 40, paddingRight: 40 }}
            />
            <Pressable
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              {showConfirmPassword ? <EyeOff size={18} color="#6B7280" /> : <Eye size={18} color="#6B7280" />}
            </Pressable>
          </View>

          <Button
            title={loading ? "Creating Account..." : "Register"}
            onPress={handleRegister}
            disabled={!isFormValid || loading}
            loading={loading}
            style={{ marginTop: 10, borderRadius: 12 }}
          />
        </Card>
        
        {/* Login Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable onPress={() => router.replace("/(auth)/login")}>
            <Text style={styles.loginLink}>Login</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: 'white' },
  scrollView: { flex: 1, paddingHorizontal: 24, marginTop: -30 },
  card: { padding: 24, borderRadius: 24, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  avatarContainer: { alignItems: 'center', marginBottom: 24 },
  avatarGradient: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  inputWrapper: { position: 'relative', marginBottom: 16, justifyContent: 'center' },
  inputIcon: { position: 'absolute', left: 12, zIndex: 10 },
  eyeIcon: { position: 'absolute', right: 12, zIndex: 10 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24, marginBottom: 40 },
  footerText: { color: '#4b5563' },
  loginLink: { color: '#16a34a', fontWeight: '700' }
});