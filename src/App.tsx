import { useState, useEffect, lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useIsAdmin } from "@/hooks/use-admin";
import { supabase } from "@/integrations/supabase/client";
import { TermsModal } from "@/components/TermsModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Resilient lazy loader with automatic reload for stale/mismatched bundle chunks
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const safeLazy = <T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) => {
  return lazy(async () => {
    try {
      const res = await factory();
      try {
        sessionStorage.removeItem("chunk_reload_attempted");
      } catch {
        // Ignore storage errors
      }
      return res;
    } catch (err) {
      console.warn("Chunk load error, retrying with fresh page reload:", err);
      try {
        const reloaded = sessionStorage.getItem("chunk_reload_attempted");
        if (!reloaded) {
          sessionStorage.setItem("chunk_reload_attempted", "1");
          window.location.reload();
        }
      } catch {
        // Ignore storage errors
      }
      throw err;
    }
  });
};

// Lazy-loaded pages for fast initial bundle loading
const LoginPage = safeLazy(() => import("./pages/LoginPage"));
const LandingPage = safeLazy(() => import("./pages/LandingPage"));
const ChatPage = safeLazy(() => import("./pages/ChatPage"));
const HistoryPage = safeLazy(() => import("./pages/HistoryPage"));
const MedicinePage = safeLazy(() => import("./pages/MedicinePage"));
const ProfilePage = safeLazy(() => import("./pages/ProfilePage"));
const ProPage = safeLazy(() => import("./pages/ProPage"));
const AdminPage = safeLazy(() => import("./pages/AdminPage"));
const StripeDebugPage = safeLazy(() => import("./pages/StripeDebugPage"));
const TermsPage = safeLazy(() => import("./pages/TermsPage"));
const NotFound = safeLazy(() => import("./pages/NotFound"));

const PageFallback = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground gap-3">
    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    <p className="text-xs text-muted-foreground animate-pulse">Жүктелуде...</p>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [termsAccepted, setTermsAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    // Safety timeout: never hang indefinitely on terms check
    const timer = setTimeout(() => {
      if (isMounted) {
        setTermsAccepted((prev) => (prev === null ? true : prev));
      }
    }, 2000);

    supabase
      .from("profiles")
      .select("terms_accepted_at")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          console.warn("Terms acceptance check warning:", error.message);
          setTermsAccepted(true); // default to true so user is not locked out
          return;
        }
        setTermsAccepted(!!data?.terms_accepted_at);
      })
      .catch((err) => {
        console.warn("Terms query failed:", err);
        if (isMounted) setTermsAccepted(true);
      })
      .finally(() => {
        clearTimeout(timer);
      });

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground gap-3">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground animate-pulse">Жүйеге кіруде...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (termsAccepted === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground gap-3">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground animate-pulse">Деректер тексерілуде...</p>
      </div>
    );
  }

  return (
    <>
      {children}
      {!termsAccepted && <TermsModal onAccepted={() => setTermsAccepted(true)} />}
    </>
  );
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/chat" replace />;
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  if (loading || adminLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground gap-3">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground animate-pulse">Әкімшілік рұқсат тексерілуде...</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/chat" replace />;
  return <>{children}</>;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <LanguageProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <ErrorBoundary>
                  <Suspense fallback={<PageFallback />}>
                    <Routes>
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/terms" element={<TermsPage />} />
                      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                      <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                      <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
                      <Route path="/medicine" element={<ProtectedRoute><MedicinePage /></ProtectedRoute>} />
                      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                      <Route path="/pro" element={<ProtectedRoute><ProPage /></ProtectedRoute>} />
                      <Route path="/lifestyle" element={<Navigate to="/chat" replace />} />
                      <Route path="/reviews" element={<Navigate to="/chat" replace />} />
                      <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
                      <Route path="/admin/stripe-debug" element={<AdminRoute><StripeDebugPage /></AdminRoute>} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </ErrorBoundary>
              </BrowserRouter>
            </TooltipProvider>
          </LanguageProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
