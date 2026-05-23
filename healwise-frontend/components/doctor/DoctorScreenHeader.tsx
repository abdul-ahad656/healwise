import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { doctorHeaderStyles as s } from '@/styles/doctorScreen';

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
};

export function DoctorScreenHeader({ title, subtitle, onBack }: Props) {
  return (
    <LinearGradient
      colors={['#1d4ed8', '#22c55e']}
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
