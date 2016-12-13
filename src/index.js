import React, { Component, PropTypes } from 'react'
import { PanResponder, TouchableOpacity, Slider, View, Image, StyleSheet } from 'react-native'
import tinycolor from 'tinycolor2'

/**
 * Converts color to hsv representation.
 * @param {string} color any color represenation - name, hexa, rgb
 * @return {object} { h: number, s: number, v: number } object literal
 */
export function toHsv(color) {
  return tinycolor(color).toHsv()
}

/**
 * Converts hsv object to hexa color string.
 * @param {object} hsv { h: number, s: number, v: number } object literal
 * @return {string} color in hexa representation
 */
export function fromHsv(hsv) {
  return tinycolor(hsv).toHexString()
}

export class ColorPicker extends Component {

  constructor(props, ctx) {
    super(props, ctx)
    this.state = {
      width: 0,
      height: 0,
      color: { h: 0, s: 1, v: 1 },
    }
    if (props.oldColor) {
      this.state.color = tinycolor(props.oldColor).toHsv()
    }
    if (props.defaultColor) {
      this.state.color = tinycolor(props.defaultColor).toHsv()
    }
    this._pageX = 0
    this._pageY = 0
    this._onLayout = this._onLayout.bind(this)
    this._onSValueChange = this._onSValueChange.bind(this)
    this._onVValueChange = this._onVValueChange.bind(this)
    this._onColorSelected = this._onColorSelected.bind(this)
    this._onOldColorSelected = this._onOldColorSelected.bind(this)
  }

  _getColor() {
    const passedColor = typeof this.props.color === 'string'
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

  _onSValueChange(s) {
    const { h, v } = this._getColor()
    this._onColorChange({ h, s, v })
  }

  _onVValueChange(v) {
    const { h, s } = this._getColor()
    this._onColorChange({ h, s, v })
  }

  _onColorChange(color) {
    this.setState({ color })
    if (this.props.onColorChange) {
      this.props.onColorChange(color)
    }
  }

  _onLayout(l) {
    const layout = l.nativeEvent.layout
    if (['width', 'height'].some(key => layout[key] !== this.state[key])) {
      const { width, height } = layout
      this.refs.container.measure((x, y, width, height, pageX, pageY) => {
        // picker position in the screen
        this._pageX = pageX
        this._pageY = pageY
      })
      this.setState({ width, height })
    }
  }

  _computeHValue(x, y) {
    const pickerSize = computePickerSize({ width: this.state.width })
    const mx = pickerSize / 2
    const my = pickerSize / 2
    const dx = x - mx
    const dy = y - my
    const rad = Math.atan2(dx, dy) + Math.PI + Math.PI / 2
    return rad * 180 / Math.PI % 360
  }

  _hValueToRad(deg) {
    const rad = deg * Math.PI / 180
    return rad - Math.PI - Math.PI / 2
  }

  getColor() {
    return tinycolor(this._getColor()).toHexString()
  }

  componentWillMount() {
    const handleColorChange = ({ x, y }) => {
      const { s, v } = this._getColor()
      const h = this._computeHValue(x - this._pageX, y - this._pageY)
      this._onColorChange({ h, s, v })
    }
    this._pickerResponder = createPanResponder({
      onStart: handleColorChange,
      onMove: handleColorChange,
    })
  }

  render() {
    const { width, height } = this.state
    const { oldColor } = this.props
    const color = this._getColor()
    const { h, s, v } = color
    const angle = this._hValueToRad(h)
    const hasDimensions = width && height
    const selectedColor = tinycolor(color).toHexString()
    const indicatorColor = tinycolor({ h, s: 1, v: 1 }).toHexString()
    const computed = makeComputedStyles({ width, height, selectedColor, indicatorColor, oldColor, angle })
    return (
      <View style={styles.container} onLayout={this._onLayout} ref='container'>
        {!hasDimensions ? null :
        <View>
          <View style={[styles.pickerContainer, computed.pickerContainer]} {...this._pickerResponder.panHandlers}>
            <Image
              source={require('../resources/color-circle.png')}
              resizeMode='contain'
              style={[styles.pickerImage]}
            />
            <View style={[styles.pickerIndicator, computed.pickerIndicator]} />
          </View>
          <View style={styles.controls}>
            <Slider value={s} onValueChange={this._onSValueChange} />
            <Slider value={v} onValueChange={this._onVValueChange} />
          </View>
          {oldColor &&
          <TouchableOpacity
            style={[styles.selectedPreview, computed.selectedPreview]}
            onPress={this._onColorSelected}
            activeOpacity={0.7}
          />
          }
          {oldColor &&
          <TouchableOpacity
            style={[styles.originalPreview, computed.originalPreview]}
            onPress={this._onOldColorSelected}
            activeOpacity={0.7}
          />
          }
          {!oldColor &&
          <TouchableOpacity
            style={[styles.selectedFullPreview, computed.selectedFullPreview]}
            onPress={this._onColorSelected}
            activeOpacity={0.7}
          />
          }
        </View>
        }
      </View>
    )
  }

}

ColorPicker.propTypes = {
  color: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({ h: PropTypes.number, s: PropTypes.number, v: PropTypes.number }),
  ]),
  defaultColor: PropTypes.string,
  oldColor: PropTypes.string,
  onColorChange: PropTypes.func,
  onColorSelected: PropTypes.func,
  onOldColorSelected: PropTypes.func,
}

