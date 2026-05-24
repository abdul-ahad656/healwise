import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { adminHeaderStyles as s } from '@/styles/adminScreen';

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
};

export function AdminScreenHeader({ title, subtitle, onBack, rightElement }: Props) {
  return (
    <LinearGradient
      colors={['#0f766e', '#22c55e']}
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
          {rightElement ? <View style={s.rightSlot}>{rightElement}</View> : null}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
