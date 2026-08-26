// Ayah List
import { useMemo } from "react";
import { Ayah_Card } from "./Card";
import type { Ayah_List_Properties } from "../Types";

export function Ayah_List({
  Surah,
  Ayah,
  Kalimah,
  Translation,
  Transliteration,
  KBK_Translation,
  KBK_Transliteration,
  Footnote,
  Show_Arabic_Text,
  Show_Translation,
  Show_Transliteration,
  Translation_Font_Size,
  Transliteration_Font_Size,
  Hover_Translation,
  Hover_Transliteration,
  Inline_Translation,
  Inline_Transliteration,
  Target_Ayah,
  Ayah_Reference,
  On_Notes_Click,
  On_Share_Click,
  On_Tafsir_Click,
  On_Embed_Click,
  On_Render_Click,
  Flush_First_Item_Top = true,
}: Ayah_List_Properties) {
  const Normalized_Ayaat = useMemo(() => {
    if (!Ayah) return [];
    if (Array.isArray(Ayah)) return Ayah.flat();
    if (typeof Ayah === "object" && Array.isArray((Ayah as any).data)) {
      return (Ayah as any).data.flat();
    }
    return [];
  }, [Ayah]);

  const KBK_Translation_Map = useMemo(() => {
    const Translation_Map = new Map<string, string>();
    const List = Array.isArray(KBK_Translation) ? KBK_Translation.flat() : [];

    for (const Item of List) {
      if (!Item) continue;
      const Ayah_ID = Item["Ayah"] ?? Item.Ayah ?? Item.verse_number;
      const Word_Number = Item["Kalimah"] ?? Item.Kalimah ?? Item.word_number;
      const Text_Content = Item["Text"] ?? Item.Translation ?? (Item as any).text;

      if (Ayah_ID !== undefined && Word_Number !== undefined && Text_Content !== undefined) {
        Translation_Map.set(`${Ayah_ID}:${Word_Number}`, Text_Content);
      }
    }
    return Translation_Map;
  }, [KBK_Translation]);

  const KBK_Transliteration_Map = useMemo(() => {
    const Transliteration_Map = new Map<string, string>();
    const List = Array.isArray(KBK_Transliteration) ? KBK_Transliteration.flat() : [];

    for (const Item of List) {
      if (!Item) continue;
      const Ayah_ID = Item["Ayah"] ?? Item.Ayah ?? Item.verse_number;
      const Word_Number = Item["Kalimah"] ?? Item.Kalimah ?? Item.word_number;
      const Text_Content = Item["Text"] ?? Item.Transliteration ?? (Item as any).text;

      if (Ayah_ID !== undefined && Word_Number !== undefined && Text_Content !== undefined) {
        Transliteration_Map.set(`${Ayah_ID}:${Word_Number}`, Text_Content);
      }
    }
    return Transliteration_Map;
  }, [KBK_Transliteration]);

  const Kalimaat_By_Ayah = useMemo(() => {
    const Kalimah_Map = new Map<number, any[]>();
    const Kalimaat_Array = Array.isArray(Kalimah) ? Kalimah.flat() : [];

    for (const Kalimah of Kalimaat_Array) {
      if (!Kalimah) continue;
      const Ayah_ID = Number(Kalimah["Ayah"] ?? Kalimah.Ayah ?? Kalimah.verse_number);
      if (isNaN(Ayah_ID)) continue;

      const Existing = Kalimah_Map.get(Ayah_ID);
      if (Existing) Existing.push(Kalimah);
      else Kalimah_Map.set(Ayah_ID, [Kalimah]);
    }
    return Kalimah_Map;
  }, [Kalimah]);

  const Translations_By_Ayah = useMemo(() => {
    const Translation_Map = new Map<number, any[]>();

    let Translation_Array: any[] = [];
    if (Array.isArray(Translation)) {
      Translation_Array = Translation.flat();
    } else if (Translation && typeof Translation === "object" && Array.isArray((Translation as any).data)) {
      Translation_Array = (Translation as any).data.flat();
    }

    for (const Translation_Item of Translation_Array) {
      if (!Translation_Item) continue;
      const Ayah_ID = Number(
        Translation_Item["Ayah"] ?? Translation_Item.Ayah ?? Translation_Item.verse_number
      );
      if (!isNaN(Ayah_ID)) {
        const Translation_Text =
          Translation_Item["Translation"] ??
          Translation_Item.Text ??
          Translation_Item["Text"] ??
          (Translation_Item as any).text ??
          "";
        const Translation_List = Translation_Map.get(Ayah_ID) || [];
        Translation_List.push({
          id: Translation_Item["Translator"] ?? Translation_Item.id ?? Translation_Item.translation_id,
          name: Translation_Item["Translator"] ?? Translation_Item.author_name ?? Translation_Item.name,
          Text: Translation_Text,
          footnotes: Translation_Item["Footnote"] ?? Translation_Item.footnote,
        });
        Translation_Map.set(Ayah_ID, Translation_List);
      }
    }
    return Translation_Map;
  }, [Translation]);

  const Transliterations_By_Ayah = useMemo(() => {
    const Transliteration_Map = new Map<number, string>();
    const Transliterations_Array = Array.isArray(Transliteration) ? Transliteration.flat() : [];

    for (const Transliteration_Item of Transliterations_Array) {
      if (!Transliteration_Item) continue;
      const Ayah_ID = Number(
        Transliteration_Item["Ayah"] ??
          Transliteration_Item.Ayah ??
          Transliteration_Item.verse_number
      );
      if (!isNaN(Ayah_ID) && !Transliteration_Map.has(Ayah_ID)) {
        const Transliteration_Text =
          Transliteration_Item["Transliteration"] ??
          Transliteration_Item.Text ??
          Transliteration_Item["Text"] ??
          (Transliteration_Item as any).text ??
          "";
        Transliteration_Map.set(Ayah_ID, Transliteration_Text);
      }
    }
    return Transliteration_Map;
  }, [Transliteration]);

  if (!Normalized_Ayaat || Normalized_Ayaat.length === 0) {
    return null;
  }

  const Surah_Number = Number(Surah?.["Surah"] ?? (Surah as any)?.id ?? 1);

  return (
    <div
      className={
        Flush_First_Item_Top
          ? "space-y-4 [&>*:first-child]:!rounded-tl-none [&>*:first-child]:!rounded-tr-none"
          : "space-y-4"
      }
    >
      {Normalized_Ayaat.map((Ayah_Item, Index) => {
        if (!Ayah_Item) return null;

        const Ayah_ID = Number(
          Ayah_Item["Ayah"] ??
            Ayah_Item.Ayah ??
            Ayah_Item.Ayah_ID ??
            Ayah_Item.verse_number ??
            Index + 1
        );

        const Unique_Key = `Ayah-${Surah_Number}-${Ayah_ID}-${Index}`;

        const Raw_Kalimaat = Kalimaat_By_Ayah.get(Ayah_ID) || [];

        const Sorted_Kalimaat = [...Raw_Kalimaat].sort((Kalimah_A, Kalimah_B) => {
          const A_Number = Number(Kalimah_A["Kalimah"] ?? Kalimah_A.Kalimah ?? Kalimah_A.word_number ?? 0);
          const B_Number = Number(Kalimah_B["Kalimah"] ?? Kalimah_B.Kalimah ?? Kalimah_B.word_number ?? 0);
          return A_Number - B_Number;
        });

        const Kalimaat_For_Ayah = Sorted_Kalimaat.map((Kalimah, Kalimah_Index) => {
          const Word_Number = Kalimah["Kalimah"] ?? Kalimah.Kalimah ?? Kalimah.word_number ?? Kalimah_Index + 1;
          const KBK_Key = `${Ayah_ID}:${Word_Number}`;

          return {
            ...Kalimah,
            Translation:
              KBK_Translation_Map.get(KBK_Key) ??
              Kalimah.Translation ??
              Kalimah.KBK_Translation ??
              Kalimah.Translation,
            Transliteration:
              KBK_Transliteration_Map.get(KBK_Key) ??
              Kalimah.Transliteration ??
              Kalimah.KBK_Transliteration ??
              Kalimah.Transliteration,
          };
        });

        const Translations_For_Ayah = Translations_By_Ayah.get(Ayah_ID) || [];
        const Ayah_Translation_Text = Translations_For_Ayah.length > 0 ? Translations_For_Ayah[0].Text : null;
        const Ayah_Transliteration_Text = Transliterations_By_Ayah.get(Ayah_ID) || null;

        const Arabic_Text = Ayah_Item["Arabic"] ?? Ayah_Item.Arabic ?? Ayah_Item.Text ?? (Ayah_Item as any).text ?? "";

        return (
          <Ayah_Card
            key={Unique_Key}
            Ayah={Ayah_Item}
            Kalimah={Kalimaat_For_Ayah}
            Translation={Ayah_Translation_Text}
            Translations={Translations_For_Ayah}
            Transliteration={Ayah_Transliteration_Text}
            Footnote={Footnote}
            Surah={Surah}
            Show_Arabic_Text={Show_Arabic_Text}
            Show_Translation={Show_Translation}
            Translation_Font_Size={Translation_Font_Size}
            Transliteration_Font_Size={Transliteration_Font_Size}
            Show_Transliteration={!!Show_Transliteration}
            Hover_Translation={Hover_Translation}
            Hover_Transliteration={Hover_Transliteration}
            Inline_Translation={Inline_Translation}
            Inline_Transliteration={Inline_Transliteration}
            Is_Highlighted={!!Target_Ayah && parseInt(String(Target_Ayah), 10) === Ayah_ID}
            Ayah_Reference={(Element) => {
              if (Element && Ayah_Reference?.current) {
                Ayah_Reference.current.set(Ayah_ID, Element);
              }
            }}
            On_Notes_Click={() => On_Notes_Click?.(Ayah_ID, Arabic_Text)}
            On_Share_Click={() => On_Share_Click?.(Ayah_ID, Arabic_Text, Ayah_Translation_Text ?? undefined)}
            On_Tafsir_Click={() => On_Tafsir_Click?.(Ayah_ID)}
            On_Embed_Click={On_Embed_Click ? () => On_Embed_Click(Ayah_ID) : undefined}
            On_Render_Click={On_Render_Click ? () => On_Render_Click(Ayah_ID) : undefined}
          />
        );
      })}
    </div>
  );
}