export const Page_Transition_Settings = {
  Enabled: true,

  // Vergroten en verkleinen van de overlay (ms)
  Duration: 400,

  // Uitfaden van de overlay nadat de nieuwe pagina staat (ms)
  Fade_Duration: 0,

  // true: de overlay blijft fullscreen staan nadat de nieuwe pagina staat.
  // Hij krimpt pas weer bij terugnavigeren.
  // false: de overlay fadet na navigatie weg (oud gedrag).
  Keep_Overlay_After_Navigation: true,

  // Startkleur van de overlay (de kleur van de knop/vorm waar hij uit groeit).
  // Knop op een lichte pagina (zonder blijvende zwarte laag), bijv. Root:
  Start_Color_On_Light_Page: "#000000",

  // Knop op een pagina die zelf op de blijvende zwarte laag staat, bijv. Aid:
  Start_Color_On_Dark_Page: "#ffffff",

  // Kleur waar de overlay naartoe groeit (en de blijvende achtergrond).
  End_Color: "#000000",

  // Radius bij fullscreen (minimum)
  Border_Radius_Min: 26,

  // Radius bij de kleinste vorm (maximum, wordt begrensd op de helft van de zijde)
  Border_Radius_Max: 9999,

  Padding_Top: 8,
  Padding_Bottom: 16,
  Padding_Horizontal: 16,

  Disable_Click_During_Transition: true,

  Easing: "cubic" as const,
};

export default Page_Transition_Settings;