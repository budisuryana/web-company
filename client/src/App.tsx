/** Design system: Software Almanac — each route is a calm chapter in a single coherent product catalog. */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useRef } from "react";
import { Route, Switch, matchRoute, useLocation, useRouter } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { CMS_BASE_PATH } from "./const";
import { ThemeProvider } from "./contexts/ThemeContext";
import About from "./pages/About";
import AdminContent from "./pages/AdminContent";
import AdminDashboard from "./pages/AdminDashboard";
import AdminInbox from "./pages/AdminInbox";
import AdminProductEditor from "./pages/AdminProductEditor";
import AdminProducts from "./pages/AdminProducts";
import AdminUsers from "./pages/AdminUsers";
import Contact from "./pages/Contact";
import { ContentProvider, LocaleProvider } from "./i18n";
import { AdminLocaleProvider } from "./admin/i18n";
import StudioLayout from "./studio/StudioLayout";
import Home from "./pages/Home";
import Legal from "./pages/Legal";
import NotFound from "./pages/NotFound";
import ProductDetail from "./pages/ProductDetail";
import Products from "./pages/Products";

/**
 * Wouter navigates with pushState, which leaves the scroll offset untouched — following a link
 * from mid-catalogue used to land mid-article. Reset to the top on forward navigation only, so
 * deep-linked anchors and browser back/forward keep behaving natively.
 */
function ScrollToTop() {
  const [location] = useLocation();
  const isFirstRender = useRef(true);
  const cameFromHistory = useRef(false);

  useEffect(() => {
    const markHistoryNav = () => {
      cameFromHistory.current = true;
    };
    window.addEventListener("popstate", markHistoryNav);
    return () => window.removeEventListener("popstate", markHistoryNav);
  }, []);

  useEffect(() => {
    // First paint: leave it alone so a deep-linked #anchor still wins.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Back/forward: the browser already restored a position, don't fight it.
    if (cameFromHistory.current) {
      cameFromHistory.current = false;
      return;
    }
    // An in-page anchor owns the scroll target.
    if (window.location.hash) return;
    // "instant" matters: html has scroll-behavior:smooth, and animating between
    // routes reads as the old page sliding away.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location]);

  return null;
}

/** Configurable CMS routes (default: /studio/...), in match order. */
const CMS_PAGES = [
  { path: `${CMS_BASE_PATH}/products/:id`, component: AdminProductEditor },
  { path: `${CMS_BASE_PATH}/products`, component: AdminProducts },
  { path: `${CMS_BASE_PATH}/inbox`, component: AdminInbox },
  { path: `${CMS_BASE_PATH}/content`, component: AdminContent },
  { path: `${CMS_BASE_PATH}/users`, component: AdminUsers },
  { path: CMS_BASE_PATH, component: AdminDashboard },
];

function Router() {
  const [location] = useLocation();
  const { parser } = useRouter();

  // One layout route for the CMS: StudioLayout (access gate + shell) stays mounted while only the
  // page changes. Any other path — including unknown /studio/... ones — goes to the public site, as before.
  if (CMS_PAGES.some((page) => matchRoute(parser, page.path, location)[0])) {
    return (
      <StudioLayout>
        <Switch>
          {CMS_PAGES.map((page) => (
            <Route key={page.path} path={page.path} component={page.component} />
          ))}
        </Switch>
      </StudioLayout>
    );
  }

  return (
    <Switch>
      {/* Indonesian: the same public tree nested under /id, so relative links stay in Indonesian. */}
      <Route path="/id" nest>
        <LocaleProvider locale="id">
          <PublicRoutes />
        </LocaleProvider>
      </Route>

      {/* English (default), including the 404 catch-all. */}
      <Route>
        <LocaleProvider locale="en">
          <PublicRoutes />
        </LocaleProvider>
      </Route>
    </Switch>
  );
}

function PublicRoutes() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/products" component={Products} />
      <Route path="/products/:slug" component={ProductDetail} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/privacy">{() => <Legal doc="privacy" />}</Route>
      <Route path="/terms">{() => <Legal doc="terms" />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <ScrollToTop />
          <ContentProvider>
            <AdminLocaleProvider>
              <Router />
            </AdminLocaleProvider>
          </ContentProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
