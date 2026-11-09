import Svg, { Path } from "react-native-svg";
import { colors } from "@/constants/design";

export function Logo({ size = 56 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Path
        d="M6 20V10a4 4 0 0 1 4-4h10M44 6h10a4 4 0 0 1 4 4v10M6 44v10a4 4 0 0 0 4 4h10M58 44v10a4 4 0 0 1-4 4H44"
        fill="none"
        stroke={colors.primary}
        strokeWidth={5}
        strokeLinecap="round"
      />
      <Path
        d="M46 18C30 17 19 23 18 37c-.3 3 .3 6 1 8 2 1 5 1.400 8 1.100C40 45 47 34 46 18Z"
        fill={colors.primary}
      />
      <Path
        d="M20 44c5-8 11-14 18-18"
        fill="none"
        stroke={colors.surface}
        strokeWidth={2.500}
        strokeLinecap="round"
      />
    </Svg>
  );
}
