import { Image, ImageStyle, StyleProp, View, ViewStyle } from 'react-native';

import { APP_ICON } from '@/constants/branding';

type Props = {
  size?: number;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
};

/** HealWise launcher image (replaces default Expo / React artwork in UI). */
export function AppBrandIcon({ size = 96, style, containerStyle }: Props) {
  const radius = Math.round(size * 0.22);

  return (
    <View style={containerStyle}>
      <Image
        source={APP_ICON}
        style={[
          {
            width: size,
            height: size,
            borderRadius: radius,
          },
          style,
        ]}
        resizeMode="cover"
        accessibilityLabel="HealWise app icon"
      />
    </View>
  );
}
