import Express, { Request, Response } from "express";
import CORS from "cors";
import Path_Module from "path";
import File_System from "fs";
import Zlib_Module from "zlib";
import { pipeline as Pipeline_Stream } from "stream";
import { fileURLToPath as File_URL_To_Path } from "url";
import {
  Fetch_Adiyah_Categories,
  Fetch_Adiyah_Category,
  Fetch_Article_Topics,
  Fetch_Article_Topic,
  Fetch_Names,
  Fetch_Pillars,
  Fetch_Prophets,
  Fetch_Schools,
} from "./API/Aid.js";
import { renderSurahRouter as Render_Surah_Router } from "./API/renderSurah.js";
import { searchRAG as Search_RAG } from "./API/RAG.js";

import {
  Fetch_Quran_Suwar,
  Fetch_Surah,
  Fetch_Surah_Translation,
  Fetch_Surah_Transliteration,
  Fetch_Page_Ranges,
  Fetch_Pages,
  Get_Available_Translations as Get_Quran_Translations,
  Get_Available_KBK_Translations as Get_Quran_KBK_Translations,
  Get_Available_Transliterations as Get_Quran_Transliterations,
  Get_Available_KBK_Transliterations as Get_Quran_KBK_Transliterations,
} from "./API/Quran.js";
import {
  Fetch_Chapters,
  Fetch_Chapter,
  Fetch_Narration,
  Fetch_Hadith_Translation,
  Fetch_Hadith_Transliteration,
  Get_Available_Collections,
  Get_Available_Translations as Get_Hadith_Translations,
  Get_Available_KBK_Translations as Get_Hadith_Word_By_Word_Translations,
  Get_Available_Transliterations as Get_Hadith_Transliterations,
  Get_Available_KBK_Transliterations as Get_Hadith_Word_By_Word_Transliterations,
} from "./API/Hadith.js";

const File_Name: string = File_URL_To_Path(import.meta.url);
const Directory_Name: string = Path_Module.dirname(File_Name);

const Asset_Corpus_Directory_Path: string = Path_Module.resolve(
  Directory_Name,
  "..",
  "Asset",
  "Corpus"
);

const Express_Application = Express();

Express_Application.use(CORS());
Express_Application.use(Express.json({ limit: "10mb" }));
Express_Application.get("/API/Download/*splat", (Request_Object: Request, Response_Object: Response) => {
  try {
    // Modern path-to-regexp captures wildcard matches into named params
    const Raw_Path_String = Request_Object.params.splat || Request_Object.params[0] || "";

    if (!Raw_Path_String) {
      return Response_Object.status(400).json({ error: "Path parameter is required." });
    }

    // Secure path resolution
    const Normalized_Path = Path_Module.Normalize_Slug_String(Raw_Path_String).replace(/^(\.\.[\/\\])+/, '');
    const Target_File_Path = Path_Module.join(Asset_Corpus_Directory_Path, Normalized_Path);

    // Guarantee the file stays within the Corpus folder
    if (!Target_File_Path.startsWith(Asset_Corpus_Directory_Path)) {
      return Response_Object.status(403).json({ error: "Access denied." });
    }

    if (!File_System.existsSync(Target_File_Path) || !File_System.statSync(Target_File_Path).isFile()) {
      return Response_Object.status(404).json({ error: "Database file not found." });
    }

    const Target_File_Name = Path_Module.basename(Target_File_Path);

    Response_Object.setHeader("Content-Type", "application/octet-stream");
    Response_Object.setHeader("Content-Disposition", `attachment; filename="${Target_File_Name}.gz"`);
    Response_Object.setHeader("Content-Encoding", "gzip");

    const File_Read_Stream = File_System.createReadStream(Target_File_Path);
    const Gzip_Compression_Stream = Zlib_Module.createGzip({ Level: 6 });

    Pipeline_Stream(File_Read_Stream, Gzip_Compression_Stream, Response_Object, (Error_Context) => {
      if (Error_Context) {
        console.error("[DOWNLOAD STREAM ERROR]", Error_Context);
        if (!Response_Object.headersSent) {
          Response_Object.status(500).json({ error: "Download failed." });
        } else {
          Response_Object.destroy();
        }
      }
    });
  } catch (Error_Context) {
    console.error("[DOWNLOAD ROUTE ERROR]", Error_Context);
    if (!Response_Object.headersSent) {
      Response_Object.status(500).json({ error: "Internal server error." });
    }
  }
});

