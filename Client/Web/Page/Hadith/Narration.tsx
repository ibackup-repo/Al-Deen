import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@Web/Component/Layout/Index";
import { Copy, Share2, BookmarkPlus, Bookmark, ChevronLeft, ChevronRight } from "lucide-react";
import { Use_App } from "@Web/Context/App";
import { Use_Bookmarks } from "@/Hook/Use-Bookmarks";
import { Use_Auth } from "@Web/Context/Auth";
import { Use_Translation } from "@/Hook/Use-Translation";
import { Toast } from "@/Hook/Use-Toast";
import { Container } from "@Web/Component/UI/Container";
import { Button } from "@Web/Component/UI/Button";
import { Tooltip } from "@Web/Component/UI/Tooltip";
import { Share_Dialog } from "@Web/Component/Dialog/Share";
import { useState, useMemo } from "react";

import {
  Fetch_Collections,
  Get_Chapter,
  Fetch_Hadith_Composite,
} from "@/Library/Hadith-API";
import type {
  Collection_Info,
  Chapter_Data,
  Hadith_Composite,
  KBK_Translation,
  KBK_Transliteration,
  Narration as Narration_Type,
} from "@/Library/Hadith-Types";

const Clean_Edition = (Value_String?: string): string => 
  !Value_String || Value_String === "None" ? "" : Value_String;

function Build_Token_Map<T extends { Token_Index: number; Text: string; Edition: string }>(
  Rows_List: T[] | undefined,
  Edition_Identifier: string
): Record<number, string> {
  const Token_Map: Record<number, string> = {};
  if (!Edition_Identifier || !Rows_List) return Token_Map;

  for (const Row_Entry of Rows_List) {
    if (Row_Entry.Edition === Edition_Identifier) {
      Token_Map[Row_Entry.Token_Index] = Row_Entry.Text;
    }
  }

  return Token_Map;
}

