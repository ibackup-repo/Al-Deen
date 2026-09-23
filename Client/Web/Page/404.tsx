import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "@Web/Component/Layout/Index";
import { Home, Search, Book } from "lucide-react";
import { Use_Translation } from "@/Hook/Use-Translation";
import { Button } from "@Web/Component/UI/Button";

const Not_Found = () => {
  const Location_Data = useLocation();
  const { t } = Use_Translation();

  useEffect(() => {
    console.error("404 error: User attempted to access non-existent route:", Location_Data.pathname);
  }, [Location_Data.pathname]);

  return (
    <Layout>
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full bg-muted">
            <span className="text-4xl font-bold text-primary">404</span>
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <div className="space-y-3">
            <Link to="/">
              <Button fullWidth className="gap-2 justify-center bg-primary text-primary-foreground">
                <Home className="h-4 w-4" />
                {t.nav.home}
              </Button>
            </Link>
            
            <Link to="/Quran">
              <Button fullWidth className="gap-2 justify-center">
                <Book className="h-4 w-4" />
                {t.nav.Quran}
              </Button>
            </Link>
            
            <Link to="/Search">
              <Button fullWidth className="gap-2 justify-center">
                <Search className="h-4 w-4" />
                {t.nav.Search_Query}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Not_Found;