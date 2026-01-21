// // import { useRouter } from "expo-router";
// // import { ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react-native";
// // import { useState } from "react";
// // import { Pressable, ScrollView, Text, View } from "react-native";

// // import { Button } from "@/components/ui/button";
// // import { Card } from "@/components/ui/card";
// // import { Input } from "@/components/ui/input";

// // export default function LoginScreen() {
// //   const router = useRouter();

// //   const [email, setEmail] = useState("");
// //   const [password, setPassword] = useState("");
// //   const [showPassword, setShowPassword] = useState(false);
// //   const [role, setRole] = useState<"patient" | "doctor" | "admin">("patient");

// //   const handleLogin = () => {
// //     if (!email || !password) return;

// //     // TEMP: role-based routing (backend later)
// //     if (role === "patient") router.replace("/(patient)/home");
// //     if (role === "doctor") router.replace("/(doctor)/dashboard");
// //     if (role === "admin") router.replace("/(admin)/dashboard");
// //   };

// //   return (
// //     <View className="flex-1 bg-gray-50">
// //       {/* Header */}
// //       <View className="bg-gradient-to-r from-green-500 to-blue-500 px-6 pt-14 pb-6 rounded-b-3xl">
// //         <View className="flex-row items-center gap-3 mb-2">
// //           <Pressable onPress={() => router.back()}>
// //             <ArrowLeft size={22} color="white" />
// //           </Pressable>
// //           <Text className="text-xl font-semibold text-white">Login</Text>
// //         </View>
// //       </View>

// //       <ScrollView className="flex-1 px-6 -mt-6">
// //         <Card className="p-6 rounded-2xl">
// //           {/* Email */}
// //           <Text className="text-sm font-medium text-gray-700 mb-2">
// //             Email
// //             </Text>

// //           <View className="relative mb-4">
// //             <Mail size={16} color="#9CA3AF" className="absolute left-3 top-4" />
// //             <Input
// //               value={email}
// //               onChangeText={setEmail}
// //               placeholder="Enter your email"
// //               keyboardType="email-address"
// //               className="pl-10"
// //             />
// //           </View>

// //           {/* Password */}
// //           <Text className="text-sm font-medium text-gray-700 mb-2">
// //             Password
// //             </Text>

// //           <View className="relative mb-2">
// //             <Lock size={16} color="#9CA3AF" className="absolute left-3 top-4" />
// //             <Input
// //               value={password}
// //               onChangeText={setPassword}
// //               placeholder="Enter your password"
// //               secureTextEntry={!showPassword}
// //               className="pl-10 pr-10"
// //             />
// //             <Pressable
// //               onPress={() => setShowPassword(!showPassword)}
// //               className="absolute right-3 top-4"
// //             >
// //               {showPassword ? (
// //                 <EyeOff size={18} color="#6B7280" />
// //               ) : (
// //                 <Eye size={18} color="#6B7280" />
// //               )}
// //             </Pressable>
// //           </View>

// //           {/* Forgot Password */}
// //           <Pressable className="items-end mb-6">
// //             <Text className="text-sm text-blue-500">
// //               Forgot Password?
// //             </Text>
// //           </Pressable>

// //           {/* Login Button */}
// //           <Button
// //             title="Login"
// //             onPress={handleLogin}
// //             disabled={!email || !password}
// //             className="w-full rounded-xl"
// //           />
// //         </Card>

// //         {/* Register */}
// //         <View className="items-center mt-6">
// //           <Text className="text-sm text-gray-600">
// //             Don’t have an account?
// //           </Text>
// //           <Pressable onPress={() => router.push("/(auth)/register")}>
// //             <Text className="text-green-600 font-medium">
// //               Register Now
// //             </Text>
// //           </Pressable>
// //         </View>
// //       </ScrollView>
// //     </View>
// //   );
// // }


// // import { useRouter } from "expo-router";
// // import { ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react-native";
// // import { useState } from "react";
// // import { Pressable, ScrollView, Text, View } from "react-native";

// // export default function LoginScreen() {
// //   const router = useRouter();

// //   const [email, setEmail] = useState("");
// //   const [password, setPassword] = useState("");
// //   const [showPassword, setShowPassword] = useState(false);