const Narration = () => {
  const { 
    Collection: Collection_Param, 
    Chapter: Chapter_Param, 
    HadithId: Hadith_ID_Param 
  } = useParams<{
    Collection: string;
    Chapter: string;
    HadithId: string;
  }>();

  const { t } = Use_Translation();
  const { User: User_Context } = Use_Auth();
  const { Bookmarks: Bookmarks_List, Add_Bookmark, Remove_Bookmark } = Use_Bookmarks();
  const {
    Show_Hadith_Translation: Show_Hadith_Translation_Flag,
    Show_Hadith_Transliteration: Show_Hadith_Transliteration_Flag,
    Hadith_Arabic_Font_Size: Hadith_Arabic_Font_Size,
    Hadith_Translation_Font_Size: Hadith_Translation_Font_Size,
    Hadith_Transliteration_Font_Size: Hadith_Transliteration_Font_Size,
    Selected_Hadith_Translation_Edition: Selected_Hadith_Translation_Edition,
    Selected_Hadith_Transliteration_Edition: Selected_Hadith_Transliteration_Edition,

    Selected_Hadith_Hover_Translation_Edition: Selected_Hadith_Hover_Translation_Edition,
    Selected_Hadith_Inline_Translation_Edition: Selected_Hadith_Inline_Translation_Edition,
    Selected_Hadith_Hover_Transliteration_Edition: Selected_Hadith_Hover_Transliteration_Edition,
    Selected_Hadith_Inline_Transliteration_Edition: Selected_Hadith_Inline_Transliteration_Edition,
  } = Use_App();

  const [Is_Share_Open_Flag, Set_Is_Share_Open_Flag] = useState<boolean>(false);

  const Collection_ID = Collection_Param ?? "";
  const Chapter_ID_Number = Number(Chapter_Param) || 0;
  const Hadith_ID_Number = Number(Hadith_ID_Param) || 0;

  const { 
    data: Collections_List = [], 
    Is_Loading_Corpus_Data: Is_Collections_Loading_Flag 
  } = useQuery<Collection_Info[]>({
    queryKey: ["hadithCollections"],
    queryFn: () => Fetch_Collections(),
    staleTime: 1000 * 60 * 60,
  });

  const Normalize_Slug = (String_Value?: string): string => 
    String_Value?.toLowerCase().replace(/[\/-]/g, "") ?? "";

  const Target_Collection = Collections_List.find(
    (Collection_Entry: Collection_Info) => 
      Normalize_Slug(Collection_Entry.ID) === Normalize_Slug(Collection_ID)
  );

  const { 
    data: Chapter_Data_Payload = null, 
    Is_Loading_Corpus_Data: Is_Chapter_Loading_Flag 
  } = useQuery<Chapter_Data | null>({
    queryKey: ["hadithChapter", Target_Collection?.ID, Chapter_ID_Number],
    queryFn: () =>
      Target_Collection?.ID && Chapter_ID_Number
        ? Get_Chapter(Target_Collection.ID, Chapter_ID_Number)
        : null,
    enabled: Boolean(Target_Collection?.ID && Chapter_ID_Number),
    staleTime: 1000 * 60 * 30,
  });

  const Hover_Translation_Edition = Clean_Edition(Selected_Hadith_Hover_Translation_Edition);
  const Inline_Translation_Edition = Clean_Edition(Selected_Hadith_Inline_Translation_Edition);
  const Hover_Transliteration_Edition = Clean_Edition(Selected_Hadith_Hover_Transliteration_Edition);
  const Inline_Transliteration_Edition = Clean_Edition(Selected_Hadith_Inline_Transliteration_Edition);

  const Word_Translation_Editions_List = useMemo(
    () => Array.from(new Set([Hover_Translation_Edition, Inline_Translation_Edition].filter(Boolean))),
    [Hover_Translation_Edition, Inline_Translation_Edition]
  );
  const Word_Transliteration_Editions_List = useMemo(
    () => Array.from(new Set([Hover_Transliteration_Edition, Inline_Transliteration_Edition].filter(Boolean))),
    [Hover_Transliteration_Edition, Inline_Transliteration_Edition]
  );

  const { 
    data: Hadith_Composite_Payload = null, 
    Is_Loading_Corpus_Data: Is_Composite_Loading_Flag 
  } = useQuery<Hadith_Composite | null>({
    queryKey: [
      "hadithComposite",
      Target_Collection?.ID,
      Hadith_ID_Number,
      Selected_Hadith_Translation_Edition,
      Selected_Hadith_Transliteration_Edition,
      Hover_Translation_Edition,
      Inline_Translation_Edition,
      Hover_Transliteration_Edition,
      Inline_Transliteration_Edition,
    ],
    queryFn: () =>
      Target_Collection?.ID && Hadith_ID_Number
        ? Fetch_Hadith_Composite(
            Target_Collection.ID,
            Hadith_ID_Number,
            Selected_Hadith_Translation_Edition || "",
            Selected_Hadith_Transliteration_Edition || "",
            Word_Translation_Editions_List,
            Word_Transliteration_Editions_List
          )
        : null,
    enabled: Boolean(Target_Collection?.ID && Hadith_ID_Number),
    staleTime: 1000 * 60 * 30,
  });

  const Is_Fetching_Flag =
    Is_Collections_Loading_Flag ||
    (Boolean(Target_Collection?.ID) && Is_Chapter_Loading_Flag) ||
    (Boolean(Target_Collection?.ID && Hadith_ID_Number) && Is_Composite_Loading_Flag);

  if (Is_Fetching_Flag) {
    return <Layout />;
  }

  const Narration_Data = Hadith_Composite_Payload?.Narration;

  if (!Target_Collection || !Chapter_Data_Payload || !Narration_Data) {
    return (
      <Layout>
        <div className="py-16 text-center">
          <Container className="max-w-md mx-auto p-8">
            <h1 className="text-2xl font-semibold mb-4">Hadith Not Found</h1>
            <Link to="/Hadith">
              <Button>Back to Hadith</Button>
            </Link>
          </Container>
        </div>
      </Layout>
    );
  }

  const Convert_To_Rem = (Size_Value: number | undefined, Base_Scale = 1.2): string => {
    const Numeric_Value = typeof Size_Value === "number" && !isNaN(Size_Value) ? Size_Value : 5;
    return `${(Base_Scale * Numeric_Value) / 5}rem`;
  };

  const Safe_Collection_ID = Target_Collection.ID.replace(/\//g, "-");
  const Arabic_Text_Content = Narration_Data.text || "";
  const Primary_Translation_Text = Hadith_Composite_Payload?.Translation?.[0]?.Text || "";
  const Primary_Transliteration_Text = Hadith_Composite_Payload?.Transliteration?.[0]?.Text || "";

  const Is_Translation_Active_Flag = Boolean(Show_Hadith_Translation_Flag && Primary_Translation_Text);
  const Is_Transliteration_Active_Flag = Boolean(Show_Hadith_Transliteration_Flag && Primary_Transliteration_Text);

  let Grid_Columns_Class = "grid-cols-1";
  if (Is_Translation_Active_Flag && Is_Transliteration_Active_Flag) {
    Grid_Columns_Class = "grid-cols-1 lg:grid-cols-3";
  } else if (Is_Translation_Active_Flag || Is_Transliteration_Active_Flag) {
    Grid_Columns_Class = "grid-cols-1 lg:grid-cols-2";
  }

  const Chapter_Narrations_List = Chapter_Data_Payload.Narrations || [];
  const Current_Narration_Index = Chapter_Narrations_List.findIndex(
    (Narration_Item: Narration_Type) => Narration_Item.ID === Hadith_ID_Number
  );
  const Previous_Hadith_Entry =
    Current_Narration_Index > 0 ? Chapter_Narrations_List[Current_Narration_Index - 1] : null;
  const Next_Hadith_Entry =
    Current_Narration_Index !== -1 && Current_Narration_Index < Chapter_Narrations_List.length - 1
      ? Chapter_Narrations_List[Current_Narration_Index + 1]
      : null;

  const Is_Bookmarked_Flag = Bookmarks_List.some(
    (Bookmark_Entry) => Bookmark_Entry.Surah_ID === 0 && Bookmark_Entry.Ayah_ID === Narration_Data.ID
  );
  const Get_Bookmark_Identifier = (): string | undefined =>
    Bookmarks_List.find(
      (Bookmark_Entry) => Bookmark_Entry.Surah_ID === 0 && Bookmark_Entry.Ayah_ID === Narration_Data.ID
    )?.id;

  const Handle_Bookmark_Action = async (): Promise<void> => {
    if (!User_Context) {
      Toast({ title: "Sign in required", description: "Please sign in to bookmark Hadith" });
      return;
    }
    if (Is_Bookmarked_Flag) {
      const Bookmark_Identifier = Get_Bookmark_Identifier();
      if (Bookmark_Identifier) await Remove_Bookmark(Bookmark_Identifier);
    } else {
      await Add_Bookmark(
        0,
        Narration_Data.ID,
        `Hadith ${Narration_Data.ID} - ${Chapter_Data_Payload.Chapter.Name}`
      );
    }
  };

  const Handle_Copy_Action = (): void => {
    let Formatted_Clipboard_Text = Arabic_Text_Content;
    if (Primary_Transliteration_Text) Formatted_Clipboard_Text += `\n\n${Primary_Transliteration_Text}`;
    if (Primary_Translation_Text) Formatted_Clipboard_Text += `\n\n${Primary_Translation_Text}`;
    Formatted_Clipboard_Text += `\n\n— ${Target_Collection.Name} ${Narration_Data.ID}`;

    navigator.clipboard.writeText(Formatted_Clipboard_Text);
    Toast({ title: t.Quran.copy, description: "Hadith copied to clipboard" });
  };

  const Arabic_Words_List = Arabic_Text_Content.trim().split(/\s+/);

  const Hover_Translation_Map = Build_Token_Map<KBK_Translation>(
    Hadith_Composite_Payload?.KBK_Translation,
    Hover_Translation_Edition
  );
  const Inline_Translation_Map = Build_Token_Map<KBK_Translation>(
    Hadith_Composite_Payload?.KBK_Translation,
    Inline_Translation_Edition
  );
  const Hover_Transliteration_Map = Build_Token_Map<KBK_Transliteration>(
    Hadith_Composite_Payload?.KBK_Transliteration,
    Hover_Transliteration_Edition
  );
  const Inline_Transliteration_Map = Build_Token_Map<KBK_Transliteration>(
    Hadith_Composite_Payload?.KBK_Transliteration,
    Inline_Transliteration_Edition
  );

  const Has_Hover_Translation_Flag = Boolean(Hover_Translation_Edition);
  const Has_Hover_Transliteration_Flag = Boolean(Hover_Transliteration_Edition);
  const Has_Inline_Translation_Flag = Boolean(Inline_Translation_Edition);
  const Has_Inline_Transliteration_Flag = Boolean(Inline_Transliteration_Edition);

  const Render_Word_Element = (Word_Text: string, Token_Position: number) => {
    const Hover_Translation_Text = Hover_Translation_Map[Token_Position];
    const Hover_Transliteration_Text = Hover_Transliteration_Map[Token_Position];

    const Inline_Translation_Text = Inline_Translation_Map[Token_Position];
    const Inline_Transliteration_Text = Inline_Transliteration_Map[Token_Position];

    const Show_Tooltip_Flag = Boolean(
      (Has_Hover_Translation_Flag && Hover_Translation_Text) ||
        (Has_Hover_Transliteration_Flag && Hover_Transliteration_Text)
    );

    const Tooltip_Content_Element = Show_Tooltip_Flag ? (
      <div className="flex flex-col gap-1 p-1 text-center" dir="ltr">
        {Has_Hover_Transliteration_Flag && Hover_Transliteration_Text && (
          <span className="text-xs font-semibold text-emerald-500">
            {Hover_Transliteration_Text}
          </span>
        )}
        {Has_Hover_Translation_Flag && Hover_Translation_Text && (
          <span className="text-xs text-foreground">{Hover_Translation_Text}</span>
        )}
      </div>
    ) : null;

    const Word_Container_Element = (
      <div className="inline-flex flex-col items-center justify-center p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
        <span
          className="cursor-pointer transition-colors Duration-150 hover:text-emerald-600"
          style={{
            fontFamily: "'KFGQPC-Uthmani', sans-serif",
            fontSize: Convert_To_Rem(Hadith_Arabic_Font_Size, 1.4),
          }}
        >
          {Word_Text}
        </span>

        {Has_Inline_Transliteration_Flag && Inline_Transliteration_Text && (
          <span
            className="text-xs text-emerald-600 dark:text-emerald-400 font-medium tracking-wide mt-1"
            dir="ltr"
          >
            {Inline_Transliteration_Text}
          </span>
        )}

        {Has_Inline_Translation_Flag && Inline_Translation_Text && (
          <span
            className="text-xs text-muted-foreground mt-0.5"
            dir="ltr"
          >
            {Inline_Translation_Text}
          </span>
        )}
      </div>
    );

    return (
      <span key={Token_Position} className="inline-block my-1 mx-0.5">
        {Show_Tooltip_Flag ? (
          <Tooltip content={Tooltip_Content_Element} enabled={true} side="Top" offset={8}>
            {Word_Container_Element}
          </Tooltip>
        ) : (
          Word_Container_Element
        )}
      </span>
    );
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <Container className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <Container className="!py-1.5 !px-3 inline-flex w-auto max-w-full">
              <h1 className="text-sm font-medium truncate">
                {Target_Collection.Name} - {Chapter_Data_Payload.Chapter.Name} - {Narration_Data.ID}
              </h1>
            </Container>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" className="w-8 h-8 p-0" onClick={Handle_Copy_Action}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button size="sm" className="w-8 h-8 p-0" onClick={() => Set_Is_Share_Open_Flag(true)}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                className={`w-8 h-8 p-0 ${Is_Bookmarked_Flag ? "text-primary" : ""}`}
                onClick={Handle_Bookmark_Action}
              >
                {Is_Bookmarked_Flag ? (
                  <Bookmark className="h-4 w-4 fill-current" />
                ) : (
                  <BookmarkPlus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className={`grid ${Grid_Columns_Class} gap-8 items-start`}>
            {Is_Translation_Active_Flag && (
              <div className="order-3 lg:order-1 mt-2 lg:mt-0" dir="ltr">
                <p
                  className="text-justify leading-relaxed text-muted-foreground dark:text-neutral-200"
                  style={{ fontSize: Convert_To_Rem(Hadith_Translation_Font_Size, 1.0) }}
                >
                  {Primary_Translation_Text}
                </p>
              </div>
            )}

            {Is_Transliteration_Active_Flag && (
              <div className="order-2 lg:order-2 mt-2 lg:mt-0" dir="ltr">
                <p
                  className="text-justify leading-relaxed text-emerald-600 dark:text-emerald-400 font-medium"
                  style={{ fontSize: Convert_To_Rem(Hadith_Transliteration_Font_Size, 1.0) }}
                >
                  {Primary_Transliteration_Text}
                </p>
              </div>
            )}

            {Arabic_Text_Content && (
              <div
                className="order-1 lg:order-3 flex flex-wrap flex-row-reverse justify-start items-baseline gap-y-2"
                dir="rtl"
              >
                {Arabic_Words_List.map((Word_Item: string, Index_Position: number) =>
                  Render_Word_Element(Word_Item, Index_Position)
                )}
              </div>
            )}
          </div>
        </Container>

        <div className="flex items-center justify-between mt-6 pt-4">
          {Previous_Hadith_Entry ? (
            <Link to={`/Hadith/${Safe_Collection_ID}/${Chapter_ID_Number}/${Previous_Hadith_Entry.ID}`}>
              <Button className="px-4 py-2 inline-flex items-center gap-2">
                <ChevronLeft className="h-4 w-4" />
                Hadith {Previous_Hadith_Entry.ID}
              </Button>
            </Link>
          ) : (
            <div />
          )}
          {Next_Hadith_Entry && (
            <Link to={`/Hadith/${Safe_Collection_ID}/${Chapter_ID_Number}/${Next_Hadith_Entry.ID}`}>
              <Button className="px-4 py-2 inline-flex items-center gap-2">
                Hadith {Next_Hadith_Entry.ID}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>
      <Share_Dialog
        Open={Is_Share_Open_Flag}
        On_Open_Change={Set_Is_Share_Open_Flag}
        Surah_ID={0}
        Ayah_ID={Narration_Data.ID}
        Ayah_Text={Arabic_Text_Content}
        Translation={Primary_Translation_Text}
      />
    </Layout>
  );
};

export default Narration;