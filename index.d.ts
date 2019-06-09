declare module 'react-native-color-picker' {
  import * as React from 'react';

  export interface IPicker {
    color: string;
    defaultColor: string | { h: number; s: number; v: number };
    oldColor?: string;
    style: object;
    onColorSelected: (selectedColor: { h: number; s: number; v: number }) => void;
    onColorChange: (selectedColor: { h: number; s: number; v: number }) => void;
    onOldColorSelected?: (oldColor: { h: number; s: number; v: number }) => void;
    hideSliders?: boolean;
  }

  export const ColorPicker: React.ComponentType<IPicker>;
  export const TriangleColorPicker: React.ComponentType<IPicker>;
  export const toHsv: (color: string) => { h: number; s: number; v: number };
  export const fromHsv: (hsv: { h: number; s: number; v: number }) => string;
}
