import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { COLORS, METRICS } from '../theme';

export default function Input(props: TextInputProps) {
  return <TextInput {...props} style={[styles.input, props.style]} />;
}

const styles = StyleSheet.create({
  input: {
    width: '100%',
    height: 44,
    borderColor: COLORS.transparentBorder,
    borderWidth: 1,
    paddingHorizontal: 12,
    borderRadius: METRICS.radius,
    backgroundColor: 'transparent'
  }
});
