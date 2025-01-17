// app/emotion.d.ts
import '@mantine/core';
import type { EmotionStyles, EmotionSx } from '@mantine/emotion';

declare module '@mantine/core' {
  export interface BoxProps {
    sx?: EmotionSx;
    styles?: EmotionStyles;
  }

  export interface TextProps {
    sx?: EmotionSx;
    styles?: EmotionStyles;
  }

  export interface ButtonProps {
    sx?: EmotionSx;
    styles?: EmotionStyles;
  }

  export interface CardProps {
    sx?: EmotionSx;
    styles?: EmotionStyles;
  }

  export interface GroupProps {
    sx?: EmotionSx;
    styles?: EmotionStyles;
  }

  export interface SelectProps {
    sx?: EmotionSx;
    styles?: EmotionStyles;
  }

  // Add other component interfaces as needed
}
