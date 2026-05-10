import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { View, Text, Modal, Pressable } from "react-native";
import { useAppTheme } from "./ThemeContext";
import styles from "./styles";

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
  const { colors } = useAppTheme();
  const [alertQueue, setAlertQueue] = useState([]);
  const timeoutRef = useRef(null);

  const showAlert = useCallback((title, message = "", buttons = null) => {
    setAlertQueue((prev) => [
      ...prev,
      {
        id: Date.now(),
        title,
        message,
        buttons: buttons || null,
      },
    ]);
  }, []);

  const dismissAlert = useCallback((id) => {
    setAlertQueue((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  // Auto-dismiss when alert is shown (only if no buttons)
  React.useEffect(() => {
    if (alertQueue.length > 0) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const alertId = alertQueue[alertQueue.length - 1].id;
      const currentAlert = alertQueue[alertQueue.length - 1];

      // Only auto-dismiss if there are no interactive buttons
      if (!currentAlert.buttons) {
        timeoutRef.current = setTimeout(() => {
          dismissAlert(alertId);
        }, 1500);
      }
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [alertQueue, dismissAlert]);

  const currentAlert = alertQueue[alertQueue.length - 1] || null;

  const handleButtonPress = (onPress) => {
    const alertId = currentAlert.id;
    if (onPress) onPress();
    dismissAlert(alertId);
  };

  return (
    <AlertContext.Provider value={{ showAlert, dismissAlert }}>
      {children}
      <Modal visible={!!currentAlert} transparent animationType="fade">
        {currentAlert ? (
          <View style={[styles.alertModalOverlay, { backgroundColor: "rgba(0, 0, 0, 0.5)" }]}>
            <View
              style={[
                styles.alertModalContainer,
                { backgroundColor: colors.surface },
              ]}
            >
              <Text style={[styles.alertModalTitle, { color: colors.text }]}>
                {currentAlert.title}
              </Text>
              {currentAlert.message ? (
                <Text style={[styles.alertModalMessage, { color: colors.text }]}>
                  {currentAlert.message}
                </Text>
              ) : null}
              {currentAlert.buttons && currentAlert.buttons.length > 0 ? (
                <View style={styles.alertModalButtonContainer}>
                  {currentAlert.buttons.map((btn, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => handleButtonPress(btn.onPress)}
                      style={({ pressed }) => [
                        btn.style === "cancel" || btn.style === "secondary"
                          ? styles.alertModalButtonSecondary
                          : styles.alertModalButton,
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <Text
                        style={
                          btn.style === "cancel" || btn.style === "secondary"
                            ? styles.alertModalButtonTextSecondary
                            : styles.alertModalButtonText
                        }
                      >
                        {btn.text}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          </View>
        ) : null}
      </Modal>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used inside AlertProvider");
  }
  return context;
}
