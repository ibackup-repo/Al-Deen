import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Copy, Share2, ChevronDown } from "lucide-react";
import { Toast } from "@/Hook/Use-Toast";
import { Button } from "@Web/Component/UI/Button";
import { Container } from "@Web/Component/UI/Container";
import { Tooltip } from "@Web/Component/UI/Tooltip";
import { Layout } from "@Web/Component/Layout/Index";
import {
  Dropdown_Menu,
  Dropdown_Menu_Content,
  Dropdown_Menu_Item,
  Dropdown_Menu_Trigger,
} from "@Web/Component/UI/Dropdown-Menu";
import { Share_Dialog } from "@Web/Component/Dialog/Share";
import { Use_App } from "@Web/Context/App";

import { Fetch_Adiyah_Categories, Get_Adiyah_Category } from "@Web/../Source/Library/Aid-API";
import type { Adiyah_Record, Adiyah_Category_Output_Payload } from "@Web/../Source/Library/Aid-Types";

function Extract_Slug_From_Category_Name(Category_Name_String: string): string {
  return Category_Name_String.replace(/\s+/g, "-");
}

function Format_Category_Name_From_Slug(Category_Slug_String: string): string {
  return Category_Slug_String
    .split("-")
    .map((Word_Token) => Word_Token.charAt(0).toUpperCase() + Word_Token.slice(1))
    .join(" ");
}

const Convert_Font_Size_To_Rem_Value = (Font_Size_Number: number, Base_Scale_Number = 1.2) =>
  `${(Base_Scale_Number * Font_Size_Number) / 5}rem`;