// //   const handleLogin = () => {
// //     if (!email || !password) return;
// //     router.replace("/(patient)/home");
// //   };

// //   return (
// //     <View className="flex-1 bg-white dark:bg-neutral-900">
// //       {/* Header */}
// //       <View className="px-6 pt-14 pb-6 rounded-b-3xl bg-black dark:bg-white">
// //         <View className="flex-row items-center gap-3">
// //           <Pressable onPress={() => router.back()}>
// //             <ArrowLeft size={22} color="#fff" />
// //           </Pressable>
// //           <Text className="text-xl font-semibold text-white dark:text-black">
// //             Login
// //           </Text>
// //         </View>
// //       </View>

// //       <ScrollView className="flex-1 px-6 -mt-6">
// //         {/* Card */}
// //         <View className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
// //           {/* Email */}
// //           <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
// //             Email
// //           </Text>

// //           <View className="flex-row items-center bg-gray-100 dark:bg-neutral-700 rounded-xl px-3 mb-4">
// //             <Mail size={16} color="#9CA3AF" />
// //             <Text
// //               className="flex-1 ml-2 text-neutral-900 dark:text-white"
// //               onPress={() => {}}
// //             >
// //               {email || "Enter your email"}
// //             </Text>
// //           </View>

// //           {/* Password */}
// //           <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
// //             Password
// //           </Text>

// //           <View className="flex-row items-center bg-gray-100 dark:bg-neutral-700 rounded-xl px-3 mb-2">
// //             <Lock size={16} color="#9CA3AF" />
// //             <Text className="flex-1 ml-2 text-neutral-900 dark:text-white">
// //               {password ? "••••••••" : "Enter your password"}
// //             </Text>
// //             <Pressable onPress={() => setShowPassword(!showPassword)}>
// //               {showPassword ? (
// //                 <EyeOff size={18} color="#6B7280" />
// //               ) : (
// //                 <Eye size={18} color="#6B7280" />
// //               )}
// //             </Pressable>
// //           </View>

// //           {/* Forgot Password */}
// //           <Pressable className="items-end mb-6">
// //             <Text className="text-sm text-blue-500">Forgot Password?</Text>
// //           </Pressable>

// //           {/* Login Button */}
// //           <Pressable
// //             onPress={handleLogin}
// //             disabled={!email || !password}
// //             className="bg-black dark:bg-white rounded-xl py-3 items-center"
// //           >
// //             <Text className="text-white dark:text-black font-medium">
// //               Login
// //             </Text>
// //           </Pressable>
// //         </View>

// //         {/* Register */}
// //         <View className="items-center mt-6">
// //           <Text className="text-sm text-neutral-600 dark:text-neutral-400">
// //             Don’t have an account?
// //           </Text>
// //           <Pressable onPress={() => router.push("/(auth)/register")}>
// //             <Text className="text-green-600 font-medium mt-1">
// //               Register Now
// //             </Text>
// //           </Pressable>
// //         </View>
// //       </ScrollView>
// //     </View>
// //   );
// // }


// import React, { useState } from "react";
// import { 
//   StyleSheet, 
//   Text, 
//   View, 
//   TextInput, 
//   Pressable, 
//   ScrollView, 
//   SafeAreaView, 
//   KeyboardAvoidingView, 
//   Platform,
//   useColorScheme 
// } from "react-native";
// import { useRouter } from "expo-router";
// import { ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react-native";

// export default function LoginScreen() {
//   const router = useRouter();
//   const isDarkMode = useColorScheme() === 'dark';
  
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);

//   const handleLogin = () => {
//     if (!email || !password) return;
//     router.replace("/(patient)/home");
//   };

//   // Dynamic colors based on theme
//   const themeStyles = {
//     container: isDarkMode ? styles.darkContainer : styles.lightContainer,
//     header: isDarkMode ? styles.darkHeader : styles.lightHeader,
//     headerText: isDarkMode ? styles.darkHeaderText : styles.lightHeaderText,
//     card: isDarkMode ? styles.darkCard : styles.lightCard,
//     inputBg: isDarkMode ? styles.darkInput : styles.lightInput,
//     text: isDarkMode ? styles.darkText : styles.lightText,
//     button: isDarkMode ? styles.darkButton : styles.lightButton,
//     buttonText: isDarkMode ? styles.darkButtonText : styles.lightButtonText,
//   };

