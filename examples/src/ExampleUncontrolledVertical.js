import React from 'react'
import { View, Text } from 'react-native'
import { ColorPicker } from 'react-native-color-picker'

export const ExampleUncontrolledVertical = () => (
  <View style={{flex: 1, padding: 15, backgroundColor: '#212021'}}>
    <Text style={{color: 'white'}}>React Native Color Picker - Uncontrolled</Text>
    <ColorPicker oldColor='purple' onColorSelected={color => alert(`Color selected: ${color}`)} />
  </View>
)
