// import { ThemedText } from '@/components/themed-text';
// import { ThemedView } from '@/components/themed-view';
// import { Link } from 'expo-router';
// import { StyleSheet, View } from 'react-native';

// export default function LandingScreen() {
//   return (
//     <ThemedView style={styles.container}>
//       <ThemedText type="title" style={styles.title}>Healwise</ThemedText>
//       <ThemedText type="subtitle" style={styles.subtitle}>Welcome to Healwise App</ThemedText>

//       <View style={styles.linkContainer}>
//         <Link href="/(auth)/login" asChild>
//           <ThemedText type="link">Login</ThemedText>
//         </Link>
//         <Link href="/(auth)/register" asChild>
//           <ThemedText type="link">Register</ThemedText>
//         </Link>
//       </View>

//       <View style={styles.divider} />

//       <ThemedText type="defaultSemiBold">Dev Links:</ThemedText>
//       <View style={styles.linkContainer}>
//         <Link href="/(patient)/home" asChild>
//           <ThemedText type="link">Patient Home</ThemedText>
//         </Link>
//         <Link href="/(doctor)/dashboard" asChild>
//           <ThemedText type="link">Doctor Dashboard</ThemedText>
//         </Link>
//         <Link href="/(admin)/dashboard" asChild>
//           <ThemedText type="link">Admin Dashboard</ThemedText>
//         </Link>
//       </View>
//     </ThemedView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 20,
//   },
//   title: {
//     marginBottom: 10,
//   },
//   subtitle: {
//     marginBottom: 30,
//   },
//   linkContainer: {
//     marginTop: 20,
//     gap: 15,
//     alignItems: 'center',
//   },
//   divider: {
//     height: 1,
//     width: '80%',
//     backgroundColor: '#ccc',
//     marginVertical: 30,
//   },
// });


import React from "react";
import { StyleSheet, View, Text, Pressable, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { Heart, Shield, Sparkles } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function SplashScreen() {
  const router = useRouter();

  const handleContinue = () => {
    // Navigate to the login screen inside the (auth) group
    router.push("/(auth)/login");
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={["#f0fdf4", "#ffffff", "#eff6ff"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative circles */}
      <View style={[styles.circle, { top: 40, left: 40, backgroundColor: "#bbf7d0", width: 80, height: 80 }]} />
      <View style={[styles.circle, { top: 120, right: 30, backgroundColor: "#bfdbfe", width: 60, height: 60 }]} />
      <View style={[styles.circle, { bottom: 200, left: 20, backgroundColor: "#86efac", width: 50, height: 50 }]} />
      <View style={[styles.circle, { bottom: 100, right: 50, backgroundColor: "#93c5fd", width: 90, height: 90 }]} />

      <SafeAreaView style={styles.content}>
        <View style={styles.logoWrapper}>
          {/* Main Logo */}
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={["#22c55e", "#3b82f6"]}
              style={styles.logoGradient}
            >
              <Heart size={64} color="white" fill="white" />
            </LinearGradient>

            {/* Floating badges */}
            <View style={styles.badgeTop}>
              <Sparkles size={16} color="white" />
            </View>
            <View style={styles.badgeBottom}>
              <Shield size={16} color="white" />
            </View>
          </View>

          {/* App Name */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>HealWise</Text>
            <LinearGradient
              colors={["#22c55e", "#3b82f6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.underline}
            />
            <Text style={styles.subtitle}>Your Smart Health Companion</Text>
            <Text style={styles.subtitleUrdu}>آپ کا ذہین صحت ساتھی</Text>
          </View>
        </View>

        {/* Bottom section */}
        <View style={styles.buttonContainer}>
          <Pressable onPress={handleContinue}>
            {({ pressed }: { pressed: boolean }) => (
              <LinearGradient
                colors={pressed ? ["#16a34a", "#2563eb"] : ["#22c55e", "#3b82f6"]}
                style={styles.button}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>Get Started / شروع کریں</Text>
                <Sparkles size={18} color="white" />
              </LinearGradient>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  circle: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.2,
  },
  content: {
    flex: 1,
    padding: 32,
    justifyContent: "space-between",
  },
  logoWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    position: "relative",
    marginBottom: 32,
  },
  logoGradient: {
    width: 128,
    height: 128,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    // Elevation for Android
    elevation: 10,
  },
  badgeTop: {
    position: "absolute",
    top: -12,
    right: -12,
    width: 32,
    height: 32,
    backgroundColor: "#facc15",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  badgeBottom: {
    position: "absolute",
    bottom: -8,
    left: -8,
    width: 28,
    height: 28,
    backgroundColor: "#4ade80",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  textContainer: {
    alignItems: "center",
  },
  title: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 12,
  },
  underline: {
    width: 64,
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 20,
    color: "#4b5563",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitleUrdu: {
    fontSize: 18,
    color: "#6b7280",
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
    paddingBottom: 20,
  },
  button: {
    flexDirection: "row",
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    elevation: 5,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});
