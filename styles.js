import { StyleSheet, Dimensions } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Reference size used when the auth screens were styled originally.
const AUTH_BASE_WIDTH = 360;
const AUTH_BASE_HEIGHT = 800;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const s = (size) => (SCREEN_WIDTH / AUTH_BASE_WIDTH) * size;
const vs = (size) => (SCREEN_HEIGHT / AUTH_BASE_HEIGHT) * size;
const ms = (size, factor = 0.5) => size + (s(size) - size) * factor;

const COLORS = {
  buttonColor: "hsla(129, 56%, 43%, 1)",
  buttonColorPressed: "hsla(129, 56%, 43%, 0.8)",
  redButtonColor: "hsla(0, 73%, 60%, 0.96)",
  appBackground: "#618a335d",
  white: "white",
  black: "black",
  lightSurface: "hsl(0, 0%, 95%)",
  darkSurface: "#1E1E1E",
  gray: "grey",
};

const baseButton = {
  alignItems: "center",
  justifyContent: "center",
  elevation: 6,
};

const baseButtonSmall = {
  ...baseButton,
  width: Math.round(clamp(ms(160), 140, 180)),
  height: Math.round(clamp(vs(35), 30, 40)),
  borderRadius: Math.round(clamp(ms(10), 8, 12)),
};

const baseButtonMedium = {
  ...baseButton,
  width: Math.round(clamp(ms(185), 165, 205)),
  height: Math.round(clamp(vs(45), 40, 50)),
  borderRadius: Math.round(clamp(ms(10), 8, 12)),
};

const baseButtonLarge = {
  ...baseButton,
  width: Math.round(clamp(ms(200), 180, 220)),
  height: Math.round(clamp(vs(55), 50, 60)),
  borderRadius: Math.round(clamp(ms(10), 8, 12)),
};

const baseButtonTextSmall = {
  color: COLORS.white,
  fontSize: Math.round(clamp(ms(18), 16, 20)),
  fontWeight: "600",
};

const baseButtonTextMedium = {
  color: COLORS.white,
  fontSize: Math.round(clamp(ms(19), 17, 21)),
  fontWeight: "600",
};

const baseButtonTextLarge = {
  color: COLORS.white,
  fontSize: Math.round(clamp(ms(22), 20, 24)),
  fontWeight: "900",
};

const baseButtonPrimary = {
  backgroundColor: COLORS.buttonColor,
};

const baseButtonPrimaryPressed = {
  backgroundColor: COLORS.buttonColorPressed,
};

const baseCard = {
  backgroundColor: "hsla(0, 0%, 100%, 0.65)",
  padding: 10,
  borderRadius: 20,
  borderWidth: 2,
  borderColor: COLORS.white,
  alignItems: "center",
};

const title = {
  fontSize: 45,
  fontWeight: "900",
  color: "hsla(0, 0%, 15%, 1.00)",
};

const textMedium = {
  fontWeight: "600",
  fontSize: Math.round(clamp(ms(18), 16, 20)),
  color: "hsla(0, 0%, 15%, 1.00)",
};

const label = {
  fontWeight: "800",
  fontSize: Math.round(clamp(ms(15), 13, 17)),
  marginTop: Math.round(clamp(vs(5), 3, 8)),
  alignSelf: "flex-start",
  marginLeft: Math.round(clamp(ms(40), 28, 48)),
  color: "hsla(0, 0%, 15%, 1.00)",
};

const textInput = {
  backgroundColor: COLORS.white,
  fontSize: Math.round(clamp(ms(20), 17, 22)),
  fontWeight: "400",
  width: Math.round(clamp(ms(260), 220, 300)),
  height: Math.round(clamp(vs(50), 44, 56)),
  borderRadius: Math.round(clamp(ms(15), 12, 18)),
  borderColor: COLORS.black,
  borderWidth: 1,
  margin: Math.round(clamp(ms(7), 5, 9)),
  textAlign: "center",
  elevation: 6,
};

// Welcome screen logo size (responsive but capped)
const WELCOME_LOGO_SIZE = Math.min(SCREEN_WIDTH * 0.4, 220);

