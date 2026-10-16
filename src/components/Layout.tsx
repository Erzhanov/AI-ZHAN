import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  BarChart3,
  Crown,
  Globe,
  History,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Stethoscope,
  User,
  X,
  Pill,
  HeartPulse,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/use-admin";
import { useProStatus } from "@/hooks/use-pro-status";
import { useLanguage } from "@/contexts/LanguageContext";
import { WelcomeProDialog } from "@/components/WelcomeProDialog";
import { ExpiredProDialog } from "@/components/ExpiredProDialog";

interface LayoutProps {
  children: React.ReactNode;
}

const getNavItems = (_isPro: boolean, t: (k: string) => string) => [
  { path: "/chat", label: t("nav.help") || "Кеңес", icon: MessageSquare },
  { path: "/medicine", label: t("nav.medicine") || "Дәріхана", icon: Pill },
  { path: "/history", label: t("nav.history") || "Тарих", icon: History },
  { path: "/profile", label: t("nav.profile") || "Профиль", icon: User },
];

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { isPro } = useProStatus();
  const { lang, setLang, t } = useLanguage();
  const navItems = getNavItems(isPro, t);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const toggleLang = () => setLang(lang === "kk" ? "ru" : "kk");

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-3.5 py-2.5 sm:px-6 sm:py-3">
          {/* Logo & Brand */}
          <NavLink to="/chat" className="flex items-center gap-2.5 sm:gap-3 transition-transform active:scale-95">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl gradient-medical shadow-card">
              <Stethoscope className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <p className="text-sm sm:text-base font-bold tracking-tight">AIZHAN</p>
                {isPro ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                    <Crown className="h-2.5 w-2.5" />
                    PRO
                  </span>
                ) : (
                  <span className="hidden xs:inline-block rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                    MED
                  </span>
                )}
              </div>
              <p className="hidden text-[11px] text-muted-foreground sm:block">
                {isPro ? t("nav.subtitle.pro") : t("nav.subtitle.free")}
              </p>
            </div>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-1.5 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-card"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
            {isAdmin && (
              <NavLink
                to="/admin"
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all ${
                  location.pathname === "/admin"
                    ? "bg-primary text-primary-foreground shadow-card"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                {t("nav.admin")}
              </NavLink>
            )}
            <div className="ml-1 h-5 w-[1px] bg-border" />
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLang}
              className="h-9 rounded-xl px-2.5 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <Globe className="mr-1 h-3.5 w-3.5" />
              {lang === "kk" ? "РУС" : "ҚАЗ"}
            </Button>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="h-9 rounded-xl px-2.5 text-xs text-muted-foreground hover:bg-secondary hover:text-destructive"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Mobile Header Controls */}
          <div className="flex items-center gap-1.5 md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLang}
              className="h-8 rounded-lg px-2 text-xs font-semibold text-muted-foreground"
            >
              <Globe className="mr-1 h-3 w-3" />
              {lang === "kk" ? "РУС" : "ҚАЗ"}
            </Button>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(true)}
              className="h-8 w-8 rounded-lg p-0 text-muted-foreground"
              aria-label="Menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer (for Logout, Admin, Extra actions) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-[280px] border-l border-border/80 bg-background p-5 shadow-2xl safe-bottom-padding">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-medical">
                  <Stethoscope className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-sm font-bold">AIZHAN</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(false)}
                className="h-8 w-8 rounded-lg p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-foreground hover:bg-secondary"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                );
              })}
              {isAdmin && (
                <NavLink
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-foreground hover:bg-secondary"
                >
                  <BarChart3 className="h-4 w-4" />
                  {t("nav.admin")}
                </NavLink>
              )}
            </div>

            <div className="mt-6 border-t border-border pt-4">
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full justify-start rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t("nav.logout")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="mx-auto max-w-6xl px-3 py-3 pb-24 sm:px-6 sm:py-5 md:pb-6">
        {children}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/85 safe-bottom-padding md:hidden shadow-lg">
        <div className="grid grid-cols-4 items-center px-1 py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`relative flex flex-col items-center justify-center py-2 transition-transform active:scale-95 ${
                  isActive
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                    isActive
                      ? "bg-primary/15 text-primary scale-105"
                      : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className="mt-0.5 text-[10px] tracking-tight">
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute -top-[1px] h-[2px] w-8 rounded-full bg-primary" />
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <WelcomeProDialog />
      <ExpiredProDialog />
    </div>
  );
};

export default Layout;