//   return (
//     <View style={[styles.container, themeStyles.container]}>
//       {/* Header */}
//       <View style={[styles.header, themeStyles.header]}>
//         <SafeAreaView>
//           <View style={styles.headerContent}>
//             <Pressable onPress={() => router.back()} hitSlop={20}>
//               <ArrowLeft size={22} color={isDarkMode ? "#000" : "#fff"} />
//             </Pressable>
//             <Text style={[styles.headerTitle, themeStyles.headerText]}>Login</Text>
//           </View>
//         </SafeAreaView>
//       </View>

//       <KeyboardAvoidingView 
//         behavior={Platform.OS === "ios" ? "padding" : "height"} 
//         style={{ flex: 1 }}
//       >
//         <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
//           {/* Card */}
//           <View style={[styles.card, themeStyles.card]}>
//             <Text style={[styles.label, themeStyles.text]}>Email</Text>
//             <View style={[styles.inputContainer, themeStyles.inputBg]}>
//               <Mail size={16} color="#9CA3AF" />
//               <TextInput
//                 style={[styles.input, themeStyles.text]}
//                 placeholder="Enter your email"
//                 placeholderTextColor="#9CA3AF"
//                 value={email}
//                 onChangeText={setEmail}
//                 autoCapitalize="none"
//                 keyboardType="email-address"
//               />
//             </View>

//             <Text style={[styles.label, themeStyles.text]}>Password</Text>
//             <View style={[styles.inputContainer, themeStyles.inputBg]}>
//               <Lock size={16} color="#9CA3AF" />
//               <TextInput
//                 style={[styles.input, themeStyles.text]}
//                 placeholder="Enter your password"
//                 placeholderTextColor="#9CA3AF"
//                 value={password}
//                 onChangeText={setPassword}
//                 secureTextEntry={!showPassword}
//               />
//               <Pressable onPress={() => setShowPassword(!showPassword)}>
//                 {showPassword ? (
//                   <EyeOff size={18} color="#6B7280" />
//                 ) : (
//                   <Eye size={18} color="#6B7280" />
//                 )}
//               </Pressable>
//             </View>

//             <Pressable style={styles.forgotPassword}>
//               <Text style={styles.blueText}>Forgot Password?</Text>
//             </Pressable>

//             <Pressable
//               onPress={handleLogin}
//               disabled={!email || !password}
//               style={({ pressed }) => [
//                 styles.loginButton,
//                 themeStyles.button,
//                 (!email || !password) && { opacity: 0.5 },
//                 pressed && { opacity: 0.8 }
//               ]}
//             >
//               <Text style={[styles.loginButtonText, themeStyles.buttonText]}>Login</Text>
//             </Pressable>
//           </View>

//           {/* Register Link */}
//           <View style={styles.registerContainer}>
//             <Text style={styles.footerText}>Don’t have an account?</Text>
//             <Pressable onPress={() => router.push("/(auth)/register")}>
//               <Text style={styles.registerText}>Register Now</Text>
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
//   },
//   lightContainer: { backgroundColor: "#FFFFFF" },
//   darkContainer: { backgroundColor: "#171717" }, // neutral-900

//   // Header Styles
//   header: {
//     paddingHorizontal: 24,
//     paddingBottom: 24,
//     borderBottomLeftRadius: 24,
//     borderBottomRightRadius: 24,
//   },
//   lightHeader: { backgroundColor: "#000000" },
//   darkHeader: { backgroundColor: "#FFFFFF" },
//   headerContent: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginTop: 10,
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: "600",
//     marginLeft: 12,
//   },
//   lightHeaderText: { color: "#FFFFFF" },
//   darkHeaderText: { color: "#000000" },

//   // Form Styles
//   scrollView: {
//     flex: 1,
//     paddingHorizontal: 24,
//     marginTop: -24,
//   },
//   card: {
//     borderRadius: 16,
//     padding: 24,
//     ...Platform.select({
//       ios: {
//         shadowColor: "#000",
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 4,
//       },
//       android: {
//         elevation: 4,
//       },
//     }),
//   },
//   lightCard: { backgroundColor: "#FFFFFF" },
//   darkCard: { backgroundColor: "#262626" }, // neutral-800

