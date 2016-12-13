import React, { Component, PropTypes } from 'react'
import { PanResponder, TouchableOpacity, Slider, View, Image, StyleSheet } from 'react-native'
import tinycolor from 'tinycolor2'

export class ColorPicker extends Component {

  constructor(props, ctx) {
    super(props, ctx)
    this.state = { width: 0, height: 0, H: 0, S: 100, V: 100 }
    if (props.originalColor) {
      const { h: H, s: S, v: V } = tinycolor(props.originalColor).toHsv()
      Object.assign(this.state, { H, S, V })
    }
    this.pageX = 0
    this.pageY = 0
    this.onLayout = this.onLayout.bind(this)
    this.onSValueChange = this.onSValueChange.bind(this)
    this.onVValueChange = this.onVValueChange.bind(this)
    this.onColorPicked = this.onColorPicked.bind(this)
    this.onOriginalColorPressed = this.onOriginalColorPressed.bind(this)
  }

  onColorPicked() {
    const { H, S, V } = this.state
    const { onColorPicked } = this.props
    const color = tinycolor({ h: H, s: S, v: V }).toRgbString()
    onColorPicked && onColorPicked(color)
  }

  onOriginalColorPressed() {
    const { originalColor } = this.props
    const { h: H, s: S, v: V } = tinycolor(originalColor).toHsv()
    this.setState({ H, S, V })
  }

  onSValueChange(S) {
    this.setState({ S })
  }

  onVValueChange(V) {
    this.setState({ V })
  }

  onLayout(l) {
    const layout = l.nativeEvent.layout
    if (['width', 'height'].some(key => layout[key] !== this.state[key])) {
      const { width, height } = layout
      this.refs.container.measure((x, y, width, height, pageX, pageY) => {
        // picker position in the screen
        this.pageX = pageX
        this.pageY = pageY
      })
      this.setState({ width, height })
    }
  }

  computeHValue(x, y) {
    // TODO: make pickerSize at one place
    const pickerSize = this.state.width
    const mx = pickerSize / 2
    const my = pickerSize / 2
    const dx = x - mx
    const dy = y - my
    const rad = Math.atan2(dx, dy) + Math.PI + Math.PI / 2
    return rad * 180 / Math.PI % 360
  }

  hValueToRad(deg) {
    const rad = deg * Math.PI / 180
    return rad - Math.PI - Math.PI / 2
  }

  componentWillMount() {
    this._pickerResponder = createPanResponder({
      onStart: ({ x, y }) => {
        this.setState({ H: this.computeHValue(x - this.pageX, y - this.pageY) })
      },
      onMove: ({ x, y }) => {
        this.setState({ H: this.computeHValue(x - this.pageX, y - this.pageY) })
      },
    })
  }

  render() {
    const { width, height, H, S, V } = this.state
    const { originalColor } = this.props
    const angle = this.hValueToRad(H)
    const hasDimensions = width && height
    const selectedColor = tinycolor({ h: H, s: S, v: V }).toRgbString()
    const indicatorColor = tinycolor({ h: H, s: 1, v: 1 }).toRgbString()
    const s = makeComputedStyles({ width, height, selectedColor, indicatorColor, originalColor, angle })
    return (
      <View style={styles.container} onLayout={this.onLayout} ref='container'>
        {!hasDimensions ? null :
        <View>
          <View style={[styles.pickerContainer, s.pickerContainer]} {...this._pickerResponder.panHandlers}>
            <Image
              source={require('../resources/color-circle.png')}
              resizeMode='contain'
              style={[styles.pickerImage]}
            />
            <View style={[styles.pickerIndicator, s.pickerIndicator]} />
          </View>
          <View style={styles.controls}>
            <Slider value={S} onValueChange={this.onSValueChange} />
            <Slider value={V} onValueChange={this.onVValueChange} />
          </View>
          {originalColor &&
          <TouchableOpacity
            style={[styles.selectedPreview, s.selectedPreview]}
            onPress={this.onColorPicked}
            activeOpacity={0.7}
          />
          }
          {originalColor &&
          <TouchableOpacity
            style={[styles.originalPreview, s.originalPreview]}
            onPress={this.onOriginalColorPressed}
            activeOpacity={0.7}
          />
          }
          {!originalColor &&
          <TouchableOpacity
            style={[styles.selectedFullPreview, s.selectedFullPreview]}
            onPress={this.onColorPicked}
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
  originalColor: PropTypes.string,
  onColorPicked: PropTypes.func,
}

const makeComputedStyles = ({
  width,
  indicatorColor,
  selectedColor,
  originalColor,
  angle,
}) => {
  const pickerSize = width
  const summarySize = 0.5 * pickerSize
  const indicatorPickerRatio = 42 / 510 // computed from picker image
  const indicatorSize = indicatorPickerRatio * pickerSize
  const indicatorRadius = pickerSize / 2 - indicatorSize / 2
  const mx = pickerSize / 2
  const my = pickerSize / 2
  const dx = Math.cos(angle) * indicatorRadius
  const dy = Math.sin(angle) * indicatorRadius
  return {
    pickerContainer: {
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
      backgroundColor: originalColor,
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
