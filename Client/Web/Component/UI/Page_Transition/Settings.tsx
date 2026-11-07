export const Page_Transition_Settings = {
  Enabled: true,
  Duration: 400,

  Start_Color_On_Light_Page: "#000000",
  Start_Color_On_Dark_Page: "#ffffff",
  End_Color: "#000000",

  // Radius waarmee de overlay BEGINT (op de knop). Wordt begrensd op de helft
  // van de kleinste zijde van de knop. Zet op null om de radius van de knop
  // zelf te gebruiken (Transition_Border_Radius / Button-config).
  Border_Radius_Start: 9999 as number | null,

  // Radius waarmee de overlay EINDIGT (fullscreen), en van de blijvende
  // zwarte laag onder de pagina.
  Border_Radius_End: 26,

  Padding_Top: 8,
  Padding_Bottom: 16,
  Padding_Horizontal: 16,

  Disable_Click_During_Transition: true,

  // Komt overeen met Easing.inOut(Easing.cubic)
  Easing: "cubic-bezier(0.65, 0, 0.35, 1)",

  // Moet overeenkomen met je header (pt-12 / md:pt-16 in Layout).
  Get_Header_Height: () => (window.innerWidth >= 768 ? 64 : 48),
};

// Het "fullscreen" doelgebied, in window-coördinaten.
export const Get_End_Rect = () => {
  const S = Page_Transition_Settings;
  const Top = S.Get_Header_Height() + S.Padding_Top;

  return {
    X: S.Padding_Horizontal,
    Y: Top,
    Width: Math.max(0, window.innerWidth - S.Padding_Horizontal * 2),
    Height: Math.max(0, window.innerHeight - Top - S.Padding_Bottom),
  };
};

export default Page_Transition_Settings;