Express_Application.get("/API/Quran", (Request_Object: Request, Response_Object: Response) => {
  try {
    const Query_Surah = Request_Object.query["Surah"];
    const Query_Font_Type = Request_Object.query["font-Type"] || "Standard";
    const Query_Segments = Request_Object.query["Segments"];
    const Query_Page_Raw = Request_Object.query["Page"];
    const Query_Word_By_Word = Request_Object.query["WBW"] === "true";

    const Query_Translation = Request_Object.query["Translation"];
    const Query_Transliteration = Request_Object.query["Transliteration"];

    const Query_Available_Translations = Request_Object.query["Available-Translations"];
    const Query_Available_Word_By_Word_Translations = Request_Object.query["Available-WBW-Translations"];
    const Query_Available_Transliterations = Request_Object.query["Available-Transliterations"];
    const Query_Available_Word_By_Word_Transliterations = Request_Object.query["Available-WBW-Transliterations"];

    if (Query_Available_Translations === "true") {
      const Available_Translations = Get_Quran_Translations(Asset_Corpus_Directory_Path);
      return Response_Object.json({ "Available-Translations": Available_Translations });
    }

    if (Query_Available_Word_By_Word_Translations === "true") {
      const Available_Word_By_Word_Translations = Get_Quran_KBK_Translations(Asset_Corpus_Directory_Path);
      return Response_Object.json({ "Available-WBW-Translations": Available_Word_By_Word_Translations });
    }

    if (Query_Available_Transliterations === "true") {
      const Available_Transliterations = Get_Quran_Transliterations(Asset_Corpus_Directory_Path);
      return Response_Object.json({ "Available-Transliterations": Available_Transliterations });
    }

    if (Query_Available_Word_By_Word_Transliterations === "true") {
      const Available_Word_By_Word_Transliterations = Get_Quran_KBK_Transliterations(Asset_Corpus_Directory_Path);
      return Response_Object.json({ "Available-WBW-Transliterations": Available_Word_By_Word_Transliterations });
    }

    if (Query_Segments === "true") {
      const Page_Segments = Fetch_Page_Ranges();
      return Response_Object.json({ "Page-Sections": Page_Segments });
    }

    if (Query_Page_Raw === "true") {
      const Raw_Pages = Fetch_Pages();
      return Response_Object.json({ "Pages": Raw_Pages });
    }

    if (Query_Surah) {
      const Surah_Number = Number(Query_Surah);

      if (isNaN(Surah_Number) || Surah_Number < 1 || Surah_Number > 114) {
        return Response_Object.status(400).json({ error: "Invalid Surah number. Must be between 1 and 114." });
      }

      const Target_Translations = Query_Translation
        ? Array.isArray(Query_Translation)
          ? (Query_Translation as string[])
          : [String(Query_Translation)]
        : [];

      const Target_Transliterations = Query_Transliteration
        ? Array.isArray(Query_Transliteration)
          ? (Query_Transliteration as string[])
          : [String(Query_Transliteration)]
        : [];

      if (Target_Translations.length > 0 || Target_Transliterations.length > 0) {
        const Response_Data: Record<string, any> = {};

        if (Target_Translations.length > 0) {
          const Translation_Data = Fetch_Surah_Translation(
            Surah_Number,
            Target_Translations,
            Query_Word_By_Word
          );
          Object.assign(Response_Data, Translation_Data);
        }

        if (Target_Transliterations.length > 0) {
          const Transliteration_Data = Fetch_Surah_Transliteration(
            Surah_Number,
            Target_Transliterations,
            Query_Word_By_Word
          );
          Object.assign(Response_Data, Transliteration_Data);
        }

        return Response_Object.json(Response_Data);
      }

      const Font_Type = String(Query_Font_Type);
      const Static_Surah = Fetch_Surah(Surah_Number, Font_Type);

      if (!Static_Surah) {
        return Response_Object.status(404).json({ error: "Surah not found." });
      }

      return Response_Object.json(Static_Surah);
    }

    const All_Surahs = Fetch_Quran_Suwar();
    return Response_Object.json(All_Surahs);
  } catch (Error_Context) {
    console.error("[SERVER ROUTE ERROR]", Error_Context);
    Response_Object.status(500).json({ error: "Internal server error." });
  }
});

