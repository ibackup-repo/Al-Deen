import { Stack } from "expo-router";

export default function AidLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: "transparent",
        },
      }}
    >
      <Stack.Screen name="index" />

      <Stack.Screen name="Masjid-Finder/index" />

      <Stack.Screen name="Tasbih-Counter/index" />
    </Stack>
  );
}