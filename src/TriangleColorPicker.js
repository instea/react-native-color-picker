import React, { Component, PropTypes } from 'react'
import { PanResponder, Slider, View, Image, StyleSheet, InteractionManager } from 'react-native'
import tinycolor from 'tinycolor2'

export class TriangleColorPicker extends Component {

  constructor(props, ctx) {
    super(props, ctx)
    this.state = {
      color: { h: 0, s: 1, v: 1 },
      pickerSize: null,
    }
    if (props.oldColor) {
      this.state.color = tinycolor(props.oldColor).toHsv()
    }
    if (props.defaultColor) {
      this.state.color = tinycolor(props.defaultColor).toHsv()
    }
    this._layout = { width: 0, height: 0, x: 0, y: 0 }
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
      this.refs.pickerContainer && this.refs.pickerContainer.measure((x, y, width, height, pageX, pageY) => {
        // picker position in the screen
        this._pageX = pageX
        this._pageY = pageY
      })
    })
  }

  _computeHValue(x, y) {
    const mx = this.state.pickerSize / 2
    const my = this.state.pickerSize / 2
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
      const marginLeft = (this._layout.width - this.state.pickerSize) / 2
      const marginTop = (this._layout.height - this.state.pickerSize) / 2
      const relativeX = x - this._pageX - marginLeft;
      const relativeY = y - this._pageY - marginTop;
      const h = this._computeHValue(relativeX, relativeY)
      this._onColorChange({ h, s, v })
    }
    this._pickerResponder = createPanResponder({
      onStart: handleColorChange,
      onMove: handleColorChange,
    })
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
    })
    return (
      <View style={style}>
        <View onLayout={this._onLayout} ref='pickerContainer' style={styles.pickerContainer}>
          {!pickerSize ? null :
          <View>
            <View
              style={[styles.triangleContainer, computed.triangleContainer]}
            >
              <View style={[styles.triangleUnderlayingCOlor, computed.triangleUnderlayingCOlor]} />
              <Image
                style={[styles.triangleImage, computed.triangleImage]}
                source={require('../resources/hsv_triangle_mask.png')}
              />
            </View>
            <View
              {...this._pickerResponder.panHandlers}
              style={[styles.picker, computed.picker]}
              collapsable={false}
            >
              <Image
                source={require('../resources/color-circle.png')}
                resizeMode='contain'
                style={[styles.pickerImage]}
              />
              <View style={[styles.pickerIndicator, computed.pickerIndicator]} />
            </View>
          </View>
          }
        </View>
        <View>
          <Slider value={s} onValueChange={this._onSValueChange} />
          <Slider value={v} onValueChange={this._onVValueChange} />
        </View>
      </View>
    )
  }

}

TriangleColorPicker.propTypes = {
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
  indicatorColor,
  angle,
  pickerSize,
}) => {
  /* ===== INDICATOR ===== */
  const indicatorPickerRatio = 42 / 510 // computed from picker image
  const indicatorSize = indicatorPickerRatio * pickerSize
  const pickerPadding = indicatorSize / 3
  const indicatorRadius = pickerSize / 2 - indicatorSize / 2 - pickerPadding
  const mx = pickerSize / 2
  const my = pickerSize / 2
  const dx = Math.cos(angle) * indicatorRadius
  const dy = Math.sin(angle) * indicatorRadius

  /* ===== TRIANGLE ===== */
  const triangleSize = pickerSize - 6 * pickerPadding
  const triangleRadius = triangleSize / 2
  const triangleHeight = triangleRadius * 3 / 2
  const triangleWidth = 2 * triangleRadius * Math.sqrt(3 / 4) // pythagorean theorem
  const triangleTop = pickerPadding * 3
  const triangleLeft = pickerPadding * 3
  const triangleAngle = -angle + Math.PI / 3

  return {
    picker: {
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
    triangleContainer: {
      width: triangleSize,
      height: triangleSize,
      transform: [{
        rotate: triangleAngle + 'rad',
      }],
      top: triangleTop,
      left: triangleLeft,
    },
    triangleImage: {
      width: triangleWidth,
      height: triangleHeight,
    },
    triangleUnderlayingCOlor: {
      left: (triangleSize - triangleWidth) / 2,
      borderLeftWidth: triangleWidth / 2,
      borderRightWidth: triangleWidth / 2,
      borderBottomWidth: triangleHeight,
      borderBottomColor: indicatorColor,
    },
  }
}

const styles = StyleSheet.create({
  pickerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  triangleContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  triangleUnderlayingCOlor: {
    position: 'absolute',
    top: 0,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  pickerAlignment: {
    alignItems: 'center',
  }
})

const fn = () => true;
const createPanResponder = ({ onStart = fn, onMove = fn, onEnd = fn }) => {
  return PanResponder.create({
    onStartShouldSetPanResponder: fn,
    onStartShouldSetPanResponderCapture: fn,
    onMoveShouldSetPanResponder: fn,
    onMoveShouldSetPanResponderCapture: fn,
    onPanResponderTerminationRequest: fn,
    onPanResponderGrant: (evt, state) => {
      return onStart({ x: evt.nativeEvent.pageX, y: evt.nativeEvent.pageY }, evt, state)
    },
    onPanResponderMove: (evt, state) => {
      return onMove({ x: evt.nativeEvent.pageX, y: evt.nativeEvent.pageY }, evt, state)
    },
    onPanResponderRelease: (evt, state) => {
      return onEnd({ x: evt.nativeEvent.pageX, y: evt.nativeEvent.pageY }, evt, state)
    },
  })
}
