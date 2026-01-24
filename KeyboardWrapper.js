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
  const Container = scroll ? ScrollView : View;
  const containerProps = scroll
    ? {
        keyboardShouldPersistTaps: "handled",
        contentContainerStyle: [{ flexGrow: 1 }, contentContainerStyle],
      }
    : { style: contentContainerStyle };

  return (
    <TouchableWithoutFeedback
      onPress={enabled ? Keyboard.dismiss : undefined}
      accessible={false}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={[{ flex: 1 }, style]}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={keyboardVerticalOffset}
          enabled={enabled}
        >
          <Container
            style={!scroll ? [{ flex: 1 }, contentContainerStyle] : undefined}
            {...containerProps}
          >
            {children}
          </Container>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
