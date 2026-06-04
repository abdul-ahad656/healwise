import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <View style={{ flexDirection: 'row', gap: 10, padding: 10 }}>
      <Pressable onPress={() => changeLanguage('en')}>
        <Text style={{ color: i18n.language === 'en' ? 'blue' : 'black' }}>English</Text>
      </Pressable>
      <Pressable onPress={() => changeLanguage('ur')}>
        <Text style={{ color: i18n.language === 'ur' ? 'blue' : 'black' }}>اردو</Text>
      </Pressable>
    </View>
  );
}
