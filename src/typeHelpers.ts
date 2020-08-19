export type HsvColor = { h: number; s: number; v: number };

export type Point2D = { x: number; y: number };

export interface IPickerProps {
  color?: string | HsvColor;
  defaultColor?: string | HsvColor;
  oldColor?: string;
  style?: Record<string, unknown>;
  onColorSelected?: (selectedColor: string) => void;
  onColorChange?: (selectedColor: HsvColor) => void;
  onOldColorSelected?: (oldColor: string) => void;
  hideSliders?: boolean;
}
