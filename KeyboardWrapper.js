import React from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function KeyboardWrapper({
  children,
  style,
  contentContainerStyle,
  scroll = true,
  keyboardVerticalOffset = 0,
  enabled = true,
}) {
  return (
    <TouchableWithoutFeedback
      onPress={enabled ? Keyboard.dismiss : undefined}
      accessible={false}
    >
      <KeyboardAvoidingView
        style={[{ flex: 1 }, style]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={keyboardVerticalOffset}
        enabled={enabled}
      >
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={contentContainerStyle}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={contentContainerStyle}>
            {children}
          </View>
        )}
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}
