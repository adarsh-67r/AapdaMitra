import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useTheme } from "@/hooks/use-theme";

/**
 * The product mark, drawn the same way as apps/web/src/components/BrandMark.tsx.
 *
 * A pulse trace inside a bordered square — the shape of a monitor readout,
 * which is what this system is. Drawn rather than shipped as a PNG so it takes
 * the accent colour from the theme and stays sharp on every screen density; the
 * two files carry the same path data, so the app and the site wear one mark.
 *
 * It always sits beside the word Aapda Mitra, so it is decorative: a screen
 * reader announcing it too would say the name twice.
 */
export function BrandMark({ size = 22 }: { size?: number }) {
  const theme = useTheme();
  const glyph = Math.round(size * 0.62);

  return (
    <View
      accessible={false}
      style={{
        width: size,
        height: size,
        borderWidth: 1,
        borderRadius: 3,
        borderColor: theme.accent,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={glyph} height={glyph} viewBox="0 0 24 24" fill="none">
        <Path
          d="M3 12h4l2-7 4 14 2-7h6"
          stroke={theme.accent}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
