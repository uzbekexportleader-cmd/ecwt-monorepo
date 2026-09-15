import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Defs, Ellipse, Mask, Rect } from 'react-native-svg';

import { colors } from '../theme';

/** EcwtWordmark'dagi kabi: web'da bu proplar SVG DOM'ga sizib chiqmasin */
type RawEllipseProps = React.ComponentProps<typeof Ellipse> & {
  collapsable?: boolean;
  needsOffscreenAlphaCompositing?: boolean;
};

const RawEllipse = React.forwardRef<React.ComponentRef<typeof Ellipse>, RawEllipseProps>(
  ({ collapsable: _collapsable, needsOffscreenAlphaCompositing: _compositing, ...rest }, ref) => (
    <Ellipse ref={ref} {...rest} />
  ),
);
const AnimatedEllipse = Animated.createAnimatedComponent(RawEllipse);

/** Oval ramkaning viewBox o'lchamlari */
export const VB_W = 300;
export const VB_H = 460;
export const OVAL_RX = 108;
export const OVAL_RY = 148;
export const OVAL_CX = VB_W / 2;
export const OVAL_CY = VB_H / 2 - 20;

/** Ramka ranglari: hali tayyor emas / yuz to'g'ri joylashdi */
export const RING_WAITING = '#FF4D5E';
export const RING_READY = '#3ED598';

/**
 * Kamera tasviri ustidagi oval oyna.
 *
 * Atrofi qorong'i, o'rtasi ochiq; chetidagi halqa rangi yuz holatini
 * bildiradi: qizil — hali tayyor emas, yashil — joyida.
 */
export function FaceOval({
  color,
  strokeWidth,
  strokeOpacity,
}: {
  color: string;
  strokeWidth: Animated.AnimatedInterpolation<number> | number;
  strokeOpacity: Animated.AnimatedInterpolation<number> | number;
}) {
  return (
    <Svg
      style={StyleSheet.absoluteFill}
      width="100%"
      height="100%"
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      pointerEvents="none"
    >
      <Defs>
        <Mask id="ovalMask">
          <Rect x="0" y="0" width={VB_W} height={VB_H} fill="#FFFFFF" />
          <Ellipse cx={OVAL_CX} cy={OVAL_CY} rx={OVAL_RX} ry={OVAL_RY} fill="#000000" />
        </Mask>
      </Defs>
      <Rect
        x="0"
        y="0"
        width={VB_W}
        height={VB_H}
        fill={colors.bg}
        fillOpacity="0.82"
        mask="url(#ovalMask)"
      />
      <AnimatedEllipse
        cx={OVAL_CX}
        cy={OVAL_CY}
        rx={OVAL_RX}
        ry={OVAL_RY}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeOpacity={strokeOpacity}
      />
    </Svg>
  );
}
