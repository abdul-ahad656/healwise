import { Platform } from "react-native";

// Replace this with your PC's LAN IP
const LAN_IP = "192.168.0.128:5000";

let LOCALHOST = "";

if (Platform.OS === "android") {
  // Android emulator
  LOCALHOST = __DEV__ ? `http://${LAN_IP}` : "http://10.0.2.2:5000";
} else if (Platform.OS === "ios") {
  // iOS simulator
  LOCALHOST = __DEV__ ? `http://${LAN_IP}` : "http://localhost:5000";
} else {
  // Web
  LOCALHOST = "http://localhost:5000";
}

export const API_BASE_URL = `${LOCALHOST}/api`;
