import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: "none",
        },
        sceneStyle: {
          backgroundColor: "transparent",
        },
      }}
    >
      <Tabs.Screen name="index" />

      <Tabs.Screen
        name="Aid"
        options={{
          headerShown: false,
        }}
      />
    </Tabs>
  );
}