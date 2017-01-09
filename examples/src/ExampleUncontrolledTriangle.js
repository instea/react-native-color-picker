import React from 'react'
import { View, Text } from 'react-native'
import { TriangleColorPicker } from 'react-native-color-picker'

export const ExampleUncontrolledTriangle = () => (
  <View style={{flex: 1, padding: 15, backgroundColor: '#212021'}}>
    <Text style={{color: 'white'}}>React Native Color Picker - Uncontrolled</Text>
    <TriangleColorPicker
      oldColor='purple'
      onColorSelected={color => alert(`Color selected: ${color}`)}
      style={{flex: 1}}
    />
  </View>
)