//   label: {
//     fontSize: 14,
//     fontWeight: "500",
//     marginBottom: 8,
//   },
//   lightText: { color: "#404040" }, // neutral-700
//   darkText: { color: "#d4d4d4" }, // neutral-300

//   inputContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     borderRadius: 12,
//     paddingHorizontal: 12,
//     marginBottom: 16,
//     height: 48,
//   },
//   lightInput: { backgroundColor: "#F3F4F6" },
//   darkInput: { backgroundColor: "#404040" },

//   input: {
//     flex: 1,
//     marginLeft: 8,
//     fontSize: 14,
//   },

//   forgotPassword: {
//     alignItems: "flex-end",
//     marginBottom: 24,
//   },
//   blueText: {
//     color: "#3b82f6",
//     fontSize: 14,
//   },

//   // Button
//   loginButton: {
//     borderRadius: 12,
//     paddingVertical: 14,
//     alignItems: "center",
//   },
//   lightButton: { backgroundColor: "#000000" },
//   darkButton: { backgroundColor: "#FFFFFF" },
//   loginButtonText: {
//     fontWeight: "500",
//     fontSize: 16,
//   },
//   lightButtonText: { color: "#FFFFFF" },
//   darkButtonText: { color: "#000000" },

//   // Footer
//   registerContainer: {
//     alignItems: "center",
//     marginTop: 24,
//     paddingBottom: 40,
//   },
//   footerText: {
//     fontSize: 14,
//     color: "#525252",
//   },
//   registerText: {
//     color: "#16a34a", // green-600
//     fontWeight: "600",
//     marginTop: 4,
//   },
// });
import React, { useState } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  Pressable, 
  ScrollView, 
  Platform,
  KeyboardAvoidingView
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    if (!email || !password) return;
    // Directing to patient home as per your previous logic
    router.replace("/(patient)/home");
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient matching Index.tsx */}
      <LinearGradient
        colors={["#f0fdf4", "#ffffff", "#eff6ff"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header with Gradient */}
      <LinearGradient
        colors={["#22c55e", "#3b82f6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Pressable onPress={() => router.back()} hitSlop={20} style={styles.backButton}>
              <ArrowLeft size={22} color="#fff" />
            </Pressable>
            <Text style={styles.headerTitle}>Login</Text>
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
          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputContainer}>
              <Mail size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <Lock size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                {showPassword ? (
                  <EyeOff size={20} color="#6B7280" />
                ) : (
                  <Eye size={20} color="#6B7280" />
                )}
              </Pressable>
            </View>

            <Pressable style={styles.forgotPassword}>
              <Text style={styles.blueText}>Forgot Password?</Text>
            </Pressable>

            {/* Login Button with Gradient */}
            <Pressable
              onPress={handleLogin}
              disabled={!email || !password}
              style={({ pressed }: { pressed: boolean }) => [
                styles.loginButtonWrapper,
                (!email || !password) && { opacity: 0.6 },
                pressed && { opacity: 0.9 }
              ]}
            >
              <LinearGradient
                colors={["#22c55e", "#3b82f6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginButton}
              >
                <Text style={styles.loginButtonText}>Login</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.footerText}>Don’t have an account?</Text>
            <Pressable onPress={() => router.push("/(auth)/register")}>
              <Text style={styles.registerText}>Register Now / ابھی رجسٹر ہوں</Text>
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
    paddingBottom: 40,
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
    color: "#FFFFFF",
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
    marginTop: -20,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    // Native shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 20,
    height: 52,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    alignItems: "flex-end",
    marginBottom: 28,
  },
  blueText: {
    color: "#3b82f6",
    fontWeight: "500",
    fontSize: 14,
  },
  loginButtonWrapper: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  loginButton: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 17,
  },
  registerContainer: {
    alignItems: "center",
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
    color: "#6B7280",
  },
  registerText: {
    color: "#16a34a",
    fontWeight: "700",
    fontSize: 15,
    marginTop: 6,
  },
});