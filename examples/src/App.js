import React from 'react'
import { View, Text } from 'react-native'
import { ColorPicker } from 'react-native-color-picker'

export const App = () => (
  <View style={{flex: 1, padding: 15, backgroundColor: '#212021'}}>
    <Text style={{color: 'white'}}>React Native Color Picker</Text>
    <ColorPicker originalColor='purple' onColorPicked={color => alert(`Color picked: ${color}`)} />
  </View>
)

