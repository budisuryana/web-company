/** Design system: Software Almanac — each route is a calm chapter in a single coherent product catalog. */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { CMS_BASE_PATH } from "./const";
import { ThemeProvider } from "./contexts/ThemeContext";
import About from "./pages/About";
import AdminContent from "./pages/AdminContent";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProductEditor from "./pages/AdminProductEditor";
import AdminProducts from "./pages/AdminProducts";
import AdminUsers from "./pages/AdminUsers";
import Contact from "./pages/Contact";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import ProductDetail from "./pages/ProductDetail";
import Products from "./pages/Products";

function Router() {
  return (
    <Switch>
      {/* Configurable CMS Routes (Default: /studio/...) */}
      <Route path={`${CMS_BASE_PATH}/products/:id`} component={AdminProductEditor} />
      <Route path={`${CMS_BASE_PATH}/products`} component={AdminProducts} />
      <Route path={`${CMS_BASE_PATH}/content`} component={AdminContent} />
      <Route path={`${CMS_BASE_PATH}/users`} component={AdminUsers} />
      <Route path={CMS_BASE_PATH} component={AdminDashboard} />

      {/* Public Pages */}
      <Route path="/" component={Home} />
      <Route path="/products" component={Products} />
      <Route path="/products/:slug" component={ProductDetail} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />

      {/* 404 Catch-All */}
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
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