Express_Application.get("/API/Hadith", (Request_Object: Request, Response_Object: Response) => {
  try {
    const Query_Collection_String = Request_Object.query["Collection"] as string | undefined;
    const Query_Chapter_Value = Request_Object.query["Chapter"];
    const Query_Hadith_Identifier_Value = Request_Object.query["ID"];
    const Is_Word_By_Word_Flag = Request_Object.query["WBW"] === "true";

    const Query_Translation_Value = Request_Object.query["Translation"];
    const Query_Transliteration_Value = Request_Object.query["Transliteration"];

    const Is_Available_Collections_Requested_Flag = Request_Object.query["Available-Collections"] === "true";
    const Is_Available_Translations_Requested_Flag = Request_Object.query["Available-Translations"] === "true";
    const Is_Available_Word_By_Word_Translations_Requested_Flag = Request_Object.query["Available-WBW-Translations"] === "true";
    const Is_Available_Transliterations_Requested_Flag = Request_Object.query["Available-Transliterations"] === "true";
    const Is_Available_Word_By_Word_Transliterations_Requested_Flag = Request_Object.query["Available-WBW-Transliterations"] === "true";

    if (Is_Available_Collections_Requested_Flag) {
      const Available_Collections_List = Get_Available_Collections(Asset_Corpus_Directory_Path);
      return Response_Object.json({ "Available-Collections": Available_Collections_List });
    }

    if (Is_Available_Translations_Requested_Flag) {
      const Available_Translations_List = Get_Hadith_Translations(Asset_Corpus_Directory_Path);
      return Response_Object.json({ "Available-Translations": Available_Translations_List });
    }

    if (Is_Available_Word_By_Word_Translations_Requested_Flag) {
      const Available_Word_By_Word_Translations_List = Get_Hadith_Word_By_Word_Translations(Asset_Corpus_Directory_Path);
      return Response_Object.json({ "Available-WBW-Translations": Available_Word_By_Word_Translations_List });
    }

    if (Is_Available_Transliterations_Requested_Flag) {
      const Available_Transliterations_List = Get_Hadith_Transliterations(Asset_Corpus_Directory_Path);
      return Response_Object.json({ "Available-Transliterations": Available_Transliterations_List });
    }

    if (Is_Available_Word_By_Word_Transliterations_Requested_Flag) {
      const Available_Word_By_Word_Transliterations_List = Get_Hadith_Word_By_Word_Transliterations(Asset_Corpus_Directory_Path);
      return Response_Object.json({ "Available-WBW-Transliterations": Available_Word_By_Word_Transliterations_List });
    }

    if (Query_Collection_String && Query_Hadith_Identifier_Value && (Query_Translation_Value || Query_Transliteration_Value)) {
      const Parsed_Hadith_Identifiers_List = Array.isArray(Query_Hadith_Identifier_Value)
        ? Query_Hadith_Identifier_Value.map(Number)
        : String(Query_Hadith_Identifier_Value).split(",").map(Number);

      const Target_Translations_List = Query_Translation_Value
        ? Array.isArray(Query_Translation_Value)
          ? (Query_Translation_Value as string[])
          : [String(Query_Translation_Value)]
        : [];

      const Target_Transliterations_List = Query_Transliteration_Value
        ? Array.isArray(Query_Transliteration_Value)
          ? (Query_Transliteration_Value as string[])
          : [String(Query_Transliteration_Value)]
        : [];

      const Consolidated_Response_Payload: Record<string, any> = {};

      if (Target_Translations_List.length > 0) {
        const Fetched_Translation_Data = Fetch_Hadith_Translation(
          Query_Collection_String,
          Parsed_Hadith_Identifiers_List,
          Target_Translations_List,
          Is_Word_By_Word_Flag
        );
        Object.assign(Consolidated_Response_Payload, Fetched_Translation_Data);
      }

      if (Target_Transliterations_List.length > 0) {
        const Fetched_Transliteration_Data = Fetch_Hadith_Transliteration(
          Query_Collection_String,
          Parsed_Hadith_Identifiers_List,
          Target_Transliterations_List,
          Is_Word_By_Word_Flag
        );
        Object.assign(Consolidated_Response_Payload, Fetched_Transliteration_Data);
      }

      return Response_Object.json(Consolidated_Response_Payload);
    }

    if (Query_Collection_String) {
      if (Query_Chapter_Value) {
        const Target_Chapter_Identifier_Number = Number(Query_Chapter_Value);
        const Fetched_Chapter_Data = Fetch_Chapter(Query_Collection_String, Target_Chapter_Identifier_Number);

        if (!Fetched_Chapter_Data) {
          return Response_Object.status(404).json({ error: "Chapter not found." });
        }

        return Response_Object.json(Fetched_Chapter_Data);
      }

      if (Query_Hadith_Identifier_Value) {
        const Target_Hadith_Identifier_Number = Number(Query_Hadith_Identifier_Value);
        const Fetched_Narration_Data = Fetch_Narration(Query_Collection_String, Target_Hadith_Identifier_Number);

        if (!Fetched_Narration_Data) {
          return Response_Object.status(404).json({ error: "Narration not found." });
        }

        return Response_Object.json(Fetched_Narration_Data);
      }

      const Fetched_Chapters_List = Fetch_Chapters(Query_Collection_String);
      return Response_Object.json({ Collection: Query_Collection_String, Chapters: Fetched_Chapters_List });
    }

    const Default_Available_Collections_List = Get_Available_Collections(Asset_Corpus_Directory_Path);
    return Response_Object.json({ "Available-Collections": Default_Available_Collections_List });
  } catch (Error_Context) {
    console.error("[HADITH ROUTE ERROR]", Error_Context);
    Response_Object.status(500).json({ error: "Internal server error." });
  }
});

