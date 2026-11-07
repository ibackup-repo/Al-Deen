import { View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Heart, Search, Settings, LogIn } from "lucide-react-native";
import { Button } from "@/Component/UI/Button/Index";

export function Header() {
  const router = useRouter();
  const Navigate = (Path: string) => router.push(Path as any);

  const { width: screenWidth } = useWindowDimensions();
  
  // Als het scherm smaller is dan 450px, verplaatst Donate naar rechts
  const isCompact = screenWidth < 450;

  return (
    <View className="w-full flex-row items-center justify-between px-4 pt-4 pb-2 relative">
      
      {/* Absolute Midden: Donate (Staat altijd exact in het midden van de header, perfect verticaal gecentreerd op Android/iOS) */}
      {!isCompact && (
        <View 
          className="absolute inset-0 items-center justify-center pointer-events-none z-0"
          pointerEvents="box-none"
        >
          <View style={{ width: 48 }} pointerEvents="auto">
            <Button Icon={<Heart size={20} />} On_Click={() => Navigate("/Donate")} Height={48} />
          </View>
        </View>
      )}

      {/* Links: Ga terug (Nu gewoon weer netjes 48px breed!) */}
      <View className="flex-row items-center z-10" style={{ width: 48 }}>
        <Button Icon={<ArrowLeft size={20} />} On_Click={() => router.back()} Height={48} />
      </View>

      {/* Rechts: Search, Settings, Sign In (+ Donate als het scherm smal is) */}
      <View className="flex-row items-center z-10" style={{ gap: 8 }}>
        {isCompact && (
          <View style={{ width: 48 }}>
            <Button Icon={<Heart size={20} />} On_Click={() => Navigate("/Donate")} Height={48} />
          </View>
        )}
        <View style={{ width: 48 }}>
          <Button Icon={<Search size={20} />} On_Click={() => Navigate("/Search")} Height={48} />
        </View>
        <View style={{ width: 48 }}>
          <Button Icon={<Settings size={20} />} On_Click={() => Navigate("/Settings")} Height={48} />
        </View>
        <View style={{ width: 48 }}>
          <Button Icon={<LogIn size={20} />} On_Click={() => Navigate("/Sign-In")} Height={48} />
        </View>
      </View>

    </View>
  );
}

export default Header;