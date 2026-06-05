import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { FileText, Calendar } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export default function PatientLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('tab_home'),
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="prescriptions"
        options={{
          title: t('tab_prescriptions'),
          tabBarIcon: ({ color, size }) => (
            <FileText color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: t('tab_appointments'),
          tabBarIcon: ({ color, size }) => (
            <Calendar color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tab_profile'),
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="user" color={color} size={size} />
          ),
        }}
      />

      {/* Hidden routes — payment is reached from booking flow only */}
      <Tabs.Screen name="payment" options={{ href: null }} />
      <Tabs.Screen name="medical-reports" options={{ href: null }} />
      <Tabs.Screen name="health-tips" options={{ href: null }} />
      <Tabs.Screen name="medicine-awareness" options={{ href: null }} />
      <Tabs.Screen name="medicine-compare" options={{ href: null }} />
      <Tabs.Screen name="ai-analysis" options={{ href: null }} />
      <Tabs.Screen name="consult-doctor/index" options={{ href: null }} />
      <Tabs.Screen name="consult-doctor/booking" options={{ href: null }} />
      <Tabs.Screen name="symptom-checker/index" options={{ href: null }} />
      <Tabs.Screen name="symptom-checker/result" options={{ href: null }} />
      <Tabs.Screen name="symptom-history/index" options={{ href: null }} />
      <Tabs.Screen name="symptom-history/detail" options={{ href: null }} />
      <Tabs.Screen name="medicine-history/index" options={{ href: null }} />
      <Tabs.Screen name="medicine-history/detail" options={{ href: null }} />
      <Tabs.Screen name="appointment-history/index" options={{ href: null }} />
    </Tabs>
  );
}
