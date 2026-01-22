// import { useRouter } from "expo-router";
// import { ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react-native";
// import { useState } from "react";
// import { Pressable, ScrollView, Text, View, Alert } from "react-native";

// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { login } from "@/services/authService";

// export default function LoginScreen() {
//   const router = useRouter();

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const handleLogin = async () => {
//     if (!email || !password) return;

//     setLoading(true);
//     try {
//       const data = await login(email, password);
//       // TODO: Store token securely
//       // await SecureStore.setItemAsync('token', data.token);

//       const role = data.user.role;

//       if (role === "patient") router.replace("/(patient)/home");
//       else if (role === "doctor") router.replace("/(doctor)/dashboard");
//       else if (role === "admin") router.replace("/(admin)/dashboard");
//       else {
//         Alert.alert("Error", "Unknown role: " + role);
//       }
//     } catch (error: any) {
//       Alert.alert("Login Failed", error.message);
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
//           <Text className="text-xl font-semibold text-white">Login</Text>
//         </View>
//       </View>

//       <ScrollView className="flex-1 px-6 -mt-6">
//         <Card className="p-6 rounded-2xl">
//           {/* Email */}
//           <Text className="text-sm font-medium text-gray-700 mb-2">
//             Email
//             </Text>

//           <View className="relative mb-4">
//             <Mail size={16} color="#9CA3AF" className="absolute left-3 top-4" />
//             <Input
//               value={email}
//               onChangeText={setEmail}
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

//           <View className="relative mb-2">
//             <Lock size={16} color="#9CA3AF" className="absolute left-3 top-4" />
//             <Input
//               value={password}
//               onChangeText={setPassword}
//               placeholder="Enter your password"
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

//           {/* Forgot Password */}
//           <Pressable className="items-end mb-6">
//             <Text className="text-sm text-blue-500">
//               Forgot Password?
//             </Text>
//           </Pressable>

//           {/* Login Button */}
//           <Button
//             title={loading ? "Logging in..." : "Login"}
//             onPress={handleLogin}
//             disabled={!email || !password || loading}
//             loading={loading}
//             style={{ width: '100%', borderRadius: 12 }}
//           />
//         </Card>

//         {/* Register */}
//         <View className="items-center mt-6 flex-row justify-center gap-2">
//            <Text className="text-sm text-gray-600">
//              Don’t have an account?
//            </Text>
//            <Pressable onPress={() => router.push("/(auth)/register")}>
//              <Text className="text-green-600 font-medium">
//                Register Now
//              </Text>
//            </Pressable>
//         </View>
//       </ScrollView>
//     </View>
//   );
// }

import { useRouter } from "expo-router";
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View, Alert, StyleSheet } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { login } from "@/services/authService";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;

    setLoading(true);
    try {
      const data = await login(email, password);
      const role = data.user.role;

      // Role-based routing
      if (role === "patient") router.replace("/(patient)/home");
      else if (role === "doctor") router.replace("/(doctor)/dashboard");
      else if (role === "admin") router.replace("/(admin)/dashboard");
      else {
        Alert.alert("Error", "Unknown role: " + role);
      }
    } catch (error: any) {
      Alert.alert("Login Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with LinearGradient for consistency */}
      <LinearGradient
        colors={["#22c55e", "#3b82f6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Pressable 
            onPress={() => router.back()}
            hitSlop={20}
            // Fixes the Red Line by explicitly typing the state
            style={({ pressed }: { pressed: boolean }) => [
              { opacity: pressed ? 0.6 : 1 }
            ]}
          >
            <ArrowLeft size={22} color="white" />
          </Pressable>
          <Text style={styles.headerTitle}>Login</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.card}>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.subText}>Sign in to continue</Text>

          {/* Email Input */}
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrapper}>
            <Mail size={16} color="#9CA3AF" style={styles.inputIcon} />
            <Input
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              style={{ paddingLeft: 40 }} // Space for icon
            />
          </View>

          {/* Password Input */}
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <Lock size={16} color="#9CA3AF" style={styles.inputIcon} />
            <Input
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
              style={{ paddingLeft: 40, paddingRight: 40 }}
            />
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
              hitSlop={10}
            >
              {showPassword ? <EyeOff size={18} color="#6B7280" /> : <Eye size={18} color="#6B7280" />}
            </Pressable>
          </View>

          {/* Forgot Password */}
          <Pressable style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </Pressable>

          {/* Login Button */}
          <Button
            title={loading ? "Logging in..." : "Login"}
            onPress={handleLogin}
            disabled={!email || !password || loading}
            loading={loading}
            style={{ width: '100%', borderRadius: 12, height: 50 }}
          />
        </Card>

        {/* Footer Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don’t have an account?</Text>
          <Pressable onPress={() => router.push("/(auth)/register")}>
            <Text style={styles.registerLink}>Register Now</Text>
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
  scrollView: { flex: 1, marginTop: -30 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  card: { padding: 24, borderRadius: 24, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  welcomeText: { fontSize: 22, fontWeight: '700', color: '#111827', textAlign: 'center' },
  subText: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  inputWrapper: { position: 'relative', marginBottom: 16, justifyContent: 'center' },
  inputIcon: { position: 'absolute', left: 12, zIndex: 10 },
  eyeIcon: { position: 'absolute', right: 12, zIndex: 10 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotText: { color: '#3b82f6', fontSize: 14, fontWeight: '500' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 6 },
  footerText: { color: '#4b5563' },
  registerLink: { color: '#16a34a', fontWeight: '700' }
});