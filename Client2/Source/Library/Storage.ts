import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const Storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.error("localStorage error:", error);
        return null;
      }
    } else {
      try {
        return await AsyncStorage.getItem(key);
      } catch (error) {
        console.error("AsyncStorage error:", error);
        return null;
      }
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error("localStorage error:", error);
      }
    } else {
      try {
        await AsyncStorage.setItem(key, value);
      } catch (error) {
        console.error("AsyncStorage error:", error);
      }
    }
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === "web") {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error("localStorage error:", error);
      }
    } else {
      try {
        await AsyncStorage.removeItem(key);
      } catch (error) {
        console.error("AsyncStorage error:", error);
      }
    }
  },
};