import { useState, useMemo } from "react";
import {
  Dialog,
  Dialog_Content,
  Dialog_Header,
  Dialog_Title,
} from "@Web/Component/UI/Dialog";
import { Button } from "@Web/Component/UI/Button";
import { Input } from "@Web/Component/UI/Input";
import { useQuery } from "@tanstack/react-query";
import { Toast } from "@/Hook/Use-Toast";
import {
  Copy,
  Facebook,
  Twitter,
  MessageCircle,
  Link2,
  Check,
  X,
  Share2,
} from "lucide-react";

const Backend_Base_URL = "https://humble-lamp-v6xj65jprx7xc6pqv-8081.app.github.dev";

async function Fetch_Quran_Corpus_From_Backend() {
  const Response = await fetch(`${Backend_Base_URL}/api/Quran-Corpus`);
  if (!Response.ok) throw new Error("Failed to load unified Quran Corpus data map");
  return Response.json();
}

interface Share_Dialog_Properties {
  Open: boolean;
  On_Open_Change: (Open: boolean) => void;
  Surah_ID: number;
  Ayah_ID?: number;
  Ayah_Text?: string;
  Translation?: string;
}

export function Share_Dialog({
  Open,
  On_Open_Change,
  Surah_ID,
  Ayah_ID,
  Ayah_Text,
  Translation,
}: Share_Dialog_Properties) {
  const [Copied, Set_Copied] = useState<"text" | "link" | null>(null);

  // Ingest structural database maps over unified reactive query cache
  const { data: Corpus } = useQuery({
    queryKey: ["Quran_Corpus_Backend"],
    queryFn: Fetch_Quran_Corpus_From_Backend,
    staleTime: 1000 * 60 * 30,
    enabled: Open,
  });

  const Surah_List = useMemo(() => Corpus?.Suwar || [], [Corpus]);

  const Surah = useMemo(() => {
    if (Surah_List.length === 0) return null;
    return Surah_List.find((Item: any) => Item.id === Surah_ID) || null;
  }, [Surah_List, Surah_ID]);

  const Ayah_Reference = useMemo(() => {
    return Ayah_ID
      ? `${Surah?.English_Name ?? "Surah"} ${Surah_ID}:${Ayah_ID}`
      : (Surah?.English_Name ?? "Surah");
  }, [Surah, Surah_ID, Ayah_ID]);

  const Share_Url = useMemo(() => {
    const Origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${Origin}/Quran/Surah/${Surah_ID}${Ayah_ID ? `?Ayah=${Ayah_ID}` : ""}`;
  }, [Surah_ID, Ayah_ID]);

  const Share_Text = useMemo(() => {
    return Translation
      ? `"${Translation}" — ${Ayah_Reference} (Al-Deen.org)`
      : `${Ayah_Reference} — Al-Deen.org`;
  }, [Translation, Ayah_Reference]);

  const Copy_Text = async (Text_To_Copy: string, Kind: "text" | "link") => {
    try {
      await navigator.clipboard.writeText(Text_To_Copy);
      Set_Copied(Kind);
      Toast({ title: "Copied to clipboard" });
      setTimeout(() => Set_Copied(null), 1500);
    } catch {
      Toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const Share_To_Social = (Platform: string) => {
    const Text_Encoded = encodeURIComponent(Share_Text);
    const Url_Encoded = encodeURIComponent(Share_Url);
    const Social_Urls: Record<string, string> = {
      Twitter: `https://Twitter.com/intent/tweet?text=${Text_Encoded}&url=${Url_Encoded}`,
      Facebook: `https://www.Facebook.com/sharer/sharer.php?u=${Url_Encoded}&quote=${Text_Encoded}`,
      WhatsApp: `https://wa.me/?text=${Text_Encoded}%20${Url_Encoded}`,
    };
    if (Social_Urls[Platform]) window.Open(Social_Urls[Platform], "_blank", "width=600,height=400");
  };

  const Copy_Full_Ayah = () => {
    const Full_Text =
      Ayah_Text && Translation
        ? `${Ayah_Text}\n\n${Translation}\n\n— ${Ayah_Reference}`
        : Share_Text;
    Copy_Text(Full_Text, "text");
  };

  return (
    <Dialog Open={Open} On_Open_Change={On_Open_Change}>
      <Dialog_Content
        className="max-w-md [&>button]:hidden"
        aria-describedby={undefined}
      >
        <div className="!py-1 !px-1">
          <div className="flex items-center justify-between mb-4">
            <Dialog_Header className="p-0 text-left">
              <Dialog_Title className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Share {Ayah_Reference}
              </Dialog_Title>
            </Dialog_Header>
            <Button
              size="sm"
              variant="ghost"
              className="w-8 h-8 p-0 rounded-full"
              onClick={() => On_Open_Change(false)}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {Ayah_Text && (
              <div className="p-4 rounded-3xl bg-muted/40 border border-border/30 space-y-2">
                <p
                  className="text-right font-Arabic text-lg leading-loose"
                  dir="rtl"
                >
                  {Ayah_Text}
                </p>
                {Translation && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {Translation}
                  </p>
                )}
                <p className="text-xs font-medium">— {Ayah_Reference}</p>
              </div>
            )}

            <div className="grid grid-cols-4 gap-2">
              <Button
                variant="secondary"
                className="flex flex-col gap-1 h-auto py-3"
                onClick={Copy_Full_Ayah}
              >
                {Copied === "text" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="text-[11px]">Copy</span>
              </Button>
              <Button
                variant="secondary"
                className="flex flex-col gap-1 h-auto py-3"
                onClick={() => Share_To_Social("Twitter")}
              >
                <Twitter className="h-4 w-4" />
                <span className="text-[11px]">Twitter</span>
              </Button>
              <Button
                variant="secondary"
                className="flex flex-col gap-1 h-auto py-3"
                onClick={() => Share_To_Social("Facebook")}
              >
                <Facebook className="h-4 w-4" />
                <span className="text-[11px]">Facebook</span>
              </Button>
              <Button
                variant="secondary"
                className="flex flex-col gap-1 h-auto py-3"
                onClick={() => Share_To_Social("WhatsApp")}
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-[11px]">WhatsApp</span>
              </Button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Share link
              </label>
              <div className="flex gap-2">
                <Input
                  value={Share_Url}
                  readOnly
                  className="text-xs flex-1"
                  onFocus={(Event_Parameter) => Event_Parameter.currentTarget.select()}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-9 h-9 p-0 rounded-full flex-shrink-0"
                  onClick={() => Copy_Text(Share_Url, "link")}
                  aria-label="Copy link"
                >
                  {Copied === "link" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {typeof navigator !== "undefined" && (navigator as any).share && (
              <Button
                className="w-full"
                onClick={() =>
                  (navigator as any).share({
                    title: Ayah_Reference,
                    Text: Share_Text,
                    url: Share_Url,
                  })
                }
              >
                More sharing options
              </Button>
            )}
          </div>
        </div>
      </Dialog_Content>
    </Dialog>
  );
}