// Client/Web/Component/Quran/Layout/Page/Page_View.tsx
import React, { useMemo, useState, useRef } from "react";
import { Use_App } from "@Web/Context/App";
import { Page_Card } from "./Card";
import type { Page_View_Properties, Resolved_Kalimah, Basmalah_Kalimah, Page_Ayaat } from "./Types";
import { Get_Arabic_Field, Pick_Arabic_Text } from "../Utility";
import { useQuery } from "@tanstack/react-query";
import { Fetch_Surah_Details, Fetch_Page_Sections_Corpus, Fetch_Pages } from "@/Library/Quran-API";
import type { Surah_Details, Page_Sections, Kalimah_Entry } from "@/Library/Quran-API";
import type { Surah_Metadata, Ayah, Page } from "@/Library/Quran-Types";

const Raw_Script_Field_Map: Record<string, string> = {
  Arabic_V1: "Presentation_Form_A_Ligature_Based",
  Arabic_V2: "Presentation_Form_A_Glyph_Based",
};

// NOTE: field names are lowercase (Glyph/Translation/Transliteration) to match
// the Bismillah_Kalimah props consumed by Client/Web/Component/Quran/Bismillah.tsx.
// Keep this shape in sync with Basmalah_Kalimah in ./Types.
const Standard_Basmalah_Kalimaat: Basmalah_Kalimah[] = [
  { Glyph: "بِسْمِ", Translation: "In the name of", Transliteration: "Bismi" },
  { Glyph: "ٱللَّهِ", Translation: "Allah", Transliteration: "Allahi" },
  { Glyph: "ٱلرَّحْمَٰنِ", Translation: "the Entirely Merciful", Transliteration: "ar-Rahmani" },
  { Glyph: "ٱلرَّحِيمِ", Translation: "the Especially Merciful", Transliteration: "ar-Rahim" },
];

function Pick_Raw_Arabic_Text(
  item: Ayah | Kalimah_Entry,
  field: ReturnType<typeof Get_Arabic_Field>
): string {
  const rawField = Raw_Script_Field_Map[field] ?? field;
  return Pick_Arabic_Text(item as any, rawField as any);
}

function Parse_Page_Sections(section?: any): { Surah: number; Start_Ayah: number; End_Ayah: number }[] | null {
  if (!section) return null;

  if (typeof section === "object") {
    if (Array.isArray(section)) {
      return section.map((entry: any) => ({
        Surah: entry.Surah ?? entry["Surah"],
        Start_Ayah: entry.Start_Ayah ?? entry["Start_Ayah"],
        End_Ayah: entry.End_Ayah ?? entry["End_Ayah"],
      }));
    }
    if (section["Surah"] !== undefined) {
      return [{
        Surah: section["Surah"],
        Start_Ayah: section["Start_Ayah"],
        End_Ayah: section["End_Ayah"],
      }];
    }
  }

  if (typeof section === "string") {
    const chunks = section.split("|");
    const result: { Surah: number; Start_Ayah: number; End_Ayah: number }[] = [];

    for (const chunk of chunks) {
      const [start, end] = chunk.split("-");
      if (!start || !end) continue;

      const [Start_Surah_Ayah] = start.split(".");
      const [Start_Surah, Start_Ayah] = Start_Surah_Ayah.split(":");

      const [End_Surah_Ayah] = end.split(".");
      const [End_Surah, End_Ayah] = End_Surah_Ayah.split(":");

      if (!Start_Surah || !Start_Ayah || !End_Surah || !End_Ayah) continue;

      result.push({
        Surah: parseInt(Start_Surah, 10),
        Start_Ayah: parseInt(Start_Ayah, 10),
        End_Ayah: parseInt(End_Ayah, 10),
      });
    }

    return result.length > 0 ? result : null;
  }

  return null;
}

function Get_KBK_Translation_Edition(row: any): string | undefined {
  return row?.["Edition"];
}
function Get_KBK_Translation_Text(row: any): string | undefined {
  return row?.["Text"];
}
function Get_KBK_Transliteration_Edition(row: any): string | undefined {
  return row?.["Edition"];
}
function Get_KBK_Transliteration_Text(row: any): string | undefined {
  return row?.["Text"];
}