export default StyleSheet.create({
  // _______WelcomeScreen_______
  regLogBtn: {
    ...baseButtonLarge,
    backgroundColor: COLORS.buttonColor,
    marginTop: 10,
  },
  regLogBtnPressed: {
    ...baseButtonLarge,
    backgroundColor: COLORS.buttonColorPressed,
    marginTop: 10,
  },
  regLogBtnText: {
    ...baseButtonTextLarge,
  },
  welcomeSafeArea: {
    flex: 1,
  },
  welcomeScrollContent: {
    flexGrow: 1,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  welcomeLogo: {
    width: WELCOME_LOGO_SIZE,
    height: WELCOME_LOGO_SIZE,
    marginBottom: 20,
    borderRadius: 20,
    alignSelf: "center",
  },
  welcomeCardContainer: {
    ...baseCard,
  },
  mainLayout: {
    flex: 1,
    backgroundColor: COLORS.appBackground,
  },
  welcomeTitle: {
    ...title,
    marginBottom: 20,
  },
  welcomeText: {
    ...textMedium,
    textAlign: "center",
  },

  // _______RegistrationScreen_______
  buttonLayout: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 20,
  },
  authRegLogBtn: {
    ...baseButtonLarge,
    backgroundColor: COLORS.buttonColor,
    marginTop: Math.round(clamp(vs(10), 8, 14)),
  },
  authRegLogBtnPressed: {
    ...baseButtonLarge,
    backgroundColor: COLORS.buttonColorPressed,
    marginTop: Math.round(clamp(vs(10), 8, 14)),
    elevation: 0
  },
  authRegLogBtnText: {
    ...baseButtonTextLarge,
  },
  authMainLayout: {
    flex: 1,
    backgroundColor: COLORS.appBackground,
    alignItems: "center",
  },
  authProfileAvatarReg: {
    height: Math.round(clamp(ms(110), 80, 150)),
    width: Math.round(clamp(ms(110), 80, 150)),
    marginBottom: Math.round(clamp(vs(10), 2, 16)),
    marginTop: Math.round(clamp(vs(55), 30, 80)),
    borderRadius: Math.round(clamp(ms(20), 16, 24)),
    alignSelf: "center",
  },
  authCardContainer: {
    ...baseCard,
    width: Math.round(clamp(ms(340), 280, 380)),
  },

  authProfileAvatar: {
    height: Math.round(clamp(ms(180), 150, 220)),
    width: Math.round(clamp(ms(180), 150, 220)),
    marginBottom: Math.round(clamp(vs(20), 12, 26)),
    marginTop: Math.round(clamp(vs(65), 40, 90)),
    borderRadius: Math.round(clamp(ms(20), 16, 24)),
    alignSelf: "center",
  },

  authTitleText: {
    ...title,
    marginBottom: Math.round(clamp(vs(15), 10, 18)),
  },
  authInfoLabel: {
    ...label,
  },
  authTextInput: {
    ...textInput,
  },
  authForgotText: {
    ...baseButtonTextMedium,
    alignSelf: "flex-start",
    marginLeft: Math.round(clamp(ms(40), 28, 48)),
    fontStyle: "italic",
    textDecorationLine: "underline",
    color: "hsla(0, 0%, 15%, 1.00)",
  },
  authOrText: {
    ...baseButtonTextMedium,
    marginTop: Math.round(clamp(vs(10), 8, 14)),
    color: "hsla(0, 0%, 15%, 1.00)",
  },
  authText: {
    ...baseButtonTextMedium,
    marginTop: Math.round(clamp(vs(10), 8, 14)),
    color: "hsla(0, 0%, 15%, 1.00)",
  },
  authBackArrow: {
    height: "100%",
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: Math.round(clamp(ms(50), 44, 56)),
    marginTop: Math.round(clamp(vs(10), 8, 14)),
  },
  authBackArrowContainer: {
    height: Math.round(clamp(ms(60), 52, 68)),
    width: Math.round(clamp(ms(60), 52, 68)),
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  authBackArrowPressed: {
    height: Math.round(clamp(ms(55), 48, 64)),
    width: Math.round(clamp(ms(55), 48, 64)),
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    opacity: 0.8,
  },

  // _______SharedModals_______
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  generatingModalContainer: {
    backgroundColor: COLORS.white,
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    width: "80%",
  },
  generatingModalTitle: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  generatingModalSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },

  // _______SettingsTab_______
  settingLayout: {
    margin: "auto",
  },
  logout_button: {
    ...baseButtonLarge,
    ...baseButtonPrimaryPressed,
    backgroundColor: COLORS.buttonColor,
    marginTop: 10,
    margin: "auto",
  },
  logout_button_pressed: {
    ...baseButtonLarge,
    ...baseButtonPrimaryPressed,
    elevation: 0,
    marginTop: 10,
    margin: "auto",
  },
  logout_button_text: {
    ...baseButtonTextLarge,
  },
  nickModalButton: {
    ...baseButtonSmall,
    width: "48%",
    backgroundColor: COLORS.buttonColor,
  },
  nickModalButtonPressed: {
    ...baseButtonSmall,
    width: "48%",
    backgroundColor: COLORS.buttonColorPressed,
    elevation: 0
  },
  nickModalButtonText: {
    ...baseButtonTextMedium,
  },
  nickModalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    width: "100%",
  },

  // _______ProfileCompletition_______
  primaryButton: {
    ...baseButtonMedium,
    backgroundColor: COLORS.buttonColor,
    marginTop: 10,
    margin: "auto",
  },
  primaryButtonText: {
    ...baseButtonTextMedium,
  },
  backButton: {
    height: 60,
    width: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  backButtonPressed: {
    height: 58,
    width: 58,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.8,
    marginBottom: 15,
  },
  optionButton: {
    ...baseButtonMedium,
    flex: 1,
    marginRight: 10,
  },
  optionText: {
    ...baseButtonTextSmall,
  },
  selectButton: {
    ...baseButtonMedium,
    ...baseButtonTextMedium,
    backgroundColor: COLORS.white,
    borderColor: COLORS.black,
    borderWidth: 1,
    marginTop: 5,
    margin: "auto",
  },
  textInput: {
    ...textInput,
  },
  formContainer: {
    marginTop: 50,
    width: "85%",
    alignSelf: "center",
  },
  screenTitle: {
    fontSize: 25,
    fontWeight: "900",
    color: COLORS.black,
  },
  inputLabel: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "700",
    color: "hsla(0, 0%, 15%, 1.00)",
  },
  backIcon: {
    height: "100%",
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: 50,
  },
  optionRow: {
    flexDirection: "row",
    marginTop: 5,
  },
  modalCard: {
    ...baseCard,
    width: "90%",
    backgroundColor: COLORS.white,
    padding: 20,
    alignItems: "stretch",
  },
  modalTitle: {
    ...baseButtonTextLarge,
    marginBottom: 15,
    color: COLORS.black,
  },
  activityOption: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  radioCircleOuter: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.black,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    marginTop: 3,
  },
  radioCircleInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: COLORS.black,
  },
  modalLabel: {
    fontWeight: "500",
    marginBottom: 2,
  },
  modalDescription: {
    color: COLORS.black,
    fontSize: 13,
  },

  // _______CameraScreen_______
  manualAddButton: {
    ...baseButtonMedium,
    margin: "auto",
    marginBottom: 50,
    backgroundColor: COLORS.white,
  },
  manualAddButtonText: {
    ...baseButtonTextMedium,
    color: COLORS.black,
  },
  primaryActionButton: {
    ...baseButtonMedium,
    backgroundColor: COLORS.buttonColor,
    marginTop: 15,
    alignSelf: "center",
  },
  primaryActionButtonText: {
    ...baseButtonTextMedium,
  },
  backArrowContainer: {
    height: 60,
    width: 60,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    alignSelf: "center",
  },
  backArrowImage: {
    height: "100%",
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: 50,
    marginBottom: 40,
  },
  backArrowPressed: {
    height: 55,
    width: 55,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: 12,
    opacity: 0.8,
  },
  manualAddContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    width: 250,
    height: 270,
    alignSelf: "center",
    marginBottom: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  manualAddText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "500",
  },
  manualAddInput: {
    backgroundColor: COLORS.white,
    fontSize: 18,
    width: 180,
    height: 45,
    borderRadius: 5,
    borderColor: COLORS.black,
    borderWidth: 1,
    marginTop: 10,
    alignSelf: "center",
    textAlign: "center",
  },

  // _______RecipesTab_______
  recipeButton: {
    ...baseButtonLarge,
    ...baseButtonPrimary,
    margin: "auto",
    marginTop: 10,
  },
  unitInfoCloseButton: {
    ...baseButtonLarge,
    marginTop: 10,
    backgroundColor: COLORS.buttonColor,
    margin: "auto",
  },
  unitInfoCloseButtonText: {
    ...baseButtonTextLarge,
  },
  createRecipeText: {
    ...baseButtonTextLarge,
  },
  generateErrorButton: {
    alignSelf: "center",
    backgroundColor: "#22c55e",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  generateErrorButtonText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 16,
  },
  resetButton: {
    ...baseButtonMedium,
    backgroundColor: "#f87171",
    alignSelf: "center",
    marginBottom: 15,
  },
  resetButtonText: {
    ...baseButtonTextMedium,
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    ...baseButtonMedium,
    flex: 1,
    marginRight: 5,
    backgroundColor: COLORS.gray,
  },
  cancelButtonText: {
    ...baseButtonTextMedium,
  },
  generateButton: {
    ...baseButtonMedium,
    flex: 1,
    backgroundColor: COLORS.buttonColor,
  },
  generateButtonText: {
    ...baseButtonTextMedium,
  },
  ingredientsInfoButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.buttonColor,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  ingredientsInfoButtonText: {
    color: COLORS.white,
    fontWeight: "bold",
  },
  modalButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  modalModalButtonClose: {
    ...baseButtonMedium,
    flex: 1,
    backgroundColor: COLORS.gray,
    marginRight: 2,
  },
  modalButtonText: {
    ...baseButtonTextMedium,
  },
  modalButtonSave: {
    ...baseButtonMedium,
    flex: 1,
    backgroundColor: COLORS.buttonColor,
    marginLeft: 2,
  },
  modalButtonEat: {
    ...baseButtonMedium,
    flex: 1,
    backgroundColor: "#ff9500",
  },
  modalButtonDelete: {
    ...baseButtonMedium,
    flex: 1,
    backgroundColor: "#ff4d4d",
    marginLeft: 2,
  },
  preferenceCloseButton: {
    marginTop: 16,
    backgroundColor: COLORS.buttonColor,
    paddingVertical: 10,
    borderRadius: 10,
  },
  preferenceCloseButtonText: {
    ...baseButtonTextMedium,
    textAlign: "center"
  },
  recipesContainer: {
    margin: "auto",
    width: "95%",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "90%",
    alignSelf: "center",
    marginTop: 10,
  },
  card: {
    ...baseCard,
    padding: 0,
    backgroundColor: "hsl(35, 54%, 35%)",
    width: "48%",
    height: 120,
    marginBottom: 13,
    borderRadius: 10,
    overflow: "hidden",
    elevation: 3,
    alignItems: ""
  },
  cardText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    padding: 5,
    backgroundColor: "hsla(0, 0%, 0%, 0.8)",
  },
  imageBackground: {
    flex: 1,
    justifyContent: "flex-end",
    resizeMode: "cover"
  },
  modalContainer: {
    width: "95%",
    maxHeight: "95%",
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 16,
  },
  generateModalContainer: {
    flex: 1,
    maxHeight: "90%",
    padding: 16,
  },
  scrollPaddingBottom: {
    paddingBottom: 20,
  },
  generateTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  generateErrorContainer: {
    maxHeight: "85%",
    paddingVertical: 20,
  },
  generateErrorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  generateErrorText: {
    fontSize: 15,
    color: "#374151",
    textAlign: "left",
    lineHeight: 22,
    marginBottom: 18,
  },
  selectedPreferencesBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#f5f5f5",
    marginBottom: 15,
    minHeight: 50,
  },
  preferencesHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  preferencesTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 6,
  },
  infoCircleSmall: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.buttonColor,
    alignItems: "center",
    justifyContent: "center",
  },
  infoCircleSmallText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 12,
  },
  emptyPreferencesText: {
    color: "#999",
  },
  preferencesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  selectedPreferenceChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0e0e0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    margin: 4,
  },
  selectedPreferenceText: {
    marginRight: 6,
  },
  removePreferenceText: {
    fontWeight: "bold",
  },
  availablePreferencesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  availablePreferenceChip: {
    backgroundColor: "#d1fae5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 4,
  },
  additionalPreferencesButton: {
    backgroundColor: "#a5f3fc",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  additionalPreferencesButtonText: {
    fontWeight: "bold",
  },
  additionalPreferencesSection: {
    marginBottom: 12,
  },
  additionalPreferencesCategory: {
    fontWeight: "bold",
    marginBottom: 6,
  },
  additionalPreferencesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  switchLabel: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  pantryListContainer: {
    paddingLeft: 5,
  },
  pantryItemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    backgroundColor: "#f5f5f5",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  pantrySwitch: {
    transform: [{ scale: 0.8 }],
  },
  pantryItemText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
  },
  pantryEmptyMessage: {
    alignSelf: "flex-start",
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#f5f5f5",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    width: "95%",
    height: 45,
    textAlignVertical: "center",
  },
  cookingTimeContainer: {
    marginBottom: 20,
  },
  cookingTimeLabel: {
    marginBottom: 10,
    fontWeight: "bold",
    fontSize: 16,
  },
  infoText: {
    textAlign: "center",
    marginBottom: 20,
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 25,
    fontWeight: "900",
    marginVertical: 10,
    marginLeft: 15,
  },
  recipeModalImage: {
    width: "100%",
    height: 180,
    borderRadius: 50,
    marginBottom: 15,
  },
  recipeModalTitle: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  recipeModalCard: {
    ...baseCard,
    width: "92%",
    maxHeight: "90%",
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 18,
    elevation: 8,
    shadowColor: COLORS.black,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  recipeModalContent: {
    paddingBottom: 10,
  },
  recipeModalHeader: {
    alignItems: "center",
    marginBottom: 10,
  },
  recipeModalSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  recipeMetaRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
    marginBottom: 12,
  },
  recipeMetaChip: {
    flex: 1,
    backgroundColor: "#f0fdf4",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#cfead7",
  },
  recipeMetaLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
  },
  recipeMetaValue: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "700",
    marginTop: 2,
  },
  recipeSectionCard: {
    ...baseCard,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "flex-start"
  },
  recipeSectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  recipeIngredientItem: {
    fontSize: 15,
    color: "#111827",
    marginBottom: 4,
  },
  nutritionContainer: {
    width: "95%",
    borderWidth: 1,
    borderColor: "#cfead7",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#f0fdf4",
    marginBottom: 15,
  },
  ingredientsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  ingredientsTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  unitInfoModal: {
    maxHeight: 300,
  },
  unitInfoTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  unitInfoText: {
    fontSize: 16,
    marginBottom: 4,
  },
  stepsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 6,
  },
  stepContainer: {
    padding: 8,
    borderRadius: 15,
    marginBottom: 10,
    borderBottomColor: COLORS.buttonColor,
    borderBottomWidth: 1,
  },
  stepText: {
    fontSize: 18,
  },
  preferenceInfoModalContainer: {
    maxHeight: "85%",
  },
  preferenceInfoTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  preferenceCategoryTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
  },
  preferenceItem: {
    backgroundColor: "#f0fdf4",
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
  },
  preferenceItemLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  preferenceItemDescription: {
    fontSize: 14,
    color: "#555",
    marginTop: 2,
  },
  preferenceSection: {
    marginTop: 14,
  },
  nutritionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "hsl(0, 0%, 50%)",
  },
  nutritionLabel: {
    fontWeight: "600",
    color: "#333",
  },
  nutritionValue: {
    fontWeight: "700",
    color: "#111",
  },

  // _______PantryTab_______
  pantryCustomButton: {
    backgroundColor: COLORS.buttonColor,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  pantryCustomButtonText: {
    color: COLORS.white,
    fontWeight: "800",
  },
  pantryCustomRemove: {
    backgroundColor: COLORS.redButtonColor,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  pantryCustomRemoveText: {
    color: COLORS.white,
    fontWeight: "800",
  },
  pantryEatenButton: {
    backgroundColor: COLORS.redButtonColor,
    textAlign: "center",
  },
  pantryCloseButton: {
    ...baseButtonMedium,
    backgroundColor: COLORS.buttonColor,
    marginTop: Math.round(clamp(ms(8), 4, 12)),
    alignSelf: "center",
    width: "85%",
  },
  pantryEatenBtn: {
    ...baseButtonMedium,
    backgroundColor: COLORS.redButtonColor,
    marginTop: Math.round(clamp(ms(18), 14, 22)),
    alignSelf: "center",
    width: "85%",
  },
  pantryCloseButtonText: {
    ...baseButtonTextMedium,
  },
  pantryMealContainer: {
    marginTop: Math.round(clamp(vs(20), 16, 28)),
    width: "90%",
    alignSelf: "center",
  },
  pantryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  pantrySectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "hsla(0, 0%, 15%, 1.00)",
    marginBottom: 10,
    marginTop: 10,
    marginLeft: 6,
  },
  pantryCustomInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  pantryCustomInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  pantryCustomList: {
    backgroundColor: "#f7f7f7",
    borderRadius: 12,
    padding: 10,
  },
  pantryCustomItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  pantryCustomItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  pantryBox: {
    width: "48%",
    height: Math.round(clamp(vs(130), 100, 170)),
    backgroundColor: "hsla(96, 56%, 35%, 1.00)",
    borderRadius: Math.round(clamp(ms(10), 8, 12)),
    overflow: "hidden",
    marginBottom: Math.round(clamp(ms(12), 10, 14)),
  },
  pantryImageBackground: {
    flex: 1,
  },
  pantryMealBoxText: {
    backgroundColor: "rgba(180, 215, 171, 0.9)",
    fontSize: Math.round(clamp(ms(16), 12, 20)),
    fontWeight: "bold",
    padding: Math.round(clamp(ms(4), 2, 6)),
    color: COLORS.black,
    textAlign: "center",
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  pantryCountBadge: {
    width: "30%",
    margin: Math.round(clamp(ms(4), 2, 6)),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 255, 0, 0.9)",
    borderRadius: Math.round(clamp(ms(12), 10, 14)),
    paddingHorizontal: Math.round(clamp(ms(8), 6, 10)),
    paddingVertical: Math.round(clamp(ms(2), 2, 3)),
  },
  pantryCountBadgeText: {
    color: COLORS.white,
    fontWeight: "bold",
  },
  pantryOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  pantryWindow: {
    width: "90%",
    backgroundColor: COLORS.white,
    borderRadius: Math.round(clamp(ms(12), 10, 14)),
    padding: Math.round(clamp(ms(16), 12, 18)),
    elevation: 10,
  },
  pantryWindowTitle: {
    fontSize: Math.round(clamp(ms(20), 18, 24)),
    fontWeight: "800",
    marginBottom: Math.round(clamp(ms(12), 10, 14)),
    textAlign: "center",
  },
  pantryModalImage: {
    height: Math.round(clamp(vs(200), 160, 240)),
    borderRadius: Math.round(clamp(ms(8), 6, 10)),
    marginBottom: Math.round(clamp(ms(6), 4, 8)),
  },
  pantryNutritionHeaderText: {
    margin: "auto",
    fontWeight: "bold",
    marginBottom: Math.round(clamp(ms(6), 4, 8)),
  },
  pantryNutritionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pantryNutritionLabel: {
    fontWeight: "600",
    color: "#333",
  },
  pantryInfoRowBase: {
    justifyContent: "space-between",
    alignSelf: "center",
    flexDirection: "row",
    padding: Math.round(clamp(ms(7), 6, 9)),
    borderRadius: Math.round(clamp(ms(6), 5, 8)),
    width: "80%",
  },
  pantryInfoRowExpiration: {
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "hsla(0, 100%, 50%, 0.3)",
    marginTop: Math.round(clamp(vs(10), 8, 14)),
  },
  pantryInfoRowCount: {
    backgroundColor: "hsla(136, 100%, 50%, 0.5)",
    margin: Math.round(clamp(ms(3), 2, 4)),
  },
  pantryNutritionCard: {
    ...baseCard,
    backgroundColor: "hsla(136, 100%, 50%, 0.2)",
    width: "80%",
    borderRadius: Math.round(clamp(ms(8), 7, 10)),
    alignSelf: "center",
    padding: Math.round(clamp(ms(5), 4, 6)),
  },
  pantryNutritionValueRowBase: {
    justifyContent: "space-between",
    flexDirection: "row",
    borderRadius: Math.round(clamp(ms(6), 5, 8)),
    width: "80%",
    alignSelf: "center",
    marginBottom: Math.round(clamp(ms(2), 2, 3)),
  },
  pantryNutritionValueRowGap3: {
    gap: 3,
  },
  pantryNutritionValueRowGap1: {
    gap: 1,
  },
  pantryTitle: {
    fontSize: Math.round(clamp(ms(18), 16, 22)),
    textAlign: "center",
    marginBottom: Math.round(clamp(ms(12), 10, 14)),
  },

  // _______Dashboard_______
  dashTopBar: {
    backgroundColor: COLORS.lightSurface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingBottom: Math.round(clamp(vs(20), 14, 26)),
    elevation: 10,
    borderBottomRightRadius: Math.round(clamp(ms(25), 18, 32)),
    borderColor: COLORS.black,
    borderWidth: 1,
  },
  dashTopBar_text: {
    marginTop: Math.round(clamp(vs(50), 36, 64)),
    fontSize: Math.round(clamp(ms(30), 24, 34)),
    fontWeight: "bold",
  },
  dashTopBar_img: {
    height: Math.round(clamp(ms(60), 48, 72)),
    width: Math.round(clamp(ms(60), 48, 72)),
    marginTop: Math.round(clamp(vs(50), 36, 64)),
    backgroundColor: COLORS.white,
    borderRadius: Math.round(clamp(ms(10), 8, 14)),
  },
  dashContentContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  dashNavBar: {
    width: "100%",
    justifyContent: "center",
    flexDirection: "row",
  },
  dashNavBar_tabs: {
    width: Math.round(clamp(s(73), 60.5, 86.5)),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.lightSurface,
    borderTopColor: COLORS.black,
    borderTopWidth: 1,
    paddingTop: Math.round(clamp(vs(10), 8, 14)),
  },
  dashNavBar_tabs_pressed: {
    width: Math.round(clamp(s(73), 60.5, 86.5)),
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "center",
    backgroundColor: COLORS.lightSurface,
    borderTopColor: COLORS.black,
    borderTopWidth: 1,
    paddingTop: Math.round(clamp(vs(10), 8, 14)),
    opacity: 1,
  },
  dashNavBar_img: {
    width: Math.round(clamp(ms(35), 28, 44)),
    height: Math.round(clamp(ms(35), 28, 44)),
  },
  dashNavBar_Add: {
    width: Math.round(clamp(ms(20), 16, 24)),
    height: Math.round(clamp(ms(20), 16, 24)),
  },
  dashNavBar_Add_container: {
    width: Math.round(clamp(ms(35), 28, 44)),
    height: Math.round(clamp(ms(35), 28, 44)),
    backgroundColor: COLORS.buttonColor,
    borderRadius: Math.round(clamp(ms(25), 20, 30)),
    alignItems: "center",
    justifyContent: "center",
  },
  dashNavBar_text: {
    fontSize: Math.round(clamp(ms(10), 9, 12)),
    color: COLORS.black,
  },
  dashNavBar_text_pressed: {
    fontSize: Math.round(clamp(ms(10), 9, 12)),
    fontWeight: "700",
    color: COLORS.black,
  },
  dashNavBar_text_Add: {
    fontSize: Math.round(clamp(ms(10), 9, 12)),
    color: COLORS.black,
    fontWeight: "900",
  },

  // _______OverviewTab_______
  overviewScreen: {
    paddingHorizontal: Math.round(clamp(ms(16), 12, 20)),
    paddingTop: Math.round(clamp(vs(12), 10, 16)),
    paddingBottom: Math.round(clamp(vs(24), 18, 30)),
    backgroundColor: COLORS.lightSurface,
  },
  overviewHeader: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Math.round(clamp(vs(6), 4, 10)),
  },
  overviewTitle: {
    fontSize: Math.round(clamp(ms(22), 18, 26)),
    fontWeight: "900",
    color: "#111827",
    textAlign: "center",
  },
  overviewDateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Math.round(clamp(vs(10), 8, 14)),
  },
  overviewDateButton: {
    width: Math.round(clamp(ms(34), 30, 38)),
    height: Math.round(clamp(ms(34), 30, 38)),
    borderRadius: Math.round(clamp(ms(10), 8, 12)),
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  overviewDateArrow: {
    fontSize: Math.round(clamp(ms(16), 14, 18)),
    fontWeight: "800",
    color: "#111827",
  },
  overviewDateText: {
    fontSize: Math.round(clamp(ms(12), 10, 14)),
    color: "#6b7280",
    marginHorizontal: Math.round(clamp(ms(12), 10, 16)),
  },
  overviewRangeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f1f5f9",
    borderRadius: Math.round(clamp(ms(14), 12, 18)),
    padding: Math.round(clamp(ms(4), 3, 6)),
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: Math.round(clamp(vs(10), 8, 14)),
  },
  overviewRangeButton: {
    flex: 1,
    paddingVertical: Math.round(clamp(vs(6), 5, 8)),
    borderRadius: Math.round(clamp(ms(10), 8, 14)),
    alignItems: "center",
    marginHorizontal: Math.round(clamp(ms(3), 2, 5)),
  },
  overviewRangeButtonActive: {
    backgroundColor: COLORS.buttonColor,
  },
  overviewRangeButtonText: {
    fontSize: Math.round(clamp(ms(11), 10, 13)),
    fontWeight: "700",
    color: "#6b7280",
  },
  overviewRangeButtonTextActive: {
    color: COLORS.white,
  },
  overviewSectionTitle: {
    fontSize: Math.round(clamp(ms(16), 14, 18)),
    fontWeight: "800",
    color: "#111827",
    marginTop: Math.round(clamp(vs(10), 8, 14)),
    marginBottom: Math.round(clamp(vs(8), 6, 10)),
  },
  overviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: Math.round(clamp(ms(16), 12, 20)),
    padding: Math.round(clamp(ms(16), 12, 20)),
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: COLORS.black,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: Math.round(clamp(vs(10), 8, 12)),
  },
  overviewCardAccent: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.buttonColor,
  },
  overviewCardAccentBlue: {
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
  },
  overviewCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Math.round(clamp(vs(6), 5, 8)),
  },
  overviewCardLabel: {
    fontSize: Math.round(clamp(ms(11), 10, 13)),
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  overviewCardValue: {
    fontSize: Math.round(clamp(ms(18), 16, 20)),
    fontWeight: "800",
    color: "#111827",
    marginTop: Math.round(clamp(vs(4), 3, 6)),
  },
  overviewCardValueLarge: {
    fontSize: Math.round(clamp(ms(22), 20, 26)),
    fontWeight: "900",
    color: "#111827",
    marginTop: Math.round(clamp(vs(4), 3, 6)),
  },
  overviewCardSubText: {
    fontSize: Math.round(clamp(ms(12), 10, 14)),
    color: "#374151",
    marginBottom: Math.round(clamp(vs(8), 6, 10)),
  },
  overviewBadge: {
    backgroundColor: "rgba(93, 140, 58, 0.12)",
    paddingHorizontal: Math.round(clamp(ms(10), 8, 12)),
    paddingVertical: Math.round(clamp(vs(4), 3, 6)),
    borderRadius: Math.round(clamp(ms(12), 10, 16)),
  },
  overviewBadgeText: {
    fontSize: Math.round(clamp(ms(10), 9, 12)),
    fontWeight: "700",
    color: COLORS.buttonColor,
  },
  overviewProgressBar: {
    height: Math.round(clamp(vs(8), 6, 10)),
    backgroundColor: "#e5e7eb",
    borderRadius: Math.round(clamp(ms(6), 5, 8)),
    overflow: "hidden",
  },
  overviewProgressBarSmall: {
    height: Math.round(clamp(vs(6), 5, 8)),
    backgroundColor: "#e5e7eb",
    borderRadius: Math.round(clamp(ms(6), 5, 8)),
    overflow: "hidden",
  },
  overviewProgressFill: {
    height: "100%",
    borderRadius: Math.round(clamp(ms(6), 5, 8)),
  },
  overviewProgressText: {
    fontSize: Math.round(clamp(ms(12), 10, 14)),
    color: "#6b7280",
    marginTop: Math.round(clamp(vs(6), 5, 8)),
  },
  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  overviewStatCard: {
    width: "48%",
    backgroundColor: "#f8fafc",
    borderRadius: Math.round(clamp(ms(14), 12, 18)),
    padding: Math.round(clamp(ms(12), 10, 16)),
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderLeftWidth: 4,
    marginBottom: Math.round(clamp(vs(8), 6, 10)),
  },
  overviewStatLabel: {
    fontSize: Math.round(clamp(ms(11), 10, 12)),
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  overviewStatValue: {
    fontSize: Math.round(clamp(ms(14), 12, 16)),
    fontWeight: "800",
    color: "#111827",
    marginTop: Math.round(clamp(vs(6), 5, 8)),
    marginBottom: Math.round(clamp(vs(8), 6, 10)),
  },
  overviewAddWaterButton: {
    backgroundColor: COLORS.buttonColor,
    width: Math.round(clamp(ms(34), 28, 40)),
    height: Math.round(clamp(ms(34), 28, 40)),
    borderRadius: Math.round(clamp(ms(12), 10, 16)),
    alignItems: "center",
    justifyContent: "center",
  },
  overviewAddWaterButtonDisabled: {
    opacity: 0.5,
  },
  overviewAddWaterIcon: {
    width: Math.round(clamp(ms(16), 14, 18)),
    height: Math.round(clamp(ms(16), 14, 18)),
  },
  overviewChartCard: {
    backgroundColor: COLORS.white,
    borderRadius: Math.round(clamp(ms(16), 12, 20)),
    padding: Math.round(clamp(ms(16), 12, 20)),
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: Math.round(clamp(vs(12), 10, 16)),
  },
  overviewChartMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Math.round(clamp(vs(10), 8, 12)),
  },
  overviewChartMetaLabel: {
    fontSize: Math.round(clamp(ms(12), 11, 14)),
    fontWeight: "700",
    color: "#111827",
  },
  overviewChartMetaValue: {
    fontSize: Math.round(clamp(ms(11), 10, 13)),
    fontWeight: "600",
    color: "#6b7280",
  },
  overviewChartSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderRadius: Math.round(clamp(ms(12), 10, 16)),
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: Math.round(clamp(ms(12), 10, 14)),
    marginBottom: Math.round(clamp(vs(12), 10, 14)),
  },
  overviewChartSummaryItem: {
    flex: 1,
    alignItems: "center",
  },
  overviewChartSummaryLabel: {
    fontSize: Math.round(clamp(ms(10), 9, 12)),
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  overviewChartSummaryValue: {
    fontSize: Math.round(clamp(ms(14), 12, 16)),
    fontWeight: "800",
    color: "#111827",
    marginTop: Math.round(clamp(vs(4), 3, 6)),
  },
  overviewChartSummaryMeta: {
    fontSize: Math.round(clamp(ms(10), 9, 12)),
    color: "#9ca3af",
    marginTop: Math.round(clamp(vs(2), 2, 4)),
  },
  overviewChartList: {
    marginTop: Math.round(clamp(vs(2), 0, 4)),
  },
  overviewChartRowCard: {
    backgroundColor: "#f8fafc",
    borderRadius: Math.round(clamp(ms(12), 10, 16)),
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: Math.round(clamp(ms(12), 10, 14)),
    marginBottom: Math.round(clamp(vs(8), 6, 10)),
  },
  overviewChartRowCardHighlight: {
    borderColor: COLORS.buttonColor,
    backgroundColor: "rgba(97, 138, 51, 0.08)",
  },
  overviewChartRowCardCurrent: {
    borderColor: "#0ea5e9",
    backgroundColor: "rgba(14, 165, 233, 0.08)",
  },
  overviewChartRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Math.round(clamp(vs(6), 5, 8)),
  },
  overviewChartRowLabelGroup: {
    flexDirection: "column",
  },
  overviewChartRowLabel: {
    fontSize: Math.round(clamp(ms(13), 12, 15)),
    fontWeight: "800",
    color: "#111827",
  },
  overviewChartRowSubLabel: {
    fontSize: Math.round(clamp(ms(10), 9, 12)),
    color: "#6b7280",
    marginTop: Math.round(clamp(vs(2), 1, 3)),
  },
  overviewChartRowValueGroup: {
    alignItems: "flex-end",
  },
  overviewChartRowValue: {
    fontSize: Math.round(clamp(ms(12), 11, 14)),
    fontWeight: "700",
    color: "#111827",
  },
  overviewChartRowPercent: {
    fontSize: Math.round(clamp(ms(10), 9, 12)),
    color: "#6b7280",
    marginTop: Math.round(clamp(vs(2), 1, 3)),
  },
  overviewChartRowBarTrack: {
    height: Math.round(clamp(vs(8), 6, 10)),
    backgroundColor: "#e5e7eb",
    borderRadius: Math.round(clamp(ms(6), 5, 8)),
    overflow: "hidden",
  },
  overviewChartRowBarFill: {
    height: "100%",
    borderRadius: Math.round(clamp(ms(6), 5, 8)),
  },
  overviewChartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  overviewChartItem: {
    alignItems: "center",
    marginRight: Math.round(clamp(ms(10), 8, 12)),
  },
  overviewChartBarTrack: {
    width: Math.round(clamp(ms(14), 12, 16)),
    height: Math.round(clamp(vs(120), 100, 140)),
    backgroundColor: "#e5e7eb",
    borderRadius: Math.round(clamp(ms(6), 5, 8)),
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  overviewChartBarFill: {
    width: "100%",
    borderRadius: Math.round(clamp(ms(6), 5, 8)),
  },
  overviewChartLabel: {
    fontSize: Math.round(clamp(ms(10), 9, 11)),
    color: "#6b7280",
    marginTop: Math.round(clamp(vs(6), 4, 8)),
    textAlign: "center",
  },
  overviewChartScrollContent: {
    paddingRight: Math.round(clamp(ms(8), 6, 12)),
  },
  overviewChartLoading: {
    textAlign: "center",
    color: "#6b7280",
    fontWeight: "600",
    paddingVertical: Math.round(clamp(vs(20), 16, 24)),
  },
  overviewChartEmptyText: {
    textAlign: "center",
    color: "#9ca3af",
    fontWeight: "600",
    paddingVertical: Math.round(clamp(vs(20), 16, 24)),
  },
  overviewBmiText: {
    fontSize: Math.round(clamp(ms(14), 12, 16)),
    fontWeight: "700",
    color: "#111827",
    marginTop: Math.round(clamp(vs(6), 5, 8)),
    marginBottom: Math.round(clamp(vs(8), 6, 10)),
    textAlign: "center",
  },
  overviewModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  overviewModalContent: {
    backgroundColor: COLORS.white,
    padding: Math.round(clamp(ms(20), 16, 24)),
    borderRadius: Math.round(clamp(ms(16), 12, 20)),
    width: "85%",
  },
  overviewModalTitle: {
    fontSize: Math.round(clamp(ms(18), 16, 20)),
    fontWeight: "800",
    marginBottom: Math.round(clamp(vs(10), 8, 12)),
  },
  overviewModalOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Math.round(clamp(vs(6), 5, 8)),
  },
  overviewModalRadioOuter: {
    width: Math.round(clamp(ms(20), 18, 22)),
    height: Math.round(clamp(ms(20), 18, 22)),
    borderRadius: Math.round(clamp(ms(10), 9, 11)),
    borderWidth: 1,
    borderColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Math.round(clamp(ms(10), 8, 12)),
  },
  overviewModalRadioInner: {
    width: Math.round(clamp(ms(12), 10, 14)),
    height: Math.round(clamp(ms(12), 10, 14)),
    borderRadius: Math.round(clamp(ms(6), 5, 7)),
    backgroundColor: COLORS.buttonColor,
  },
  overviewModalOptionLabel: {
    fontWeight: "700",
  },
  overviewModalOptionDescription: {
    color: "#6b7280",
  },
  overviewModalCustomContent: {
    flex: 1,
  },
  overviewModalCustomInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Math.round(clamp(vs(6), 5, 8)),
  },
  overviewModalCustomInput: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: Math.round(clamp(ms(10), 8, 12)),
    paddingVertical: Math.round(clamp(vs(6), 5, 8)),
    paddingHorizontal: Math.round(clamp(ms(10), 8, 12)),
    fontSize: Math.round(clamp(ms(12), 11, 14)),
    color: "#111827",
  },
  overviewModalCustomUnit: {
    marginLeft: Math.round(clamp(ms(8), 6, 10)),
    fontSize: Math.round(clamp(ms(12), 11, 14)),
    fontWeight: "700",
    color: "#6b7280",
  },
  overviewModalConfirmButton: {
    marginTop: Math.round(clamp(vs(12), 10, 14)),
    backgroundColor: COLORS.buttonColor,
    paddingVertical: Math.round(clamp(vs(10), 8, 12)),
    borderRadius: Math.round(clamp(ms(10), 8, 12)),
  },
  overviewModalConfirmButtonDisabled: {
    backgroundColor: "#cbd5f5",
  },
  overviewModalConfirmButtonText: {
    color: COLORS.white,
    textAlign: "center",
    fontWeight: "700",
  },
  overviewModalConfirmButtonTextDisabled: {
    color: "#f8fafc",
  },
  overviewMissingProfileContainer: {
    backgroundColor: COLORS.white,
    borderRadius: Math.round(clamp(ms(16), 12, 20)),
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: Math.round(clamp(ms(20), 16, 24)),
    width: "90%",
    alignSelf: "center",
    alignItems: "center",
    marginTop: Math.round(clamp(vs(20), 16, 26)),
  },
  overviewMissingProfileText: {
    fontSize: Math.round(clamp(ms(16), 14, 18)),
    textAlign: "center",
    color: "#111827",
  },
  overviewMissingProfileButton: {
    marginTop: Math.round(clamp(vs(12), 10, 14)),
    backgroundColor: COLORS.buttonColor,
    paddingHorizontal: Math.round(clamp(ms(20), 16, 24)),
    paddingVertical: Math.round(clamp(vs(10), 8, 12)),
    borderRadius: Math.round(clamp(ms(12), 10, 16)),
  },
  overviewMissingProfileButtonText: {
    color: COLORS.white,
    fontWeight: "700",
  },
});
