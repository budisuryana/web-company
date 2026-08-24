/** Design system: Software Almanac — each route is a calm chapter in a single coherent product catalog. */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
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
  return <Switch><Route path="/admin/products/:id" component={AdminProductEditor} /><Route path="/admin/products" component={AdminProducts} /><Route path="/admin/content" component={AdminContent} /><Route path="/admin/users" component={AdminUsers} /><Route path="/admin" component={AdminDashboard} /><Route path="/" component={Home} /><Route path="/products" component={Products} /><Route path="/products/:slug" component={ProductDetail} /><Route path="/about" component={About} /><Route path="/contact" component={Contact} /><Route component={NotFound} /></Switch>;
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export default App;
