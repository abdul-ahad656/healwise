import React from 'react';
import { View, Text, Pressable, I18nManager, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Updates from 'expo-updates'; // To reload the app for RTL change

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = async (lng: string) => {
    i18n.changeLanguage(lng);
    
    // Check if the language is Urdu to enable Right-to-Left layout
    const isRTL = lng === 'ur';
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.allowRTL(isRTL);
      I18nManager.forceRTL(isRTL);
      
      // The app must restart to apply RTL layout changes properly
      if (!__DEV__ && Platform.OS !== 'web') {
        await Updates.reloadAsync();
      }
    }
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
