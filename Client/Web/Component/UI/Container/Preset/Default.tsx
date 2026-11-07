import type {
  Container_Configuration_Map,
} from "../Types";

export const Default_Container_Configuration: Container_Configuration_Map = {
  Light: {
    Primary: {
      BG_Color: "#000000",
      Text_Color: "#ffffff",

      Border_Color: "#e2e8f000",
      Border_Width: 1,
      Border_Radius: 9999,

      Padding: {
        Top: 16,
        Right: 16,
        Bottom: 16,
        Left: 16,
      },

      Margin: {
        Top: 0,
        Right: 0,
        Bottom: 0,
        Left: 0,
      },

      Gap: 12,

      Has_Border: true,
    },

    Secondary: {
      BG_Color: "#f8fafc",
      Text_Color: "#0f172a",

      Border_Color: "#e2e8f0",
      Border_Width: 1,
      Border_Radius: 12,

      Padding: {
        Top: 12,
        Right: 12,
        Bottom: 12,
        Left: 12,
      },

      Margin: {
        Top: 0,
        Right: 0,
        Bottom: 0,
        Left: 0,
      },

      Gap: 8,

      Has_Border: true,
    },
  },

  Dark: {
    // Zelfde als Light (zwarte pil), zodat er visueel niets verandert.
    Primary: {
      BG_Color: "#ffffff",
      Text_Color: "#000000",

      Border_Color: "#ffffff00",
      Border_Width: 1,
      Border_Radius: 9999,

      Padding: {
        Top: 16,
        Right: 16,
        Bottom: 16,
        Left: 16,
      },

      Margin: {
        Top: 0,
        Right: 0,
        Bottom: 0,
        Left: 0,
      },

      Gap: 12,

      Has_Border: true,
    },

    // Kleuren sluiten aan op Button Dark Secondary.
    Secondary: {
      BG_Color: "#1e293b",
      Text_Color: "#f8fafc",

      Border_Color: "#334155",
      Border_Width: 1,
      Border_Radius: 12,

      Padding: {
        Top: 12,
        Right: 12,
        Bottom: 12,
        Left: 12,
      },

      Margin: {
        Top: 0,
        Right: 0,
        Bottom: 0,
        Left: 0,
      },

      Gap: 8,

      Has_Border: true,
    },
  },
};

export default Default_Container_Configuration;