function Build_Kalimah_Text_Map(
  Rows: KBK_Translation[] | KBK_Transliteration[] | undefined,
  Get_Edition: (row: any) => string | undefined,
  Get_Text: (row: any) => string | undefined
): Map<string, string> {
  const Kalimah_Map = new Map<string, string>();

  for (const Row of Rows || []) {
    const Edition = Get_Edition(Row);
    const Ayah = Row?.Ayah;
    const Kalimah_Index = Row?.Kalimah;
    const Text = Get_Text(Row);

    if (!Edition || Ayah === undefined || Kalimah_Index === undefined || Text === undefined) {
      continue;
    }

    Kalimah_Map.set(`${Edition}:${Ayah}:${Kalimah_Index}`, Text);
  }

  return Kalimah_Map;
}

function Normalize_Edition(Edition_Name: string | boolean | undefined | null): string | null {
  return typeof Edition_Name === "string" && Edition_Name !== "None" && Edition_Name !== "" ? Edition_Name : null;
}

type Kalimah_Reference = { Ayah: number; Kalimah: number };

function Parse_Mushaf_Layout(layout: any): Kalimah_Reference[][] | null {
  if (!layout) return null;

  if (typeof layout === "string") {
    try {
      return Parse_Mushaf_Layout(JSON.parse(layout));
    } catch {
      return null;
    }
  }

  if (!Array.isArray(layout)) return null;

  const Lines_Data: Kalimah_Reference[][] = [];
  for (const line of layout) {
    if (!Array.isArray(line)) return null;

    const refs: Kalimah_Reference[] = [];
    for (const ref of line) {
      if (typeof ref !== "string") continue;
      const [Ayah_String, Kalimah_String] = ref.split(":");
      const Ayah = parseInt(Ayah_String, 10);
      const Kalimah = parseInt(Kalimah_String, 10);
      if (Number.isNaN(Ayah) || Number.isNaN(Kalimah)) continue;
      refs.push({ Ayah, Kalimah });
    }

    if (refs.length > 0) Lines_Data.push(refs);
  }

  return Lines_Data.length > 0 ? Lines_Data : null;
}

function Slice_Lines_For_Page(
  All_Lines: Kalimah_Reference[][],
  Raw_Page: Page | null | undefined,
  Page_Ayaat: Ayah[]
): Kalimah_Reference[][] | null {
  if (!Page_Ayaat || Page_Ayaat.length === 0) return null;

  const Page_Ayah_Numbers = new Set(Page_Ayaat.map((v) => v.Ayah));
  const Start_Ayah = Raw_Page?.Start_Ayah ?? Math.min(...Array.from(Page_Ayah_Numbers));
  const End_Ayah = Raw_Page?.End_Ayah ?? Math.max(...Array.from(Page_Ayah_Numbers));

  const result: Kalimah_Reference[][] = [];

  for (const line of All_Lines) {
    const Belongs_To_Page = line.some((ref) => {
      if (Page_Ayah_Numbers.has(ref.Ayah)) return true;
      if (ref.Ayah >= Start_Ayah && ref.Ayah <= End_Ayah) return true;
      return false;
    });

    if (Belongs_To_Page) {
      result.push(line);
    }
  }

  return result.length > 0 ? result : null;
}

function Build_Kalimah_From_Reference(
  ref: Kalimah_Reference,
  Kalimah_Map: Map<string, Kalimah_Entry>,
  Ayah_Map: Map<number, Ayah>,
  Last_Kalimah_Index_Per_Ayah: Map<number, number>,
  field: ReturnType<typeof Get_Arabic_Field>
): Resolved_Kalimah | null {
  const Kalimah = Kalimah_Map.get(`${ref.Ayah}:${ref.Kalimah}`);
  if (!Kalimah) return null;

  const Global_Kalimah_Index = Kalimah["Kalimah"];
  const Ayah = Ayah_Map.get(ref.Ayah) ?? null;
  const Is_Ayah_End = Last_Kalimah_Index_Per_Ayah.get(ref.Ayah) === Global_Kalimah_Index;

  return {
    Glyph: Pick_Raw_Arabic_Text(Kalimah, field),
    Ayah: Ayah as any,
    Kalimah_Index: Global_Kalimah_Index - 1,
    Is_Ayah_End: Is_Ayah_End,
    Is_Ayah_Marker: false,
    Ayah_ID: ref.Ayah,
  };
}

