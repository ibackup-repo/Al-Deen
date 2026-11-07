// @Web/App.tsx

// 1. UI Components (Relative Paths)
import { Toaster } from "./Component/UI/Toaster";
import { Toaster as Sonner } from "./Component/UI/Sonner";
import { Tooltip_Provider } from "./Component/UI/Tooltip";

// 2. Third-Party Libraries
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";

// 3. Context Providers (Relative Paths)
import { App_Provider } from "./Context/App";
import { Audio_Provider } from "./Context/Audio";
import { Auth_Provider } from "./Context/Auth";
import { Admin_Provider } from "./Context/Admin";
import { NavigationProvider, GlobalNavOverlay } from "./Context/Navigation";
import { Page_Transition_Provider } from "./Component/UI/Page_Transition/Provider";

// 4. General Components & Layout (Relative Paths)
import { ErrorBoundary } from "./Component/Error-Boundary";
import { Visit_Tracker } from "./Component/Admin/Visit-Tracker";
import { Layout } from "./Component/Layout/Index";
import Root from "./Page/Root";

// 5. Pages - Quran (Relative Paths)
import Quran        from "./Page/Quran/Index";
import Surah        from "./Page/Quran/Surah/Index";
import JuzIndex     from "./Page/Quran/Juz";
import HizbIndex    from "./Page/Quran/Hizb";
import Ayah         from "./Page/Quran/Surah/Ayah/Index";
import Kalima       from "./Page/Quran/Surah/Ayah/Kalima/Index";
import Kalimah      from "./Page/Quran/Surah/Ayah/Kalima/Index";
import QuranGoals   from "./Page/Quran/Goal";
import QuranPage    from "./Page/Quran/Safhah";

// 6. Pages - Hadith (Relative Paths)
import Hadith       from "./Page/Hadith/Index";
import Collection   from "./Page/Hadith/Collection";
import Chapter      from "./Page/Hadith/Chapter";
import Narration    from "./Page/Hadith/Narration";

// 7. Pages - Aid & Ummah & AI (Relative Paths)
import Aid_Root                   from "./Page/Aid/Root";
import Prayer_Times          from "./Page/Aid/Prayer-Times";
import Qibla                 from "./Page/Aid/Qibla";
import Hijri_Calendar        from "./Page/Aid/Hijri-Calendar";
import Masjid_Finder         from "./Page/Aid/Masjid-Finder";
import Ummah                 from "./Page/Ummah/Index";
import Aid_Tasbih_Counter                from "./Page/Aid/Tasbih-Counter";
import AI                    from "./Page/AI/Index";

// 8. Pages - Ilm (Chess & Language)
import Root_Picker           from "./Page/Ilm/Root";

// Language Modular Views
import Language_Root         from "./Page/Ilm/Language/Root";
import Language_Index        from "./Page/Ilm/Language/Index";
import Levels_Page           from "./Page/Ilm/Language/Lesson/Index";
import Level_Page            from "./Page/Ilm/Language/Lesson/Level";
import Lesson_Runner_Page    from "./Page/Ilm/Language/Lesson/Lesson";
import Dictionary_Root       from "./Page/Ilm/Language/Dictionary/Root";
import Dictionary_Category   from "./Page/Ilm/Language/Dictionary/Category";
import Dictionary_Subcategory from "./Page/Ilm/Language/Dictionary/Subcategory";
import Dictionary_Word       from "./Page/Ilm/Language/Dictionary/Word";
import Word_Detail_View      from "./Page/Ilm/Language/Dictionary/Detail";

// General & Admin Pages
import Feedback              from "./Page/Feedback";
import Donate                from "./Page/Donate";
import Sign_In_Page          from "./Page/Auth/Sign-In";
import Sign_Up               from "./Page/Auth/Sign-Up";
import Forgot_Password       from "./Page/Auth/Forgot-Password";
import Search_Results        from "./Page/Search";
import Not_Found             from "./Page/404";
import Admin_Login           from "./Page/Admin/Login";
import AdminDashboard        from "./Page/Admin/Dashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: Infinity,
      gcTime: 60 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    },
  },
});