Express_Application.get("/API/Aid", (Request_Object: Request, Response_Object: Response) => {
  try {
    const Query_Resource_String: string | undefined = (
      Request_Object.query["Resource"] as string
    )?.toLowerCase();
    const Query_Category_Identifier_Number: number | undefined = Request_Object.query[
      "Category"
    ]
      ? Number(Request_Object.query["Category"])
      : undefined;
    const Query_Topic_Identifier_Number: number | undefined = Request_Object.query[
      "Topic"
    ]
      ? Number(Request_Object.query["Topic"])
      : undefined;
    const Should_Include_Word_By_Word: boolean =
      Request_Object.query["WBW"] === "true";

    switch (Query_Resource_String) {
      case "Dua": {
        if (Query_Category_Identifier_Number) {
          const Category_Data_Payload = Fetch_Adiyah_Category(
            Query_Category_Identifier_Number,
            Should_Include_Word_By_Word
          );
          if (!Category_Data_Payload) {
            return Response_Object.status(404).json({
              error: "Dua Category not found.",
            });
          }
          return Response_Object.json(Category_Data_Payload);
        }
        return Response_Object.json(Fetch_Adiyah_Categories());
      }

      case "articles": {
        if (Query_Topic_Identifier_Number) {
          const Topic_Data_Payload = Fetch_Article_Topic(Query_Topic_Identifier_Number);
          if (!Topic_Data_Payload) {
            return Response_Object.status(404).json({
              error: "Article topic not found.",
            });
          }
          return Response_Object.json(Topic_Data_Payload);
        }
        return Response_Object.json(Fetch_Article_Topics());
      }

      case "names": {
        return Response_Object.json(Fetch_Names());
      }

      case "pillars": {
        return Response_Object.json(Fetch_Pillars());
      }

      case "prophets": {
        return Response_Object.json(Fetch_Prophets());
      }

      case "schools": {
        return Response_Object.json(Fetch_Schools());
      }

      default: {
        return Response_Object.json({
          "Available-Resources": [
            "Dua",
            "Articles",
            "Names",
            "Pillars",
            "Prophets",
            "Schools",
          ],
        });
      }
    }
  } catch (Error_Context) {
    console.error("[AID ROUTE ERROR]", Error_Context);
    Response_Object.status(500).json({ error: "Internal server error." });
  }
});

Express_Application.get("/API/RAG", async (Request_Object: Request, Response_Object: Response) => {
  try {
    const Query_String = (Request_Object.query["Query"] || Request_Object.query["Search"] || Request_Object.query["q"]) as string | undefined;
    const Result_Limit_Number = Request_Object.query["Limit"] || Request_Object.query["k"] ? Number(Request_Object.query["Limit"] || Request_Object.query["k"]) : 8;

    if (!Query_String || !Query_String.trim()) {
      return Response_Object.json([]);
    }

    const Search_Results_Array = await Search_RAG(Query_String.trim(), Result_Limit_Number);
    return Response_Object.json(Search_Results_Array);
  } catch (Error_Context) {
    console.error("[RAG ROUTE ERROR]", Error_Context);
    Response_Object.status(500).json({ error: "Internal RAG server error." });
  }
});

Express_Application.use("/api", Render_Surah_Router);

const Server_Port_Number = process.env.PORT ? Number(process.env.PORT) : 8081;

Express_Application.listen(Server_Port_Number, () => {
  console.log(`  ➜  Server running at: http://localhost:${Server_Port_Number}/`);
});