const Fatihah_Surah_Number = 1;

export function Page_View({
  Surah,
  Show_Arabic_Text = true,
  Hover_Translation,
  Hover_Transliteration,
  Inline_Translation,
  Inline_Transliteration,
  Font_Class,
  Arabic_Font_Size,
  Transliteration_Font_Size,
  Show_Transliteration,
  Ayah_Reference: External_Ayah_References,
  Kalimah_Spacing = "1.8px",
  Hide_Ayaat = false,
  Hide_Ayah_Markers = false,
  Page_Footer,
}: Page_View_Properties) {
  const { Quran_Font } = Use_App();
  const [Hovered_Ayah, Set_Hovered_Ayah] = useState<number | null>(null);

  const Fallback_Ayah_References = useRef<Map<number, HTMLDivElement>>(new Map());
  const Ayah_Reference = External_Ayah_References ?? Fallback_Ayah_References;

  const Translation_Edition = Normalize_Edition(Inline_Translation) || Normalize_Edition(Hover_Translation);
  const Transliteration_Edition = Normalize_Edition(Inline_Transliteration) || Normalize_Edition(Hover_Transliteration);

  const Requested_Translation_Editions = useMemo(
    () => Array.from(new Set([Translation_Edition].filter((x): x is string => !!x))),
    [Translation_Edition]
  );

  const Requested_Transliteration_Editions = useMemo(
    () => Array.from(new Set([Transliteration_Edition].filter((x): x is string => !!x))),
    [Transliteration_Edition]
  );

  const Surah_Number = (Surah as any)["Surah"] ?? (Surah as any).id;

  const { data: Surah_Details_Data, Is_Loading_Corpus_Data: Is_Surah_Loading } = useQuery<Surah_Details>({
    queryKey: [
      "Surah_Details_Data",
      Surah_Number,
      Requested_Translation_Editions.join(","),
      Requested_Transliteration_Editions.join(","),
    ],
    queryFn: () =>
      Fetch_Surah_Details(Surah_Number, [], [], Requested_Translation_Editions, Requested_Transliteration_Editions),
    staleTime: 1000 * 60 * 30,
  });
  console.log("RAW translation row sample:", Surah_Details_Data?.["Word_Translations"]?.slice(0, 5));

  const { data: Fatihah_Details_Data, Is_Loading_Corpus_Data: Is_Fatihah_Loading } = useQuery<Surah_Details>({
    queryKey: [
      "Surah_Details_Data",
      Fatihah_Surah_Number,
      Requested_Translation_Editions.join(","),
      Requested_Transliteration_Editions.join(","),
    ],
    queryFn: () =>
      Fetch_Surah_Details(
        Fatihah_Surah_Number,
        [],
        [],
        Requested_Translation_Editions,
        Requested_Transliteration_Editions
      ),
    staleTime: 1000 * 60 * 30,
    enabled: Show_Arabic_Text,
  });

  const { data: Page_Sections_Data, Is_Loading_Corpus_Data: Is_Page_Sections_Loading } = useQuery<Page_Sections>({
    queryKey: ["pageSectionsCorpus"],
    queryFn: Fetch_Page_Sections_Corpus,
    staleTime: 1000 * 60 * 60,
  });

  const { data: Raw_Pages_Data } = useQuery<Page[]>({
    queryKey: ["pageList"],
    queryFn: Fetch_Pages,
    staleTime: 1000 * 60 * 60,
  });

  const Raw_Page_Map = useMemo(() => {
    const map = new Map<number, Page>();
    const list: Page[] = Array.isArray(Raw_Pages_Data)
      ? Raw_Pages_Data
      : Array.isArray((Raw_Pages_Data as any)?.Pages)
      ? (Raw_Pages_Data as any).Pages
      : [];
    list.forEach((page) => {
      if (page.Page !== undefined && page.Page !== null) map.set(page.Page, page);
    });
    return map;
  }, [Raw_Pages_Data]);

  const Is_Indo_Pak_Font = Quran_Font === "IndoPak";
  const Is_Uthmani_V4_Font = Quran_Font === "Uthmani_V4";
  const Arabic_Field = useMemo(() => Get_Arabic_Field(Quran_Font), [Quran_Font]);

  const Active_Surah: Surah_Metadata | null = Surah_Details_Data?.["Surah"] || null;
  const Ayaat: Ayah[] = Surah_Details_Data?.["Ayah"] || [];
  const Kalimaat: Kalimah_Entry[] = Surah_Details_Data?.["Words"] || [];

  const Mushaf_Layout = Active_Surah?.["Layout"] ?? null;

  const Fatihah_Kalimaat: Kalimah_Entry[] = Fatihah_Details_Data?.["Words"] || [];

  const Fatihah_KBK_Translation_Map = useMemo(
    () => Build_Kalimah_Text_Map(Fatihah_Details_Data?.["Word_Translations"], Get_KBK_Translation_Edition, Get_KBK_Translation_Text),
    [Fatihah_Details_Data]
  );

  const Fatihah_KBK_Transliteration_Map = useMemo(
    () => Build_Kalimah_Text_Map(Fatihah_Details_Data?.["Word_Transliterations"], Get_KBK_Transliteration_Edition, Get_KBK_Transliteration_Text),
    [Fatihah_Details_Data]
  );

  const Basmalah_Words: Basmalah_Kalimah[] = useMemo(() => {
    if (!Show_Arabic_Text) return [];
    if (!Fatihah_Details_Data) return [];

    const Basmalah_Ayah_Words = Fatihah_Kalimaat
      .filter((w) => w["Ayah"] === 1)
      .sort((a, b) => a["Kalimah"] - b["Kalimah"])
      .slice(0, 4);

    if (Basmalah_Ayah_Words.length === 0) return Standard_Basmalah_Kalimaat;

    const First_Index = Basmalah_Ayah_Words[0]["Kalimah"];

    return Basmalah_Ayah_Words.map((Kalimah) => {
      const Relative_Index = Kalimah["Kalimah"] - First_Index + 1;
      const Global_Index = Kalimah["Kalimah"];

      const Glyph = Pick_Arabic_Text(Kalimah as any, Arabic_Field as any) || "";

      const Translation = Translation_Edition
        ? Fatihah_KBK_Translation_Map.get(`${Translation_Edition}:1:${Global_Index}`) ??
          Fatihah_KBK_Translation_Map.get(`${Translation_Edition}:1:${Relative_Index}`)
        : undefined;
      const Transliteration = Transliteration_Edition
        ? Fatihah_KBK_Transliteration_Map.get(`${Transliteration_Edition}:1:${Global_Index}`) ??
          Fatihah_KBK_Transliteration_Map.get(`${Transliteration_Edition}:1:${Relative_Index}`)
        : undefined;

      return { Glyph, Translation, Transliteration };
    });
  }, [
    Show_Arabic_Text,
    Fatihah_Details_Data,
    Fatihah_Kalimaat,
    Fatihah_KBK_Translation_Map,
    Fatihah_KBK_Transliteration_Map,
    Translation_Edition,
    Transliteration_Edition,
    Arabic_Field,
  ]);

  const Kalimah_Marker_Overrides = useMemo(() => {
    if (!Is_Indo_Pak_Font || !Ayaat.length) return [];
    return [] as string[];
  }, [Is_Indo_Pak_Font, Ayaat]);

  const Get_Page_Font_Family = (Page_Number: number): string => {
    switch (Quran_Font) {
      case "IndoPak": return "IndoPak";
      case "Uthmani": return "Uthmani";
      case "Uthmani_V1": return `Uthmani-V1-${Page_Number}`;
      case "Uthmani_V2": return `Uthmani-V2-${Page_Number}`;
      case "Uthmani_V4": return `Uthmani-V4-${Page_Number}`;
      default: return "Uthmani";
    }
  };

  const Basmalah_Mushaf_Page = 1;
  const Basmalah_Font_Family = useMemo(
    () => Get_Page_Font_Family(Basmalah_Mushaf_Page),
    [Quran_Font]
  );

  const KBK_Translation_Map = useMemo(
    () => Build_Kalimah_Text_Map(Surah_Details_Data?.["Word_Translations"], Get_KBK_Translation_Edition, Get_KBK_Translation_Text),
    [Surah_Details_Data]
  );

  const KBK_Transliteration_Map = useMemo(
    () => Build_Kalimah_Text_Map(Surah_Details_Data?.["Word_Transliterations"], Get_KBK_Transliteration_Edition, Get_KBK_Transliteration_Text),
    [Surah_Details_Data]
  );

  const Pages = useMemo(() => {
    if (!Active_Surah || !Ayaat.length) return [];

    const Start_Page = Active_Surah.Start_Page;
    const End_Page = Active_Surah.End_Page;

    const result: { Page_Number: number; Ayaat: Ayah[]; Raw_Page: Page | null }[] = [];

    const Ayah_Map = new Map<number, Ayah>();
    for (const Ayah of Ayaat) Ayah_Map.set(Ayah.Ayah, Ayah);

    if (!Page_Sections_Data || !Start_Page || !End_Page) {
      return [{ Page_Number: 1, Ayaat, Raw_Page: Raw_Page_Map.get(1) || null }];
    }

    for (let Page_Number = Start_Page; Page_Number <= End_Page; Page_Number++) {
      const Sections_For_Page = (Page_Sections_Data as any)[Page_Number] || null;
      const Parsed_Sections = Parse_Page_Sections(Sections_For_Page);
      const Raw_Page_For_This_Page = Raw_Page_Map.get(Page_Number) || null;

      if (!Parsed_Sections) {
        result.push({ Page_Number, Ayaat, Raw_Page: Raw_Page_For_This_Page });
        continue;
      }

      const Surah_Section = Parsed_Sections.find((seg) => seg.Surah === Active_Surah.Surah);
      if (!Surah_Section) continue;

      const Page_Ayaat: Ayah[] = [];
      for (let Ayah_ID = Surah_Section.Start_Ayah; Ayah_ID <= Surah_Section.End_Ayah; Ayah_ID++) {
        const Ayah = Ayah_Map.get(Ayah_ID);
        if (Ayah) Page_Ayaat.push(Ayah);
      }

      if (Page_Ayaat.length > 0) {
        result.push({ Page_Number, Ayaat: Page_Ayaat, Raw_Page: Raw_Page_For_This_Page });
      }
    }

    if (result.length === 0) {
      return [{ Page_Number: Start_Page || 1, Ayaat, Raw_Page: Raw_Page_Map.get(Start_Page || 1) || null }];
    }

    return result;
  }, [Active_Surah, Ayaat, Page_Sections_Data, Raw_Page_Map]);

  const { Kalimah_Map, Ayah_Map_With_KBK, Last_Kalimah_Index_Per_Ayah } = useMemo(() => {
    const First_Kalimah_Index_Per_Ayah = new Map<number, number>();
    for (const Kalimah of Kalimaat) {
      const Ayah_ID = Kalimah["Ayah"];
      const Kalimah_Index = Kalimah["Kalimah"];
      const Current_Lowest = First_Kalimah_Index_Per_Ayah.get(Ayah_ID);
      if (Current_Lowest === undefined || Kalimah_Index < Current_Lowest) {
        First_Kalimah_Index_Per_Ayah.set(Ayah_ID, Kalimah_Index);
      }
    }

    const Kalimah_Map = new Map<string, Kalimah_Entry>();
    for (const Kalimah of Kalimaat) {
      const Ayah_ID = Kalimah["Ayah"];
      const First_Index = First_Kalimah_Index_Per_Ayah.get(Ayah_ID);
      if (First_Index === undefined) continue;
      const Relative_Index = Kalimah["Kalimah"] - First_Index + 1;
      Kalimah_Map.set(`${Ayah_ID}:${Relative_Index}`, Kalimah);
    }

    const Last_Kalimah_Index_Per_Ayah = new Map<number, number>();
    for (const Kalimah of Kalimaat) {
      const Ayah_ID = Kalimah["Ayah"];
      const Kalimah_Index = Kalimah["Kalimah"];
      const Current_Highest = Last_Kalimah_Index_Per_Ayah.get(Ayah_ID);
      if (Current_Highest === undefined || Kalimah_Index > Current_Highest) {
        Last_Kalimah_Index_Per_Ayah.set(Ayah_ID, Kalimah_Index);
      }
    }

    const Build_Kalimah_Array_For_Ayah = (
      Ayah_ID: number,
      Text_Map: Map<string, string>,
      Edition_Name: string | null
    ): string[] | undefined => {
      if (!Edition_Name) return undefined;
      const First_Index = First_Kalimah_Index_Per_Ayah.get(Ayah_ID);
      const lastIndex = Last_Kalimah_Index_Per_Ayah.get(Ayah_ID);
      if (First_Index === undefined || lastIndex === undefined) return undefined;

      const result: string[] = [];
      for (let Global_Kalimah_Index = First_Index; Global_Kalimah_Index <= lastIndex; Global_Kalimah_Index++) {
        const Relative_Index = Global_Kalimah_Index - First_Index + 1;
        result[Global_Kalimah_Index - 1] =
          Text_Map.get(`${Edition_Name}:${Ayah_ID}:${Global_Kalimah_Index}`) ??
          Text_Map.get(`${Edition_Name}:${Ayah_ID}:${Relative_Index}`) ??
          "";
      }
      return result;
    };

    const Ayah_Map_With_KBK = new Map<number, Ayah>();
    for (const Ayah of Ayaat) {
      const Ayah_ID = Ayah.Ayah;
      const KBK_Translation = Build_Kalimah_Array_For_Ayah(Ayah_ID, KBK_Translation_Map, Translation_Edition);
      const KBK_Transliteration = Build_Kalimah_Array_For_Ayah(Ayah_ID, KBK_Transliteration_Map, Transliteration_Edition);

      Ayah_Map_With_KBK.set(Ayah_ID, { ...Ayah, KBK_Translation, KBK_Transliteration } as any);
    }

    return { Kalimah_Map, Ayah_Map_With_KBK, Last_Kalimah_Index_Per_Ayah };
  }, [Kalimaat, Ayaat, KBK_Translation_Map, KBK_Transliteration_Map, Translation_Edition, Transliteration_Edition]);

  const Layout_Line_References = useMemo(() => Parse_Mushaf_Layout(Mushaf_Layout), [Mushaf_Layout]);

  const Resolved_Lines = useMemo<Resolved_Kalimah[][]>(() => {
    if (!Kalimaat.length) return [];

    const Line_Map = new Map<number, Kalimah_Entry[]>();
    for (const Kalimah of Kalimaat) {
      const Line_Number = (Kalimah as any)["Line"] ?? 1;
      if (!Line_Map.has(Line_Number)) Line_Map.set(Line_Number, []);
      Line_Map.get(Line_Number)!.push(Kalimah);
    }

    const Lines_Data: Resolved_Kalimah[][] = [];

    Array.from(Line_Map.entries())
      .sort(([a], [b]) => a - b)
      .forEach(([_, Line_Kalimaat]) => {
        const line: Resolved_Kalimah[] = Line_Kalimaat.map((Kalimah) => {
          const Ayah_ID = Kalimah["Ayah"];
          const Ayah = Ayah_Map_With_KBK.get(Ayah_ID) ?? null;
          const Is_Ayah_End = Last_Kalimah_Index_Per_Ayah.get(Ayah_ID) === Kalimah["Kalimah"];

          return {
            Glyph: Pick_Raw_Arabic_Text(Kalimah, Arabic_Field),
            Ayah: Ayah,
            Kalimah_Index: Kalimah["Kalimah"] - 1,
            Is_Ayah_End: Is_Ayah_End,
            Is_Ayah_Marker: false,
            Ayah_ID: Ayah_ID,
          };
        });

        Lines_Data.push(line);
      });

    return Lines_Data;
  }, [Kalimaat, Ayah_Map_With_KBK, Last_Kalimah_Index_Per_Ayah, Arabic_Field]);

  const Resolved_Lines_Per_Page = useMemo(() => {
    if (Pages.length === 1 && Pages[0].Ayaat.length === Ayaat.length) {
      return [Resolved_Lines];
    }

    return Pages.map((page) => {
      const Ayah_Numbers = new Set(page.Ayaat.map((v) => v.Ayah));
      const Filtered_Lines = Resolved_Lines.filter((line) =>
        line.some((Kalimah) =>
          Kalimah.Ayah !== null
            ? Ayah_Numbers.has(Kalimah.Ayah.Ayah)
            : Kalimah.Ayah_ID
            ? Ayah_Numbers.has(Kalimah.Ayah_ID)
            : false
        )
      );
      return Filtered_Lines.length > 0 ? Filtered_Lines : Resolved_Lines;
    });
  }, [Pages, Resolved_Lines, Ayaat]);

  const Lines_For_All_Pages = useMemo(() => {
    return Pages.map((page, Page_Index) => {
      if (Layout_Line_References) {
        const Lines_For_This_Page = Slice_Lines_For_Page(Layout_Line_References, page.Raw_Page, page.Ayaat);

        if (Lines_For_This_Page) {
          const Converted_Lines = Lines_For_This_Page
            .map((line) =>
              line
                .map((ref) => Build_Kalimah_From_Reference(ref, Kalimah_Map, Ayah_Map_With_KBK, Last_Kalimah_Index_Per_Ayah, Arabic_Field))
                .filter((w): w is Resolved_Kalimah => w !== null)
            )
            .filter((line) => line.length > 0);

          if (Converted_Lines.length > 0) return Converted_Lines;
        }
      }

      return Resolved_Lines_Per_Page[Page_Index] || Resolved_Lines;
    });
  }, [Pages, Layout_Line_References, Kalimah_Map, Ayah_Map_With_KBK, Last_Kalimah_Index_Per_Ayah, Arabic_Field, Resolved_Lines_Per_Page, Resolved_Lines]);

  const Is_Loading_Corpus_Data = Is_Surah_Loading || Is_Page_Sections_Loading;

  if (Is_Loading_Corpus_Data || !Active_Surah) {
    return (
      <div className="w-full space-y-4 p-8 text-center animate-pulse">
        <div className="h-12 bg-muted rounded-xl w-3/4 mx-auto" />
        <div className="h-40 bg-muted rounded-2xl w-full" />
      </div>
    );
  }

  const Surah_ID = Active_Surah.Surah;
  const Should_Show_Basmalah = Surah_ID !== 1 && Surah_ID !== 9 && Show_Arabic_Text;

  return (
    <div id="Quran-Container" className="space-y-4">
      {Pages.map((page, Page_Index) => {
        const Page_Font_Family = Get_Page_Font_Family(page.Page_Number);
        const Show_Basmalah_On_This_Page = Page_Index === 0 && Should_Show_Basmalah;
        const Container_Class = Page_Index === 0 ? "rounded-t-none rounded-b-[48px] mb-2" : "rounded-[48px] mb-2";
        const Lines_To_Render = Lines_For_All_Pages[Page_Index] || Resolved_Lines;

        const Page_Data_Object: Page_Ayaat = {
          Page_Number: page.Page_Number,
          Ayah: page.Ayaat as any,
        };

        return (
          <Page_Card
            key={page.Page_Number}
            Page_Data={Page_Data_Object}
            Raw_Page_Data={page.Raw_Page}
            Page_Index={Page_Index}
            Surah_Number={Surah_ID}
            Resolved_Lines={Lines_To_Render}
            Container_Class={Container_Class}
            Show_Arabic_Text={Show_Arabic_Text}
            Show_Transliteration={Show_Transliteration}
            Show_Basmalah_On_Page={Show_Basmalah_On_This_Page}
            Basmalah_Kalimaat={Basmalah_Words}
            Page_Font_Family={Page_Font_Family}
            Basmalah_Page_Font_Family={Basmalah_Font_Family}
            Font_Class={Font_Class}
            Arabic_Font_Size={Arabic_Font_Size}
            Kalimah_Spacing={Kalimah_Spacing}
            Ayah_Reference={Ayah_Reference}
            Highlighted_Ayah={Hovered_Ayah}
            Set_Highlighted_Ayah={Set_Hovered_Ayah}
            Transliteration_Font_Size={Transliteration_Font_Size}
            Hover_Translation={Hover_Translation}
            Hover_Transliteration={Hover_Transliteration}
            Inline_Translation={Inline_Translation}
            Inline_Transliteration={Inline_Transliteration}
            Hide_Ayaat={Hide_Ayaat}
            Hide_Ayah_Markers={Hide_Ayah_Markers}
            Is_Indo_Pak_Font={Is_Indo_Pak_Font}
            Ayah_Marker_Overrides={Kalimah_Marker_Overrides}
            Is_Uthmani_V4_Font={Is_Uthmani_V4_Font}
            Page_Footer={Page_Footer}
            Layout={Mushaf_Layout as any}
          />
        );
      })}
    </div>
  );
}