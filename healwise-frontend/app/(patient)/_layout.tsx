// import { Tabs } from 'expo-router';
// import React from 'react';
// import { Platform } from 'react-native';

// import { HapticTab } from '@/components/haptic-tab';
// import { IconSymbol } from '@/components/ui/icon-symbol';
// import TabBarBackground from '@/components/ui/tab-bar-background';
// import { useColorScheme } from '@/hooks/use-color-scheme';

// export default function PatientLayout() {
//   const colorScheme = useColorScheme();

//   return (
//     <Tabs
//       screenOptions={{
//         tabBarActiveTintColor: '#0a7ea4',
//         headerShown: false,
//         tabBarButton: HapticTab,
//         tabBarBackground: TabBarBackground,
//         tabBarStyle: Platform.select({
//           ios: {
//             // Use a transparent background on iOS to show the blur effect
//             position: 'absolute',
//           },
//           default: {},
//         }),
//       }}>
//       <Tabs.Screen
//         name="home"
//         options={{
//           title: 'Home',
//           tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
//         }}
//       />
//       <Tabs.Screen
//         name="symptom-checker"
//         options={{
//           title: 'Check Symptoms',
//           tabBarIcon: ({ color }) => <IconSymbol size={28} name="heart.fill" color={color} />,
//         }}
//       />
//       <Tabs.Screen
//         name="consult-doctor"
//         options={{
//           title: 'Consult',
//           tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.2.fill" color={color} />,
//         }}
//       />
//       <Tabs.Screen
//         name="profile"
//         options={{
//           title: 'Profile',
//           tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.circle.fill" color={color} />,
//         }}
//       />
      
//       {/* Hide other screens from the tab bar but keep them in the navigator */}
//       <Tabs.Screen name="ai-analysis" options={{ href: null }} />
//       <Tabs.Screen name="appointments" options={{ href: null }} />
//       <Tabs.Screen name="medicine-compare" options={{ href: null }} />
//       <Tabs.Screen name="medical-reports" options={{ href: null }} />
//       <Tabs.Screen name="health-tips" options={{ href: null }} />
//       <Tabs.Screen name="medicine-awareness" options={{ href: null }} />
//       <Tabs.Screen name="feedback" options={{ href: null }} />
//     </Tabs>
//   );
// }


import { Tabs } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";

export default function PatientLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <FontAwesome name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <FontAwesome name="user" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
