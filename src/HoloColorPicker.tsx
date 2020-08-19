import React from "react"
import {
  I18nManager,
  Image,
  InteractionManager,
  PanResponderInstance,
  Slider,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native"
import tinycolor from "tinycolor2"

import { HsvColor, IPickerProps, Point2D } from "./typeHelpers"
import { createPanResponder } from "./utils"

type SliderProps = {
  onValueChange?: (value: number) => void;
  value?: number;
};

export interface IHoloPickerProps extends IPickerProps {
  sliderComponent?: React.Component<SliderProps>;
}

export type IHoloPickerState = {
  color: HsvColor;
  pickerSize: number;
};

export class HoloColorPicker extends React.PureComponent<
  IHoloPickerProps,
  IHoloPickerState
> {
  private _layout: { width: number; height: number; x: number; y: number };
  private _pageX: number;
  private _pageY: number;
  private _isRTL: boolean;
  private _pickerResponder: PanResponderInstance;

  constructor(props: IHoloPickerProps, ctx: any) {
    super(props, ctx)
    const state = {
      color: { h: 0, s: 1, v: 1 },
      pickerSize: null,
    }
    if (props.oldColor) {
      state.color = tinycolor(props.oldColor).toHsv()
    }
    if (props.defaultColor) {
      state.color = tinycolor(props.defaultColor).toHsv()
    }
    this.state = state
    this._layout = { width: 0, height: 0, x: 0, y: 0 }
    this._pageX = 0
    this._pageY = 0
    this._onLayout = this._onLayout.bind(this)
    this._onSValueChange = this._onSValueChange.bind(this)
    this._onVValueChange = this._onVValueChange.bind(this)
    this._onColorSelected = this._onColorSelected.bind(this)
    this._onOldColorSelected = this._onOldColorSelected.bind(this)
    this._isRTL = I18nManager.isRTL
    this._pickerResponder = createPanResponder({
      onStart: this._handleColorChange,
      onMove: this._handleColorChange,
    })
  }

  _getColor() {
    const passedColor =
      typeof this.props.color === "string"
        ? tinycolor(this.props.color).toHsv()
        : this.props.color
    return passedColor || this.state.color
  }

  _onColorSelected() {
    const { onColorSelected } = this.props
    const color = tinycolor(this._getColor()).toHexString()
    onColorSelected && onColorSelected(color)
  }

  _onOldColorSelected() {
    const { oldColor, onOldColorSelected } = this.props
    const color = tinycolor(oldColor)
    this.setState({ color: color.toHsv() })
    onOldColorSelected && onOldColorSelected(color.toHexString())
  }

  _onSValueChange(s: number) {
    const { h, v } = this._getColor()
    this._onColorChange({ h, s, v })
  }

  _onVValueChange(v: number) {
    const { h, s } = this._getColor()
    this._onColorChange({ h, s, v })
  }

  _onColorChange(color: { h: number; s: any; v: any }) {
    this.setState({ color })
    if (this.props.onColorChange) {
      this.props.onColorChange(color)
    }
  }

  _onLayout(l: {
    nativeEvent: {
      layout: { width: number; height: number; x: number; y: number };
    };
  }) {
    this._layout = l.nativeEvent.layout
    const { width, height } = this._layout
    const pickerSize = Math.min(width, height)
    if (this.state.pickerSize !== pickerSize) {
      this.setState({ pickerSize })
    }
    // layout.x, layout.y is always 0
    // we always measure because layout is the same even though picker is moved on the page
    InteractionManager.runAfterInteractions(() => {
      // measure only after (possible) animation ended
      this.refs.pickerContainer &&
        (this.refs.pickerContainer as any).measure(
          (
            x: number,
            y: number,
            width: number,
            height: number,
            pageX: number,
            pageY: number
          ) => {
            // picker position in the screen
            this._pageX = pageX
            this._pageY = pageY
          }
        )
    })
  }

  _handleColorChange = ({ x, y }: Point2D) => {
    const { s, v } = this._getColor()
    const marginLeft = (this._layout.width - this.state.pickerSize) / 2
    const marginTop = (this._layout.height - this.state.pickerSize) / 2
    const relativeX = x - this._pageX - marginLeft
    const relativeY = y - this._pageY - marginTop
    const h = this._computeHValue(relativeX, relativeY)
    this._onColorChange({ h, s, v })

    return true
  };

  _computeHValue(x: number, y: number) {
    const mx = this.state.pickerSize / 2
    const my = this.state.pickerSize / 2
    const dx = x - mx
    const dy = y - my
    const rad = Math.atan2(dx, dy) + Math.PI + Math.PI / 2
    return ((rad * 180) / Math.PI) % 360
  }

  _hValueToRad(deg: number) {
    const rad = (deg * Math.PI) / 180
    return rad - Math.PI - Math.PI / 2
  }

  _getSlider(): typeof Slider {
    if (this.props.hideSliders) {
      return undefined
    }

    if (this.props.sliderComponent) {
      return this.props.sliderComponent as any
    }

    if (!Slider) {
      throw new Error(
        "You need to install `@react-native-community/slider` and pass it (or any other Slider compatible component) as `sliderComponent` prop"
      )
    }

    return Slider
  }

  getColor() {
    return tinycolor(this._getColor()).toHexString()
  }

  render() {
    const { pickerSize } = this.state
    const { oldColor, style } = this.props

    const color = this._getColor()
    const { h, s, v } = color
    const angle = this._hValueToRad(h)
    const selectedColor = tinycolor(color).toHexString()
    const indicatorColor = tinycolor({ h, s: 1, v: 1 }).toHexString()

    const computed = makeComputedStyles({
      pickerSize,
      selectedColor,
      indicatorColor,
      oldColor,
      angle,
      isRTL: this._isRTL,
    })

    const SliderComp = this._getSlider()

    return (
      <View style={style}>
        <View
          onLayout={this._onLayout}
          ref="pickerContainer"
          style={styles.pickerContainer}
        >
          {!pickerSize ? null : (
            <View>
              <View
                {...this._pickerResponder.panHandlers}
                style={[computed.picker]}
                collapsable={false}
              >
                <Image
                  source={require("../resources/color-circle.png")}
                  resizeMode="contain"
                  style={[styles.pickerImage]}
                />
                <View
                  style={[styles.pickerIndicator, computed.pickerIndicator]}
                />
              </View>
              {oldColor && (
                <TouchableOpacity
                  style={[styles.selectedPreview, computed.selectedPreview]}
                  onPress={this._onColorSelected}
                  activeOpacity={0.7}
                />
              )}
              {oldColor && (
                <TouchableOpacity
                  style={[styles.originalPreview, computed.originalPreview]}
                  onPress={this._onOldColorSelected}
                  activeOpacity={0.7}
                />
              )}
              {!oldColor && (
                <TouchableOpacity
                  style={[
                    styles.selectedFullPreview,
                    computed.selectedFullPreview,
                  ]}
                  onPress={this._onColorSelected}
                  activeOpacity={0.7}
                />
              )}
            </View>
          )}
        </View>
        {this.props.hideSliders ? null : (
          <View>
            <SliderComp value={s} onValueChange={this._onSValueChange} />
            <SliderComp value={v} onValueChange={this._onVValueChange} />
          </View>
        )}
      </View>
    )
  }
}

const makeComputedStyles = ({
  indicatorColor,
  selectedColor,
  oldColor,
  angle,
  pickerSize,
  isRTL,
}) => {
  const summarySize = 0.5 * pickerSize
  const indicatorPickerRatio = 42 / 510 // computed from picker image
  const indicatorSize = indicatorPickerRatio * pickerSize
  const pickerPadding = indicatorSize / 3
  const indicatorRadius = pickerSize / 2 - indicatorSize / 2 - pickerPadding
  const mx = pickerSize / 2
  const my = pickerSize / 2
  const dx = Math.cos(angle) * indicatorRadius
  const dy = Math.sin(angle) * indicatorRadius
  return {
    picker: {
      padding: pickerPadding,
      width: pickerSize,
      height: pickerSize,
    },
    pickerIndicator: {
      top: mx + dx - indicatorSize / 2,
      [isRTL ? "right" : "left"]: my + dy - indicatorSize / 2,
      width: indicatorSize,
      height: indicatorSize,
      borderRadius: indicatorSize / 2,
      backgroundColor: indicatorColor,
    },
    selectedPreview: {
      width: summarySize / 2,
      height: summarySize,
      top: pickerSize / 2 - summarySize / 2,
      left: Math.floor(pickerSize / 2),
      borderTopRightRadius: summarySize / 2,
      borderBottomRightRadius: summarySize / 2,
      backgroundColor: selectedColor,
    },
    originalPreview: {
      width: Math.ceil(summarySize / 2),
      height: summarySize,
      top: pickerSize / 2 - summarySize / 2,
      left: pickerSize / 2 - summarySize / 2,
      borderTopLeftRadius: summarySize / 2,
      borderBottomLeftRadius: summarySize / 2,
      backgroundColor: oldColor,
    },
    selectedFullPreview: {
      width: summarySize,
      height: summarySize,
      top: pickerSize / 2 - summarySize / 2,
      left: pickerSize / 2 - summarySize / 2,
      borderRadius: summarySize / 2,
      backgroundColor: selectedColor,
    },
  }
}

const styles = StyleSheet.create({
  pickerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerImage: {
    flex: 1,
    width: null,
    height: null,
  },
  pickerIndicator: {
    position: "absolute",
    // Shadow only works on iOS.
    shadowColor: "black",
    shadowOpacity: 0.3,
    shadowOffset: { width: 3, height: 3 },
    shadowRadius: 4,

    // This will elevate the view on Android, causing shadow to be drawn.
    elevation: 5,
  },
  selectedPreview: {
    position: "absolute",
    borderLeftWidth: 0,
  },
  originalPreview: {
    position: "absolute",
    borderRightWidth: 0,
  },
  selectedFullPreview: {
    position: "absolute",
  },
  pickerAlignment: {
    alignItems: "center",
  },
})
