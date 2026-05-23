import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { patientHeaderStyles as s } from '@/styles/patientScreen';

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  colors?: [string, string];
};

export function PatientScreenHeader({
  title,
  subtitle,
  onBack,
  colors = ['#22c55e', '#3b82f6'],
}: Props) {
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={s.gradient}
    >
      <SafeAreaView edges={['top']} style={s.safe}>
        <View style={s.content}>
          {onBack ? (
            <Pressable
              onPress={onBack}
              style={({ pressed }) => [s.backButton, { opacity: pressed ? 0.7 : 1 }]}
              hitSlop={8}
            >
              <ArrowLeft size={20} color="#ffffff" />
            </Pressable>
          ) : null}
          <View style={s.textBlock}>
            <Text style={s.title} numberOfLines={2}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={s.subtitle} numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