const makeComputedStyles = ({
  width,
  indicatorColor,
  selectedColor,
  oldColor,
  angle,
}) => {
  const pickerSize = computePickerSize({ width })
  const summarySize = 0.5 * pickerSize
  const indicatorPickerRatio = 42 / 510 // computed from picker image
  const indicatorSize = indicatorPickerRatio * pickerSize
  const pickerPadding = indicatorSize / 3
  const indicatorRadius = pickerSize / 2 - indicatorSize / 2 - (pickerPadding - 1)
  const mx = pickerSize / 2
  const my = pickerSize / 2
  const dx = Math.cos(angle) * indicatorRadius
  const dy = Math.sin(angle) * indicatorRadius
  return {
    pickerContainer: {
      padding: pickerPadding,
      width: pickerSize,
      height: pickerSize,
    },
    pickerIndicator: {
      top: mx + dx - indicatorSize / 2,
      left: my + dy - indicatorSize / 2,
      width: indicatorSize,
      height: indicatorSize,
      borderRadius: indicatorSize / 2,
      backgroundColor: indicatorColor,
    },
    selectedPreview: {
      width: summarySize / 2,
      height: summarySize,
      top: pickerSize / 2 - summarySize / 2,
      left: pickerSize / 2,
      borderTopRightRadius: summarySize / 2,
      borderBottomRightRadius: summarySize / 2,
      backgroundColor: selectedColor,
    },
    originalPreview: {
      width: summarySize / 2,
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
  container: {
    flex: 1,
  },
  pickerContainer: {
  },
  pickerImage: {
    flex: 1,
    width: null,
    height: null,
  },
  pickerIndicator: {
    position: 'absolute',
    // Shadow only works on iOS.
    shadowColor: 'black',
    shadowOpacity: 0.3,
    shadowOffset: { width: 3, height: 3 },
    shadowRadius: 4,

    // This will elevate the view on Android, causing shadow to be drawn.
    elevation: 5,
  },
  selectedPreview: {
    position: 'absolute',
    borderLeftWidth: 0,
  },
  originalPreview: {
    position: 'absolute',
    borderRightWidth: 0,
  },
  selectedFullPreview: {
    position: 'absolute',
  },
})

function computePickerSize({ width }) {
  return width
}

const fn = () => true;
const createPanResponder = ({ onStart = fn, onMove = fn, onEnd = fn }) => {
  return PanResponder.create({
    onStartShouldSetPanResponder: fn,
    onStartShouldSetPanResponderCapture: fn,
    onPanResponderTerminationRequest: fn,
    onPanResponderGrant: (evt, state) => {
      return onStart({ x: state.x0, y: state.y0 }, evt, state)
    },
    onPanResponderMove: (evt, state) => {
      return onMove({ x: state.moveX, y: state.moveY }, evt, state)
    },
    onPanResponderRelease: (evt, state) => {
      return onEnd({ x: state.moveX, y: state.moveY }, evt, state)
    },
  })
}