function Reference_Link({ Reference_Content_Text }: { Reference_Content_Text: string }) {
  if (Reference_Content_Text.toLowerCase().startsWith("Quran")) {
    return <span className="text-xs text-muted-foreground">{Reference_Content_Text}</span>;
  }

  const Reference_Path_Tokens_List = Reference_Content_Text.split("/");
  if (Reference_Path_Tokens_List.length === 3) {
    const [Collection_Slug_String, Chapter_Slug_String, Number_String] = Reference_Path_Tokens_List;

    const Format_Slug_Token = (Slug_Token_String: string) => {
      return Slug_Token_String
        .split("-")
        .map((Word_Token) => {
          if (Word_Token.toLowerCase() === "al") return "al";
          return Word_Token.charAt(0).toUpperCase() + Word_Token.slice(1).toLowerCase();
        })
        .join(" ");
    };

    const Collection_Display_Name = Format_Slug_Token(Collection_Slug_String);
    const Chapter_Display_Name = Format_Slug_Token(Chapter_Slug_String);
    const Target_Hadith_Path = `/Hadith/${Collection_Slug_String}/${Chapter_Slug_String}/${Number_String}`;

    return (
      <Link to={Target_Hadith_Path} className="text-xs text-muted-foreground hover:underline">
        {Collection_Display_Name} - {Chapter_Display_Name} - {Number_String}
      </Link>
    );
  }

  const Cleaned_Reference_Text = Reference_Content_Text.replace(/#/g, "").trim();
  return <span className="text-xs text-muted-foreground">{Cleaned_Reference_Text}</span>;
}

const Dua_Category = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const {
    Show_Dua_Translation,
    Show_Dua_Transliteration,
    Show_Dua_Inline_Translation,
    Show_Dua_Inline_Transliteration,
    Show_Dua_Hover_Translation,
    Show_Dua_Hover_Transliteration,
    Dua_Arabic_Font_Size,
    Dua_Translation_Font_Size,
    Dua_Transliteration_Font_Size,
    Dua_Inline_Translation_Font_Size,
    Dua_Inline_Transliteration_Font_Size,
  } = Use_App();

  const [Active_Tooltip_State, Set_Active_Tooltip_State] = useState<{
    Adiyah_Index_Position: number;
    Word_Index_Position: number;
  } | null>(null);
  const [Target_Share_Adiyah_Record, Set_Target_Share_Adiyah_Record] = useState<Adiyah_Record | null>(null);

  const { data: Category_Data_Payload, Is_Loading_Corpus_Data } = useQuery<Adiyah_Category_Output_Payload | null>({
    queryKey: ["aidDuaCategory", categoryId],
    queryFn: async () => {
      if (!categoryId) return null;
      const Adiyah_Categories_List = await Fetch_Adiyah_Categories();
      const Formatted_Target_Category_Name = Format_Category_Name_From_Slug(categoryId).toLowerCase();

      const Matched_Category_Record = Adiyah_Categories_List.find(
        (Category_Item) =>
          Category_Item.Category_Name.toLowerCase() === Formatted_Target_Category_Name ||
          Extract_Slug_From_Category_Name(Category_Item.Category_Name).toLowerCase() === categoryId.toLowerCase() ||
          String(Category_Item.ID) === categoryId
      );

      if (!Matched_Category_Record) return null;
      return Get_Adiyah_Category(Matched_Category_Record.ID, true);
    },
    staleTime: 1000 * 60 * 15,
    enabled: !!categoryId,
  });

  if (Is_Loading_Corpus_Data) {
    return (
      <Layout>
        <section>
          <div className="mx-auto max-w-3xl space-y-5">
            {[...Array(3)].map((_, Index_Position) => (
              <Container key={Index_Position} className="p-5 space-y-4 animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="h-6 bg-muted rounded w-24"></div>
                  <div className="h-6 bg-muted rounded w-12"></div>
                </div>
                <div className="h-12 bg-muted rounded w-full justify-self-end"></div>
                <div className="h-5 bg-muted rounded w-3/4"></div>
              </Container>
            ))}
          </div>
        </section>
      </Layout>
    );
  }

  if (!Category_Data_Payload) {
    return (
      <Layout>
        <div className="py-16 text-center">
          <Container className="max-w-md mx-auto">
            <div className="p-8 text-center">
              <h1 className="text-2xl font-semibold mb-4">Category Not Found</h1>
              <Link to="/Aid/Dua" className="inline-block">
                <Button>Back to Duas</Button>
              </Link>
            </div>
          </Container>
        </div>
      </Layout>
    );
  }

  const Execute_Copy_Adiyah_Content = (Adiyah_Item: Adiyah_Record) => {
    const Plain_Text_Payload = `${Adiyah_Item.Arabic_Content_Text}\n\n${Adiyah_Item.Translation_Content_Text}\n\n— ${Adiyah_Item.Reference_Content_Text}`;
    navigator.clipboard.writeText(Plain_Text_Payload);
    Toast({ title: "Copied", description: "Dua copied to clipboard" });
  };

  const Execute_Share_Adiyah_Content = (Adiyah_Item: Adiyah_Record) => {
    Set_Target_Share_Adiyah_Record(Adiyah_Item);
  };

  const Extract_Complete_Transliteration_String = (Adiyah_Item: Adiyah_Record): string => {
    if (!Adiyah_Item.Word_By_Word_Collection || Adiyah_Item.Word_By_Word_Collection.length === 0) return "";
    return Adiyah_Item.Word_By_Word_Collection.map((Word_Item) => Word_Item.Transliteration_Text).filter(Boolean).join(" ");
  };

  const Render_Adiyah_Card = (Adiyah_Item: Adiyah_Record, Adiyah_Index_Position: number) => {
    const Has_Word_By_Word_Data = Boolean(
      Adiyah_Item.Word_By_Word_Collection && Adiyah_Item.Word_By_Word_Collection.length > 0
    );

    const Index_Badge_Element = (
      <Container className="!w-auto min-w-7 h-7 px-1 rounded-full flex items-center justify-center">
        {Adiyah_Item.In_Category_ID || Adiyah_Index_Position + 1}
      </Container>
    );

    const Complete_References_List = Adiyah_Item.Reference_Content_Text ? [Adiyah_Item.Reference_Content_Text] : [];
    const Has_Multiple_References_Flag = Complete_References_List.length > 1;

    const Reference_Pill_Element = (
      <Container className="!py-1 !px-3 inline-flex w-auto">
        <Reference_Link Reference_Content_Text={Adiyah_Item.Reference_Content_Text} />
      </Container>
    );

    const Reference_Dropdown_Element = (
      <Dropdown_Menu>
        <Dropdown_Menu_Trigger asChild>
          <Button size="sm" className="h-7 px-3 inline-flex items-center gap-1 text-xs">
            Reference
            <ChevronDown className="h-3 w-3" />
          </Button>
        </Dropdown_Menu_Trigger>
        <Dropdown_Menu_Content align="start" className="min-w-[220px]">
          {Complete_References_List.map((Reference_Item, Index_Key) => (
            <Dropdown_Menu_Item key={Index_Key} asChild className="text-xs">
              <div className="w-full">
                <Reference_Link Reference_Content_Text={Reference_Item} />
              </div>
            </Dropdown_Menu_Item>
          ))}
        </Dropdown_Menu_Content>
      </Dropdown_Menu>
    );

    const Card_Header_Element = (
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {Index_Badge_Element}
          {Has_Multiple_References_Flag ? Reference_Dropdown_Element : Reference_Pill_Element}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button size="sm" className="w-7 h-7 p-0" onClick={() => Execute_Copy_Adiyah_Content(Adiyah_Item)}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" className="w-7 h-7 p-0" onClick={() => Execute_Share_Adiyah_Content(Adiyah_Item)}>
            <Share2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );

    // Standard display if Kalimah-by-Kalimah data is absent
    if (!Has_Word_By_Word_Data) {
      return (
        <Container key={Adiyah_Item.ID || Adiyah_Index_Position} className="p-5 space-y-2 group">
          {Card_Header_Element}
          <p
            className="font-Arabic text-right leading-loose"
            dir="rtl"
            style={{ fontSize: Convert_Font_Size_To_Rem_Value(Dua_Arabic_Font_Size, 1.4) }}
          >
            {Adiyah_Item.Arabic_Content_Text}
          </p>
          {Show_Dua_Transliteration && (
            <p
              className="italic text-muted-foreground"
              style={{ fontSize: Convert_Font_Size_To_Rem_Value(Dua_Transliteration_Font_Size, 1.0) }}
            >
              {Extract_Complete_Transliteration_String(Adiyah_Item)}
            </p>
          )}
          {Show_Dua_Translation && (
            <p
              className="text-foreground"
              style={{ fontSize: Convert_Font_Size_To_Rem_Value(Dua_Translation_Font_Size, 1.0) }}
            >
              {Adiyah_Item.Translation_Content_Text}
            </p>
          )}
        </Container>
      );
    }

    const Arabic_Words_List = Adiyah_Item.Arabic_Content_Text.split(" ");
    const Word_By_Word_Collection_List = Adiyah_Item.Word_By_Word_Collection || [];
    const Should_Show_Inline_Content_Flag = Show_Dua_Inline_Translation || Show_Dua_Inline_Transliteration;

    const Generate_Tooltip_Content_Element = (
      Word_Translation_Text?: string,
      Word_Transliteration_Text?: string
    ) => (
      <div className="flex flex-col gap-1 p-1">
        {Show_Dua_Hover_Translation && Word_Translation_Text && (
          <span className="text-foreground">{Word_Translation_Text}</span>
        )}
        {Show_Dua_Hover_Transliteration && Word_Transliteration_Text && (
          <span className="text-muted-foreground text-sm">{Word_Transliteration_Text}</span>
        )}
      </div>
    );

    // INLINE ON: Column layout with Kalimah-by-Kalimah Translations / Transliterations
    if (Should_Show_Inline_Content_Flag) {
      return (
        <Container key={Adiyah_Item.ID || Adiyah_Index_Position} className="p-5 space-y-2 group">
          {Card_Header_Element}
          <div
            className="font-Arabic leading-loose"
            style={{ fontSize: Convert_Font_Size_To_Rem_Value(Dua_Arabic_Font_Size, 1.4) }}
          >
            <div className="flex flex-row-reverse flex-wrap justify-start items-start gap-x-3 gap-y-3">
              {Arabic_Words_List.map((Arabic_Word_String, Word_Index_Position) => {
                const Word_Data_Record = Word_By_Word_Collection_List[Word_Index_Position];
                const Word_Translation_Text = Word_Data_Record?.Translation_Text;
                const Word_Transliteration_Text = Word_Data_Record?.Transliteration_Text;
                const Should_Show_Inline_Translation_Flag = Show_Dua_Inline_Translation && Word_Translation_Text;
                const Should_Show_Inline_Transliteration_Flag =
                  Show_Dua_Inline_Transliteration && Word_Transliteration_Text;
                const Has_Inline_Content_Flag =
                  Should_Show_Inline_Translation_Flag || Should_Show_Inline_Transliteration_Flag;
                const Should_Show_Hover_Tooltip_Flag =
                  (Show_Dua_Hover_Translation && Word_Translation_Text) ||
                  (Show_Dua_Hover_Transliteration && Word_Transliteration_Text);

                return (
                  <div
                    key={Word_Index_Position}
                    className="flex flex-col items-center"
                    style={Has_Inline_Content_Flag ? { minWidth: "2rem" } : undefined}
                  >
                    {Should_Show_Hover_Tooltip_Flag ? (
                      <Tooltip
                        content={Generate_Tooltip_Content_Element(
                          Word_Translation_Text,
                          Word_Transliteration_Text
                        )}
                        enabled={true}
                        side="Top"
                        offset={80}
                      >
                        <span
                          className={`inline-block cursor-pointer transition-colors Duration-150 hover:text-emerald-600 ${
                            Active_Tooltip_State?.Adiyah_Index_Position === Adiyah_Index_Position &&
                            Active_Tooltip_State?.Word_Index_Position === Word_Index_Position
                              ? "text-emerald-600"
                              : ""
                          }`}
                          onMouseEnter={() =>
                            Set_Active_Tooltip_State({
                              Adiyah_Index_Position,
                              Word_Index_Position,
                            })
                          }
                          onMouseLeave={() => Set_Active_Tooltip_State(null)}
                        >
                          {Arabic_Word_String}{" "}
                        </span>
                      </Tooltip>
                    ) : (
                      <span className="inline-block">{Arabic_Word_String}{" "}</span>
                    )}
                    {Has_Inline_Content_Flag && (
                      <div className="flex flex-col items-center gap-y-0.5 mt-1 w-full">
                        {Should_Show_Inline_Translation_Flag && (
                          <span
                            className="text-black dark:text-white text-center leading-tight"
                            style={{ fontSize: Convert_Font_Size_To_Rem_Value(Dua_Inline_Translation_Font_Size, 0.9) }}
                          >
                            {Word_Translation_Text}
                          </span>
                        )}
                        {Should_Show_Inline_Transliteration_Flag && (
                          <span
                            className="text-gray-500 dark:text-gray-400 text-center leading-tight"
                            style={{
                              fontSize: Convert_Font_Size_To_Rem_Value(Dua_Inline_Transliteration_Font_Size, 0.8),
                            }}
                          >
                            {Word_Transliteration_Text}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {Show_Dua_Transliteration && (
            <p
              className="italic text-muted-foreground"
              style={{ fontSize: Convert_Font_Size_To_Rem_Value(Dua_Transliteration_Font_Size, 1.0) }}
            >
              {Extract_Complete_Transliteration_String(Adiyah_Item)}
            </p>
          )}
          {Show_Dua_Translation && (
            <p
              className="text-foreground"
              style={{ fontSize: Convert_Font_Size_To_Rem_Value(Dua_Translation_Font_Size, 1.0) }}
            >
              {Adiyah_Item.Translation_Content_Text}
            </p>
          )}
        </Container>
      );
    }

    // INLINE OFF: Standard Kalimah-by-Kalimah with tooltips
    return (
      <Container key={Adiyah_Item.ID || Adiyah_Index_Position} className="p-5 space-y-2 group">
        {Card_Header_Element}
        <div
          className="font-Arabic leading-loose"
          style={{ fontSize: Convert_Font_Size_To_Rem_Value(Dua_Arabic_Font_Size, 1.4) }}
        >
          <div className="flex flex-row-reverse flex-wrap justify-start items-start gap-x-3 gap-y-3">
            {Arabic_Words_List.map((Arabic_Word_String, Word_Index_Position) => {
              const Word_Data_Record = Word_By_Word_Collection_List[Word_Index_Position];
              const Word_Translation_Text = Word_Data_Record?.Translation_Text;
              const Word_Transliteration_Text = Word_Data_Record?.Transliteration_Text;
              const Should_Show_Hover_Tooltip_Flag =
                (Show_Dua_Hover_Translation && Word_Translation_Text) ||
                (Show_Dua_Hover_Transliteration && Word_Transliteration_Text);

              if (Should_Show_Hover_Tooltip_Flag) {
                return (
                  <Tooltip
                    key={Word_Index_Position}
                    content={Generate_Tooltip_Content_Element(
                      Word_Translation_Text,
                      Word_Transliteration_Text
                    )}
                    enabled={true}
                    side="Top"
                    offset={80}
                  >
                    <span
                      className="cursor-pointer transition-colors Duration-150 hover:text-emerald-600 inline-block"
                      onMouseEnter={() =>
                        Set_Active_Tooltip_State({
                          Adiyah_Index_Position,
                          Word_Index_Position,
                        })
                      }
                      onMouseLeave={() => Set_Active_Tooltip_State(null)}
                    >
                      {Arabic_Word_String}
                    </span>
                  </Tooltip>
                );
              }
              return (
                <span key={Word_Index_Position} className="inline-block">
                  {Arabic_Word_String}
                </span>
              );
            })}
          </div>
        </div>
        {Show_Dua_Transliteration && (
          <p
            className="italic text-muted-foreground"
            style={{ fontSize: Convert_Font_Size_To_Rem_Value(Dua_Transliteration_Font_Size, 1.0) }}
          >
            {Extract_Complete_Transliteration_String(Adiyah_Item)}
          </p>
        )}
        {Show_Dua_Translation && (
          <p
            className="text-foreground"
            style={{ fontSize: Convert_Font_Size_To_Rem_Value(Dua_Translation_Font_Size, 1.0) }}
          >
            {Adiyah_Item.Translation_Content_Text}
          </p>
        )}
      </Container>
    );
  };

  const Adiyah_Collection_List: Adiyah_Record[] = Category_Data_Payload.Adiyah_Collection || [];

  return (
    <Layout>
      <section>
        <div className="mx-auto max-w-3xl">
          <div className="space-y-5">
            {Adiyah_Collection_List.map((Adiyah_Item, Adiyah_Index_Position) =>
              Render_Adiyah_Card(Adiyah_Item, Adiyah_Index_Position)
            )}
          </div>
        </div>
      </section>
      <Share_Dialog
        Open={!!Target_Share_Adiyah_Record}
        On_Open_Change={(Is_Open_Flag) => !Is_Open_Flag && Set_Target_Share_Adiyah_Record(null)}
        Surah_ID={0}
        Ayah_ID={0}
        Ayah_Text={Target_Share_Adiyah_Record?.Arabic_Content_Text}
        Translation={Target_Share_Adiyah_Record?.Translation_Content_Text}
      />
    </Layout>
  );
};

export default Dua_Category;