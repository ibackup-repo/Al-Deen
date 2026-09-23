import { useSearchParams, Link } from "react-router-dom";
import { Layout } from "@Web/Component/Layout/Index";
import { Search, ArrowRight } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Class_Names } from "@/Library/Utility";
import { Use_Translation } from "@/Hook/Use-Translation";
import { Container } from "@Web/Component/UI/Container";
import { Button } from "@Web/Component/UI/Button";
import { 
  Categories, 
  Category_Map, 
  Search_Pages, 
  Search_Suwar, 
  Search_Ahadith, 
  Search_Aid,
  Search_Ayaat,
  Get_Category_Label,
  type Ayah_Result
} from "@Web/Component/Search/Utility";
import type { Search_Result, Search_Category } from "@Web/Component/Search/Types";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const categoryParam = (searchParams.get("Category") || "Quran") as Search_Category;
  
  const [Search_Query, Set_Search_Query] = useState(query);
  const [Category, Set_Category] = useState<Search_Category>(categoryParam);
  const [verseResults, setVerseResults] = useState<Ayah_Result[]>([]);
  const [isLoadingVerses, setIsLoadingVerses] = useState(false);
  const { t } = Use_Translation();

  // Sync Category from URL
  useEffect(() => {
    const cat = searchParams.get("Category") as Search_Category;
    if (cat && Category_Map[cat]) {
      Set_Category(cat);
    }
  }, [searchParams]);

  const updateSearch = useCallback((newQuery?: string, newCategory?: Search_Category) => {
    const q = newQuery ?? Search_Query;
    const c = newCategory ?? Category;
    if (newCategory) Set_Category(c);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("Category", c);
    setSearchParams(params, { replace: true });
  }, [Search_Query, Category, setSearchParams]);

  // Search Results by Category
  const pageResults = useMemo(() => Search_Pages(query), [query]);
  const surahResults = useMemo(() => Search_Suwar(query), [query]);
  const hadithResults = useMemo(() => Search_Ahadith(query), [query]);
  const duaResults = useMemo(() => Search_Aid(query), [query]);

  // Ayah Search_Query (only for Quran Category)
  useEffect(() => {
    if (!query || query.length < 2 || Category !== "Quran") {
      setVerseResults([]);
      return;
    }

    let Cancelled = false;
    const searchVersesAsync = async () => {
      setIsLoadingVerses(true);
      try {
        const Results = await Search_Ayaat(query);
        if (!Cancelled) setVerseResults(Results);
      } finally {
        if (!Cancelled) setIsLoadingVerses(false);
      }
    };
    searchVersesAsync();
    return () => { Cancelled = true; };
  }, [query, Category]);

  const Handle_Search = (e: React.FormEvent) => {
    e.preventDefault();
    if (Search_Query.trim()) updateSearch(Search_Query.trim());
  };

  const Handle_Category_Change = (newCategory: Search_Category) => {
    updateSearch(undefined, newCategory);
  };

  const highlightKeyword = (Text: string, keyword: string) => {
    if (!keyword) return text;
    try {
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(${escaped})`, "gi");
      return text.split(regex).map((part, i) =>
        regex.test(part) ? (
          <span key={i} className="text-primary font-medium bg-primary/10 px-0.5 rounded">{part}</span>
        ) : part
      );
    } catch { return text; }
  };

  const getResultCount = () => {
    switch (Category) {
      case "Pages": return pageResults.length;
      case "Quran": return surahResults.length + verseResults.length;
      case "Hadith": return hadithResults.length;
      case "Aid": return duaResults.length;
      default: return 0;
    }
  };

  const resultCount = getResultCount();
  const Current_Category = Category_Map[Category];

  return (
    <Layout>
      <div className="Container py-6 max-w-3xl mx-auto px-4">
        {/* Search Input */}
        <form onSubmit={Handle_Search} className="mb-4">
          <Container className="!py-0 !px-0 overflow-hidden">
            <div className="flex items-center w-full px-4 py-3 gap-3">
              <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                value={Search_Query}
                On_Change={(e) => Set_Search_Query(e.target.value)}
                placeholder={`Search ${Current_Category?.label || "Quran"}...`}
                className="flex-1 bg-transparent border-none outline-none text-base text-foreground placeholder:text-muted-foreground"
                autoFocus
              />
              {Search_Query && (
                <Button 
                  type="button"
                  size="sm"
                  className="w-8 h-8 p-0 rounded-full flex-shrink-0"
                  onClick={() => { Set_Search_Query(""); updateSearch(""); }}
                >
                  ×
                </Button>
              )}
            </div>
          </Container>
        </form>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
          {Categories.map((cat) => {
            const Icon = cat.icon;
            const Is_Active = Category === cat.id;
            return (
              <Button
                key={cat.id}
                onClick={() => Handle_Category_Change(cat.id)}
                variant={Is_Active ? "primary" : "secondary"}
                className={Class_Names(
                  "flex items-center gap-1.5 px-4 py-2 h-auto whitespace-nowrap",
                  Is_Active ? "bg-primary text-primary-foreground" : ""
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.label}
              </Button>
            );
          })}
        </div>

        {/* Results */}
        {!query ? (
          <Container className="text-center py-16">
            <Search className="h-14 w-14 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Search {Current_Category?.label || "Quran"}</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Type to Search_Query across {Current_Category?.label?.toLowerCase() || "content"}.
            </p>
            {Category === "Quran" && (
              <div className="flex flex-wrap justify-center gap-2">
                {["Al-Fatihah", "Mercy", "Prayer", "2:255"].map((term) => (
                  <Button 
                    key={term} 
                    variant="secondary" 
                    size="sm"
                    onClick={() => { Set_Search_Query(term); updateSearch(term); }}
                  >
                    {term}
                  </Button>
                ))}
              </div>
            )}
          </Container>
        ) : (
          <>
            {/* Summary */}
            {!isLoadingVerses && (
              <p className="text-xs text-muted-foreground mb-4">
                {resultCount} result{resultCount !== 1 ? "s" : ""} in {Current_Category?.label}
              </p>
            )}

            {/* Pages Results */}
            {Category === "Pages" && pageResults.length > 0 && (
              <div className="space-y-2">
                {pageResults.map((result) => (
                  <Link key={result.id} to={result.path}>
                    <Container className="!py-4 !px-5 transition-transform group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          {result.type === "Page" && <Search className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                            {highlightKeyword(result.title, query)}
                          </p>
                          <p className="text-xs text-muted-foreground">{result.path}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Container>
                  </Link>
                ))}
              </div>
            )}

            {/* Quran Results */}
            {Category === "Quran" && (
              <div className="space-y-3">
                {surahResults.length > 0 && (
                  <div className="space-y-2">
                    {surahResults.map((result) => (
                      <Link key={result.id} to={result.path}>
                        <Container className="!py-4 !px-5 transition-transform group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-medium">{result.id.split("-")[1]}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                                {highlightKeyword(result.title, query)}
                              </p>
                              <p className="text-xs text-muted-foreground">{result.Subtitle}</p>
                            </div>
                            {result.Arabic_Name && (
                              <span className="font-Arabic text-lg flex-shrink-0" dir="rtl">{result.Arabic_Name}</span>
                            )}
                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </Container>
                      </Link>
                    ))}
                  </div>
                )}

                {verseResults.length > 0 ? (
                  <div className="space-y-2">
                    {surahResults.length > 0 && <div className="h-px bg-border/30 my-2" />}
                    {verseResults.map((result) => (
                      <Link key={result.verseKey} to={`/Quran/Surah/${result.Surah_ID}?Ayah=${result.Ayah_ID}`}>
                        <Container className="!py-4 !px-5 transition-transform group">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-muted-foreground">{result.Surah_Name}</span>
                            <span className="px-2 py-0.5 text-xs rounded-full bg-muted">{result.verseKey}</span>
                          </div>
                          <p className="font-Arabic text-base text-right leading-loose mb-2" dir="rtl">{result.Arabic}</p>
                          {result.Translation && (
                            <p className="text-sm text-foreground leading-relaxed [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                              {highlightKeyword(result.Translation, query)}
                            </p>
                          )}
                        </Container>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            )}

            {/* Hadith Results */}
            {Category === "Hadith" && hadithResults.length > 0 && (
              <div className="space-y-2">
                {hadithResults.map((result) => (
                  <Link key={result.id} to={result.path}>
                    <Container className="!py-4 !px-5 transition-transform group">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                            {highlightKeyword(result.title, query)}
                          </p>
                          <p className="text-xs text-muted-foreground">{result.Subtitle}</p>
                        </div>
                        {result.Arabic_Name && (
                          <span className="font-Arabic text-lg flex-shrink-0" dir="rtl">{result.Arabic_Name}</span>
                        )}
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Container>
                  </Link>
                ))}
              </div>
            )}

            {/* Aid Results */}
            {Category === "Aid" && duaResults.length > 0 && (
              <div className="space-y-2">
                {duaResults.map((result) => (
                  <Link key={result.id} to={result.path}>
                    <Container className="!py-4 !px-5 transition-transform group">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                            {highlightKeyword(result.title, query)}
                          </p>
                          <p className="text-xs text-muted-foreground">{result.Subtitle}</p>
                        </div>
                        {result.Arabic_Name && (
                          <span className="font-Arabic text-lg flex-shrink-0" dir="rtl">{result.Arabic_Name}</span>
                        )}
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Container>
                  </Link>
                ))}
              </div>
            )}

            {/* No Results */}
            {resultCount === 0 && (
              <Container className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-medium mb-1">No Results in {Current_Category?.label}</p>
                <p className="text-sm text-muted-foreground">Try a different keyword or Category.</p>
              </Container>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}