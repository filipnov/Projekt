import { StyleSheet } from "react-native";

export default StyleSheet.create({
  forgotText: {
    fontWeight: "900",
    fontStyle: "italic",
    fontSize: 18,
    marginTop: 5,
    alignSelf: "flex-start",
    marginLeft: 40,
    textDecorationLine: "underline",
    color: "hsla(0, 0%, 15%, 1.00)",
  },
  regLogBtn: {
    backgroundColor: "hsla(129, 56%, 43%, 1)",
    width: 225,
    height: 55,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  regLogBtnPressed: {
    backgroundColor: "hsla(129, 56%, 43%, 0.8)",
    width: 225,
    height: 55,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  regLogBtnText: {
    color: "white",
    fontSize: 25,
    fontWeight: "900",
  },
  orText: {
    fontSize: 18,
    fontWeight: "900",
    marginTop: 10,
    color: "hsla(0, 0%, 15%, 1.00)",
  },
  //HOMESCREEN
  container: {
    flex: 1,
    backgroundColor: "#fff",
    height: "auto",
  },
  topBar: {
    backgroundColor: "hsl(0, 0%, 95%)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: 20,
    elevation: 10,
    borderBottomRightRadius: 25,
    borderColor: "black",
    borderWidth: 1,
  },
  topBar_text: {
    marginTop: 50,
    fontSize: 30,
    fontWeight: "bold",
  },
  topBar_img: {
    height: 60,
    width: 60,
    marginTop: 50,
    backgroundColor: "white",
    borderRadius: 10,
  },
  navBar: {
    alignSelf: "center",
    verticalAlign: "bottom",
    height: "auto",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  navBar_tabs: {
    height: 90,
    width: 82.5,
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "center",
    backgroundColor: "hsl(0, 0%, 95%)",
    borderTopColor: "black",
    borderTopWidth: 1,
    opacity: 0.7,
  },
  navBar_tab_Add: {
    height: 90,
    width: 82.5,
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "center",
    backgroundColor: "hsl(0, 0%, 95%)",
    borderTopColor: "black",
    borderTopWidth: 1,
    transform: [{ translateY: -10 }],
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderLeftColor: "black",
    borderLeftWidth: 1,
    borderRightColor: "black",
    borderRightWidth: 1,
  },
  navBar_tabs_pressed: {
    height: 90,
    width: 82.5,
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "center",
    backgroundColor: "hsl(0, 0%, 95%)",
    borderTopColor: "black",
    borderTopWidth: 1,
    opacity: 1,
  },
  navBar_img: {
    width: 30,
    height: 30,
  },
  navBar_Add: {
    width: 20,
    height: 20,
  },
  navBar_Add_container: {
    width: 45,
    height: 45,
    backgroundColor: "hsla(129, 56%, 43%, 1)",
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  navBar_text: {
    fontSize: 10,
    color: "black",
  },
  navBar_text_pressed: {
    fontSize: 10,
    fontWeight: "700",
    color: "black",
  },
  navBar_text_Add: {
    fontSize: 15,
    fontWeight: "900",
    color: "black",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  caloriesDisplay: {
    marginTop: 20,
    backgroundColor: "#1E1E1E",
    width: "90%",
    height: 170,
    borderRadius: 15,
    alignSelf: "center",
    alignItems: "center",
    flexDirection: "column-reverse",
  },
  dateText: {
    color: "white",
    alignSelf: "flex-start",
    marginLeft: 20,
    marginBottom: 27,
  },
  caloriesBarContainer: {
    backgroundColor: "white",
    overflow: "hidden",
    width: "90%",
    height: 12,
    alignItems: "center",
    marginBottom: 15,
    borderRadius: 10,
    margin: 10,
  },
  caloriesBar: {
    height: "100%",
    alignSelf: "flex-start",
  },
  nutriDisplay_container: {
    width: "90%",
    alignSelf: "center",
    alignItems: "center",
    marginTop: 5,
    borderRadius: 15,
    flexDirection: "column",
    paddingVertical: 8,
  },
  nutriDisplay: {
    backgroundColor: "#1E1E1E",
    height: 100,
    width: 115,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
  },
  nutriDisplay_text: {
    color: "white",
    alignSelf: "center",
    marginTop: 10,
  },
  bmiContainer: {
    marginTop: 5,
    backgroundColor: "#1E1E1E",
    width: "90%",
    height: 120,
    borderRadius: 15,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  logout_button: {
    backgroundColor: "hsla(129, 56%, 43%, 1)",
    width: 160,
    height: 45,
    borderRadius: 10,
    marginTop: 15,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    marginLeft: 15,
  },
  logout_button_pressed: {
    backgroundColor: "hsla(129, 56%, 43%, 0.8)",
    width: 160,
    height: 45,
    borderRadius: 10,
    marginTop: 15,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    marginLeft: 15,
  },
  logout_button_text: {
    color: "white",
    fontSize: 20,
    fontWeight: "900",
  },
  mealContainer: {
    marginTop: 20,
    width: "90%",
    alignSelf: "center",
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  box: {
    width: "48%",
    height: 170,
    backgroundColor: "hsla(96, 56%, 35%, 1.00)",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 12,
  },
  mealBoxText: {
    backgroundColor: "black",
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  eatenButton: {
    backgroundColor: "hsla(0, 73%, 60%, 0.96)",
    padding: 8,
    textAlign: "center",
  },
  mealBoxWindow: {
    width: "90%",
    height: 600,
    backgroundColor: "hsla(96, 31%, 63%, 0.96)",
    marginBottom: 10,
    borderRadius: 5,
    justifyContent: "space-around",
    alignItems: "center",
    alignSelf: "center",
    position: "absolute",
    marginTop: "50",
    zIndex: 50,
  },
  windowContainer: {
    marginTop: "40%",
    marginHorizontal: 20,
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    elevation: 10,
  },
  //Recipe
  recipesContainer: {
    margin: "auto",
    width: "95%",
  },
  AiInput: {
    height: 50,
    margin: 12,
    borderWidth: 1,
    padding: 15,
    borderRadius: 10,
  },
  recipeButton: {
    backgroundColor: "hsla(129, 56%, 43%, 1)",
    width: 160,
    height: 50,
    borderRadius: 10,
    margin: "auto",
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },

  //Verified
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "90%",
    alignSelf: "center",
    marginTop: 10,
  },
  card: {
    backgroundColor: "hsl(35, 54%, 35%)",
    width: "48%",
    height: 120,
    marginBottom: 13,
    borderRadius: 10,
    overflow: "hidden",
    elevation: 3,
  },
  cardText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    padding: 5,
    backgroundColor: "black",
  },
  imageBackground: {
    flex: 1,
  },
  image: {
    resizeMode: "cover",
  },
  modalContainer: {
    width: "95%",
    maxHeight: "95%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 16,
  },
  modalContent: {
    marginBottom: 16,
  },
  unitInfoCloseButton: {
    marginTop: 20,
    backgroundColor: "hsla(129, 56%, 43%, 1)",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  unitInfoCloseButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
  createRecipeText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
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
    backgroundColor: "#4ade80",
    alignItems: "center",
    justifyContent: "center",
  },

  infoCircleSmallText: {
    color: "#fff",
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
  pantryToggleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  pantryToggleText: {
    fontSize: 14,
    color: "#333",
    marginRight: 8,
  },
  cookingTimeContainer: {
    marginBottom: 20,
  },

  cookingTimeLabel: {
    marginBottom: 10,
    fontWeight: "bold",
    fontSize: 16,
  },
  resetButton: {
    backgroundColor: "#f87171", // červené tlačidlo
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignSelf: "center",
    marginBottom: 15,
  },

  resetButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  infoText: {
    textAlign: "center",
    marginBottom: 20,
    fontSize: 20,
  },

  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  cancelButton: {
    flex: 1,
    marginRight: 5,
    backgroundColor: "grey",
    paddingVertical: 10,
    borderRadius: 10,
  },

  cancelButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },

  generateButton: {
    flex: 1,
    marginLeft: 5,
    backgroundColor: "hsla(129, 56%, 43%, 1)",
    paddingVertical: 10,
    borderRadius: 10,
  },

  generateButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginVertical: 10,
    marginLeft: 15,
  },
  recipeModalImage: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    marginBottom: 15,
  },

  recipeModalTitle: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  staticText: {
    fontSize: 18,
    marginBottom: 8,
  },
  aiSectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
  },

  aiSectionText: {
    fontSize: 18,
    marginBottom: 8,
  },
  nutritionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },

  nutritionContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
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

  ingredientsInfoButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#4ade80",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  ingredientsInfoButtonText: {
    color: "#fff",
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
    marginBottom: 4, // pre medzeru medzi riadkami
  },
  stepsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 6,
  },

  stepContainer: {
    backgroundColor: "#d1fae5",
    padding: 8,
    borderRadius: 10,
    marginBottom: 6,
  },

  stepText: {
    fontSize: 18,
  },
  modalButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },

  modalButtonClose: {
    flex: 1,
    marginRight: 5,
    backgroundColor: "grey",
    paddingVertical: 12,
    borderRadius: 12,
  },

  modalButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 18,
  },
  modalButtonSave: {
    flex: 1,
    marginLeft: 5,
    backgroundColor: "hsla(129, 56%, 43%, 1)",
    paddingVertical: 12,
    borderRadius: 12,
  },

  modalButtonDelete: {
    flex: 1,
    marginLeft: 5,
    backgroundColor: "#ff4d4d",
    paddingVertical: 12,
    borderRadius: 12,
  },
  generatingModalContainer: {
    backgroundColor: "#fff",
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

  preferenceCloseButton: {
    marginTop: 16,
    backgroundColor: "#4ade80",
    paddingVertical: 10,
    borderRadius: 10,
  },

  preferenceCloseButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },

  mainLayout: {
    flex: 1,
    backgroundColor: "#618a335d",
    width: "100%",
    height: "100%",
    alignItems: "center",
  },
  profileAvatar: {
    height: 180,
    width: 180,
    marginBottom: 20,
    marginTop: 65,
    backgroundColor: "white",
    borderRadius: 20,
    alignSelf: "center",
  },
  logo_slogan: {
    height: 250,
    width: 250,
    marginBottom: 20,
    marginTop: 90,
    backgroundColor: "white",
    borderRadius: 20,
    alignSelf: "center"
  },
  backArrow: {
    height: "100%",
    width: "100%",
    backgroundColor: "white",
    borderRadius: 50,
    marginTop: 10,
  },
  titleText: {
    fontSize: 35,
    fontWeight: "900",
    color: "hsla(0, 0%, 15%, 1.00)",
    marginBottom: 15,
  },
   welcomeTitle: {
    fontSize: 45,
    fontWeight: "900",
    color: "hsla(0, 0%, 15%, 1.00)",
    marginBottom: 20
  },
  cardContainer: {
    backgroundColor: "hsla(0, 0%, 100%, 0.65)",
    padding: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "white",
    width: 340,
    alignItems: "center",
    justifyContent: "center",
  },
  textInput: {
    backgroundColor: "white",
    fontSize: 20,
    fontWeight: "200",
    width: 260,
    height: 50,
    borderRadius: 15,
    borderColor: "black",
    borderWidth: 1,
    margin: 7,
    textAlign: "center",
    elevation: 6,
  },
  infoLabel: {
    fontWeight: "800",
    fontSize: 15,
    marginTop: 5,
    alignSelf: "flex-start",
    marginLeft: 40,
    color: "hsla(0, 0%, 15%, 1.00)",
  },
  welcomeText: {
    fontWeight: "600",
    fontSize: 18,
    marginTop: 5,
    paddingLeft: 35,
    paddingRight: 35,
    textAlign: "center",
    color: "hsla(0, 0%, 15%, 1.00)",
  },
  actionButton: {
    backgroundColor: "hsla(129, 56%, 43%, 1)",
    width: 225,
    height: 55,
    borderRadius: 10,
    marginTop: 15,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  actionButtonPressed: {
    backgroundColor: "hsla(129, 56%, 43%, 0.8)",
    width: 225,
    height: 55,
    borderRadius: 10,
    marginBottom: 20,
    marginTop: 15,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  actionButtonText: {
    color: "white",
    fontSize: 28,
    fontWeight: "900",
  },
  formContainer: {
    marginTop: 50,
    width: "85%",
    alignSelf: "center",
  },

  screenTitle: {
    fontSize: 25,
    fontWeight: "900",
    color: "hsla(0, 0%, 15%, 1.00)",
  },

  inputLabel: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "700",
    color: "hsla(0, 0%, 15%, 1.00)",
  },
  primaryButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },

  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
    fontSize: 16,
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

  backIcon: {
    height: "100%",
    width: "100%",
    backgroundColor: "white",
    borderRadius: 50,
  },

  optionRow: {
    flexDirection: "row",
    width: "90%",
    marginTop: 5,
    alignSelf: "center",
  },

  optionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
    alignItems: "center",
  },

  optionText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
  },

  selectButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    fontSize: 14,
    fontWeight: "400",
    width: 160,
    height: 40,
    borderRadius: 5,
    borderColor: "black",
    borderWidth: 1,
    marginTop: 5,
    elevation: 6,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalCard: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
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
    borderColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    marginTop: 3,
  },

  radioCircleInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: "#333",
  },

  modalLabel: {
    fontWeight: "500",
    marginBottom: 2,
  },

  modalDescription: {
    color: "#555",
    fontSize: 13,
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
    backgroundColor: "white",
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
  manualAddButton: {
    backgroundColor: "white",
    padding: 5,
    width: 160,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    alignSelf: "center",
    marginBottom: 50,
  },
  manualAddButtonText: {
    fontSize: 18,
    fontWeight: "700",
  },
  manualAddContainer: {
    backgroundColor: "white",
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
    backgroundColor: "white",
    fontSize: 18,
    width: 180,
    height: 45,
    borderRadius: 5,
    borderColor: "black",
    borderWidth: 1,
    marginTop: 10,
    alignSelf: "center",
    textAlign: "center",
  },
  primaryActionButton: {
    backgroundColor: "hsla(129, 56%, 43%, 1)",
    width: 180,
    height: 35,
    borderRadius: 5,
    marginTop: 15,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryActionButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  window: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    elevation: 10,
  },
  windowTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
  },
  nutritionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  nutritionLabel: {
    fontWeight: "600",
    color: "#333",
  },
  nutritionValue: {
    fontWeight: "700",
    color: "#111",
  },
  closeButton: {
    marginTop: 18,
    backgroundColor: "hsla(129, 56%, 43%, 1)",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "700",
  },
  title: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 12,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },
});
