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
  safeArea = false,
  safeAreaEdges = ["top", "bottom"],
}) {
  const keyboardContent = (
    <KeyboardAvoidingView
      style={safeArea ? { flex: 1 } : [{ flex: 1 }, style]}
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
  );

  return (
    <TouchableWithoutFeedback
      onPress={enabled ? Keyboard.dismiss : undefined}
      accessible={false}
    >
      {safeArea ? (
        <SafeAreaView edges={safeAreaEdges} style={[{ flex: 1 }, style]}>
          {keyboardContent}
        </SafeAreaView>
      ) : (
        keyboardContent
      )}
    </TouchableWithoutFeedback>
  );
}