const RouteLayout = () => (
  <Layout>
    <Outlet />
  </Layout>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Auth_Provider>
          <Admin_Provider>
            <App_Provider>
              <Audio_Provider>
                <Tooltip_Provider>
                  <NavigationProvider>
                    <Toaster />
                    <Sonner />
                    <Visit_Tracker />
                    <GlobalNavOverlay />

                    {/* Boven de Routes: elke pagina rendert zelf <Layout> en
                        remount bij navigatie, de provider moet blijven staan. */}
                    <Page_Transition_Provider>
                    <Routes>
                      {/* Hoofdpagina / Al-Deen Home */}
                      <Route path="/" element={<Root />} />

                      {/* Layout-wrapped application paths (zoals Ilm / Chess / Language) */}
                      <Route element={<RouteLayout />}>
                        <Route path="/Ilm" element={<Root_Picker />} />

                        {/* Language Navigation Tree onder Ilm */}
                        <Route path="/Ilm/Language">
                          <Route index element={<Language_Root />} />
                          <Route path=":Lang_Name">
                            <Route index element={<Language_Index />} />

                            <Route path="Lesson">
                              <Route index element={<Levels_Page />} />
                              <Route path=":Level_Id">
                                <Route index element={<Level_Page />} />
                                <Route path=":Lesson_Slug" element={<Lesson_Runner_Page />} />
                              </Route>
                            </Route>

                            <Route path="Dictionary">
                              <Route index element={<Dictionary_Root />} />
                              <Route path="Vocabulary">
                                <Route index element={<Dictionary_Category />} />
                                <Route path=":Category_ID" element={<Dictionary_Subcategory />} />
                                <Route path=":Category_ID/:Subcategory_ID" element={<Dictionary_Word />} />
                                <Route path=":Category_ID/:Subcategory_ID/:Word_ID" element={<Word_Detail_View />} />
                              </Route>
                            </Route>
                          </Route>
                        </Route>
                      </Route>

                      {/* Quran */}
                      <Route path="/Quran" element={<Quran />} />
                      <Route path="/Quran/Surah/:id" element={<Surah />} />
                      <Route path="/Quran/Surah/:id/Ayah/:verseId" element={<Ayah />} />
                      <Route path="/Quran/Surah/:id/Ayah/:verseId/Kalima/:kalimaId" element={<Kalimah />} />
                      <Route path="/Quran/Juz/:id" element={<JuzIndex />} />
                      <Route path="/Quran/Hizb/:id" element={<HizbIndex />} />
                      <Route path="/Quran/Page/:id" element={<QuranPage />} />
                      <Route path="/Quran/Goal" element={<QuranGoals />} />

                      {/* Hadith */}
                      <Route path="/Hadith" element={<Hadith />} />
                      <Route path="/Hadith/:Collection" element={<Collection />} />
                      <Route path="/Hadith/:Collection/:Chapter" element={<Chapter />} />
                      <Route path="/Hadith/:Collection/:Chapter/:HadithId" element={<Narration />} />

                      {/* Aid & Ummah & AI */}
                      <Route path="/Aid" element={<Aid_Root />} />
                      <Route path="/Aid/Tasbih-Counter" element={<Aid_Tasbih_Counter />} />
                      <Route path="/Aid/Prayers" element={<Prayer_Times />} />
                      <Route path="/Aid/Qibla" element={<Qibla />} />
                      <Route path="/Aid/Hijri-Calendar" element={<Hijri_Calendar />} />
                      <Route path="/Aid/Masjid-Finder" element={<Masjid_Finder />} />
                      <Route path="/Ummah" element={<Ummah />} />
                      <Route path="/AI" element={<AI />} />

                      {/* General */}
                      <Route path="/Feedback" element={<Feedback />} />
                      <Route path="/Donate" element={<Donate />} />
                      <Route path="/Sign-In" element={<Sign_In_Page />} />
                      <Route path="/Sign-Up" element={<Sign_Up />} />
                      <Route path="/Forgot-Password" element={<Forgot_Password />} />
                      <Route path="/Search" element={<Search_Results />} />

                      {/* Admin */}
                      <Route path="/Admin" element={<AdminDashboard />} />
                      <Route path="/Admin/Login" element={<Admin_Login />} />

                      <Route path="*" element={<Not_Found />} />
                    </Routes>
                    </Page_Transition_Provider>
                  </NavigationProvider>
                </Tooltip_Provider>
              </Audio_Provider>
            </App_Provider>
          </Admin_Provider>
        </Auth_Provider>
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;