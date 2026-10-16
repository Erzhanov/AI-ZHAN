import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, MessageSquare, Pill, TrendingUp, Activity, Search,
  Brain, Stethoscope, Smile, Apple, Dumbbell,
  ChevronLeft, ChevronRight, RefreshCw, Shield, BarChart3, KeyRound, CheckCircle2, Settings2, AlertTriangle,
  MessageCircle, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type TabType = "overview" | "users" | "chats" | "medicines" | "reviews" | "ai-settings";

interface ReviewItem {
  id: string;
  user_id: string;
  content: string;
  rating: number | null;
  created_at: string;
}

interface Profile {
  user_id: string;
  full_name: string;
  created_at: string;
}

interface ChatMsg {
  id: string;
  user_id: string;
  mode: string;
  user_message: string;
  ai_response: string;
  created_at: string;
}

interface MedSearch {
  id: string;
  user_id: string;
  query: string;
  created_at: string;
}

type AiStatus = {
  state: "checking" | "available" | "unavailable";
  message: string;
  model: string;
};

const modeLabels: Record<string, { label: string; icon: typeof Brain }> = {
  medical: { label: "Медицина", icon: Stethoscope },
  psychology: { label: "Психология", icon: Brain },
  motivation: { label: "Мотивация", icon: Smile },
  nutrition: { label: "Тамақтану", icon: Apple },
  fitness: { label: "Фитнес", icon: Dumbbell },
  medicine: { label: "Дәрі іздеу", icon: Pill },
};

const AdminPage = () => {
  const [tab, setTab] = useState<TabType>("overview");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [chats, setChats] = useState<ChatMsg[]>([]);
  const [medicines, setMedicines] = useState<MedSearch[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatPage, setChatPage] = useState(0);
  const [medPage, setMedPage] = useState(0);
  const [reviewPage, setReviewPage] = useState(0);
  const [aiStatus, setAiStatus] = useState<AiStatus>({
    state: "checking",
    message: "AI күйі тексерілуде...",
    model: "",
  });
  const PAGE_SIZE = 20;
  const { toast } = useToast();

  const fetchAll = async () => {
    setLoading(true);
    const [profilesRes, chatsRes, medsRes, reviewsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, created_at").order("created_at", { ascending: false }),
      supabase.from("chat_messages").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("medicine_searches").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("reviews").select("*").order("created_at", { ascending: false }).limit(500),
    ]);
    if (profilesRes.data) setProfiles(profilesRes.data);
    if (chatsRes.data) setChats(chatsRes.data);
    if (medsRes.data) setMedicines(medsRes.data);
    if (reviewsRes.data) setReviews(reviewsRes.data);
    setLoading(false);
  };

  const checkAiStatus = async () => {
    setAiStatus(prev => ({ ...prev, state: "checking", message: "AI күйі тексерілуде..." }));

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat?health=1`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });

      const data = await response.json().catch(() => ({}));
      const message = typeof data.message === "string"
        ? data.message
        : "AI backend күйін анықтау мүмкін болмады.";
      const model = typeof data.model === "string" ? data.model : "";

      if (!response.ok || data.status !== "available") {
        setAiStatus({ state: "unavailable", message, model });
        return;
      }

      setAiStatus({ state: "available", message, model });
    } catch {
      setAiStatus({
        state: "unavailable",
        message: "AI backend-пен байланыс орнатылмады.",
        model: "",
      });
    }
  };

  const handleRefresh = () => {
    fetchAll();
    checkAiStatus();
  };

  useEffect(() => {
    fetchAll();
    checkAiStatus();
  }, []);

  // Stats
  const totalUsers = profiles.length;
  const totalChats = chats.length;
  const totalMeds = medicines.length;
  const todayChats = chats.filter(c => new Date(c.created_at).toDateString() === new Date().toDateString()).length;
  const todayUsers = profiles.filter(p => new Date(p.created_at).toDateString() === new Date().toDateString()).length;

  // Mode distribution
  const modeCounts: Record<string, number> = {};
  chats.forEach(c => { modeCounts[c.mode] = (modeCounts[c.mode] || 0) + 1; });

  // Users with emails from auth - we use profiles
  const userMap: Record<string, string> = {};
  profiles.forEach(p => { userMap[p.user_id] = p.full_name || "Белгісіз"; });

  // Filtered chats
  const filteredChats = chats.filter(c =>
    !searchQuery ||
    c.user_message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (userMap[c.user_id] || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
  const pagedChats = filteredChats.slice(chatPage * PAGE_SIZE, (chatPage + 1) * PAGE_SIZE);

  // Filtered meds
  const filteredMeds = medicines.filter(m =>
    !searchQuery || m.query.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const pagedMeds = filteredMeds.slice(medPage * PAGE_SIZE, (medPage + 1) * PAGE_SIZE);

  const formatTime = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Жаңа ғана";
    if (mins < 60) return `${mins} мин бұрын`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} сағат бұрын`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} күн бұрын`;
    return date.toLocaleDateString("kk-KZ");
  };

  const stats = [
    { label: "Пайдаланушылар", value: totalUsers, sub: `+${todayUsers} бүгін`, icon: Users, color: "text-primary" },
    { label: "AI сұрақтар", value: totalChats, sub: `+${todayChats} бүгін`, icon: MessageSquare, color: "text-green-500" },
    { label: "Дәрі іздеулер", value: totalMeds, sub: "", icon: Pill, color: "text-blue-500" },
    { label: "Белсенділік", value: totalChats + totalMeds > 0 ? Math.round((todayChats / Math.max(totalChats, 1)) * 100) + "%" : "0%", sub: "бүгінгі", icon: TrendingUp, color: "text-accent" },
  ];

  const tabs = [
    { id: "overview" as TabType, label: "Шолу", icon: BarChart3 },
    { id: "users" as TabType, label: "Пайдаланушылар", icon: Users },
    { id: "chats" as TabType, label: "AI сұрақтар", icon: MessageSquare },
    { id: "medicines" as TabType, label: "Дәрі іздеулер", icon: Pill },
    { id: "reviews" as TabType, label: "Пікірлер", icon: MessageCircle },
    { id: "ai-settings" as TabType, label: "AI баптаулары", icon: Settings2 },
  ];

  return (
    <Layout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
              <div className="flex items-center gap-2 flex-wrap">
              <Shield className="w-5 h-5 text-primary" />
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Админ панель</h1>
                <Badge variant={aiStatus.state === "unavailable" ? "destructive" : aiStatus.state === "available" ? "default" : "secondary"}>
                  {aiStatus.state === "checking" && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
                  {aiStatus.state === "unavailable" && <AlertTriangle className="w-3 h-3 mr-1" />}
                  {aiStatus.state === "available" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                  {aiStatus.state === "unavailable" ? "AI unavailable" : aiStatus.state === "available" ? "AI ready" : "AI тексерілуде"}
                </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">AIZHAN жүйесінің басқару панелі</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading || aiStatus.state === "checking"}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Жаңарту
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto scrollbar-none pb-1">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setSearchQuery(""); setChatPage(0); setMedPage(0); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  tab === t.id
                    ? "gradient-medical text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {tab === "overview" && (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {stats.map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <div key={i} className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-card">
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-secondary flex items-center justify-center">
                            <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${s.color}`} />
                          </div>
                          {s.sub && (
                            <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded-full">{s.sub}</span>
                          )}
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-foreground">{s.value}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">{s.label}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Mode distribution */}
                <div className="bg-card border border-border rounded-xl shadow-card">
                  <div className="p-4 sm:p-5 border-b border-border">
                    <h2 className="font-semibold text-foreground flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" />
                      Режим бойынша статистика
                    </h2>
                  </div>
                  <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {Object.entries(modeLabels).filter(([key]) => key !== "medicine").map(([key, val]) => {
                      const Icon = val.icon;
                      const count = modeCounts[key] || 0;
                      const pct = totalChats > 0 ? Math.round((count / totalChats) * 100) : 0;
                      return (
                        <div key={key} className="bg-secondary/50 rounded-xl p-3 sm:p-4 text-center">
                          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary mx-auto mb-2" />
                          <p className="text-lg sm:text-xl font-bold text-foreground">{count}</p>
                          <p className="text-xs text-muted-foreground">{val.label}</p>
                          <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full gradient-medical rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{pct}%</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Recent chats */}
                  <div className="bg-card border border-border rounded-xl shadow-card">
                    <div className="flex items-center gap-2 p-4 sm:p-5 border-b border-border">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      <h2 className="font-semibold text-foreground">Соңғы сұрақтар</h2>
                    </div>
                    <div className="divide-y divide-border max-h-80 overflow-y-auto">
                      {chats.slice(0, 8).map((c) => {
                        const modeInfo = modeLabels[c.mode];
                        const MIcon = modeInfo?.icon || Brain;
                        return (
                          <div key={c.id} className="px-4 sm:px-5 py-3 sm:py-4 flex items-start gap-3">
                            <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                              <MIcon className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground line-clamp-2">{c.user_message}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">{userMap[c.user_id] || "Белгісіз"}</span>
                                <span className="text-xs text-muted-foreground">•</span>
                                <span className="text-xs text-muted-foreground">{formatTime(c.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {chats.length === 0 && (
                        <div className="p-8 text-center text-sm text-muted-foreground">Сұрақтар жоқ</div>
                      )}
                    </div>
                  </div>

                  {/* Recent users */}
                  <div className="bg-card border border-border rounded-xl shadow-card">
                    <div className="flex items-center gap-2 p-4 sm:p-5 border-b border-border">
                      <Users className="w-4 h-4 text-primary" />
                      <h2 className="font-semibold text-foreground">Соңғы пайдаланушылар</h2>
                    </div>
                    <div className="divide-y divide-border max-h-80 overflow-y-auto">
                      {profiles.slice(0, 8).map((p) => {
                        const userChats = chats.filter(c => c.user_id === p.user_id).length;
                        return (
                          <div key={p.user_id} className="px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-foreground">
                                  {(p.full_name || "?")[0].toUpperCase()}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{p.full_name || "Белгісіз"}</p>
                                <p className="text-xs text-muted-foreground">{userChats} сұрақ</p>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{formatTime(p.created_at)}</span>
                          </div>
                        );
                      })}
                      {profiles.length === 0 && (
                        <div className="p-8 text-center text-sm text-muted-foreground">Пайдаланушылар жоқ</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Top medicine searches */}
                <div className="bg-card border border-border rounded-xl shadow-card">
                  <div className="flex items-center gap-2 p-4 sm:p-5 border-b border-border">
                    <Pill className="w-4 h-4 text-primary" />
                    <h2 className="font-semibold text-foreground">Танымал дәрі іздеулер</h2>
                  </div>
                  <div className="p-4 sm:p-5">
                    {(() => {
                      const medCounts: Record<string, number> = {};
                      medicines.forEach(m => { medCounts[m.query] = (medCounts[m.query] || 0) + 1; });
                      const sorted = Object.entries(medCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
                      if (sorted.length === 0) return <p className="text-sm text-muted-foreground text-center py-4">Іздеулер жоқ</p>;
                      const max = sorted[0][1];
                      return (
                        <div className="space-y-3">
                          {sorted.map(([name, count]) => (
                            <div key={name} className="flex items-center gap-3">
                              <Pill className="w-4 h-4 text-primary flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-foreground truncate">{name}</span>
                                  <span className="text-xs text-muted-foreground ml-2">{count} рет</span>
                                </div>
                                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                  <div className="h-full gradient-medical rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* USERS TAB */}
            {tab === "users" && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Пайдаланушы іздеу..."
                    className="pl-10 h-11"
                  />
                </div>
                <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-secondary/50">
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Аты</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Сұрақтар</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Дәрі іздеу</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Тіркелген</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {profiles
                          .filter(p => !searchQuery || (p.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()))
                          .map(p => {
                            const userChats = chats.filter(c => c.user_id === p.user_id).length;
                            const userMeds = medicines.filter(m => m.user_id === p.user_id).length;
                            return (
                              <tr key={p.user_id} className="hover:bg-secondary/30 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                                      <span className="text-xs font-bold">{(p.full_name || "?")[0].toUpperCase()}</span>
                                    </div>
                                    <span className="font-medium text-foreground">{p.full_name || "Белгісіз"}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">{userChats}</td>
                                <td className="px-4 py-3 text-muted-foreground">{userMeds}</td>
                                <td className="px-4 py-3 text-muted-foreground">{formatTime(p.created_at)}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                  {profiles.length === 0 && (
                    <div className="p-8 text-center text-sm text-muted-foreground">Пайдаланушылар жоқ</div>
                  )}
                </div>
              </div>
            )}

            {/* CHATS TAB */}
            {tab === "chats" && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setChatPage(0); }}
                    placeholder="Сұрақтарды іздеу..."
                    className="pl-10 h-11"
                  />
                </div>
                <div className="bg-card border border-border rounded-xl shadow-card divide-y divide-border">
                  {pagedChats.map(c => {
                    const modeInfo = modeLabels[c.mode];
                    const MIcon = modeInfo?.icon || Brain;
                    return (
                      <div key={c.id} className="p-4 sm:p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded bg-secondary flex items-center justify-center">
                            <MIcon className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {modeInfo?.label || c.mode}
                          </span>
                          <span className="text-xs text-muted-foreground">{userMap[c.user_id] || "Белгісіз"}</span>
                          <span className="text-xs text-muted-foreground ml-auto">{formatTime(c.created_at)}</span>
                        </div>
                        <p className="text-sm font-medium text-foreground mb-1">❓ {c.user_message}</p>
                        {c.ai_response && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            💡 {c.ai_response.substring(0, 200)}...
                          </p>
                        )}
                      </div>
                    );
                  })}
                  {pagedChats.length === 0 && (
                    <div className="p-8 text-center text-sm text-muted-foreground">Сұрақтар жоқ</div>
                  )}
                </div>
                {/* Pagination */}
                {filteredChats.length > PAGE_SIZE && (
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm" disabled={chatPage === 0} onClick={() => setChatPage(p => p - 1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {chatPage + 1} / {Math.ceil(filteredChats.length / PAGE_SIZE)}
                    </span>
                    <Button variant="outline" size="sm" disabled={(chatPage + 1) * PAGE_SIZE >= filteredChats.length} onClick={() => setChatPage(p => p + 1)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* MEDICINES TAB */}
            {tab === "medicines" && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setMedPage(0); }}
                    placeholder="Дәрі іздеулерді іздеу..."
                    className="pl-10 h-11"
                  />
                </div>
                <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-secondary/50">
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Дәрі атауы</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Пайдаланушы</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Уақыт</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {pagedMeds.map(m => (
                          <tr key={m.id} className="hover:bg-secondary/30 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Pill className="w-4 h-4 text-primary flex-shrink-0" />
                                <span className="font-medium text-foreground">{m.query}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{userMap[m.user_id] || "Белгісіз"}</td>
                            <td className="px-4 py-3 text-muted-foreground">{formatTime(m.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {pagedMeds.length === 0 && (
                    <div className="p-8 text-center text-sm text-muted-foreground">Іздеулер жоқ</div>
                  )}
                </div>
                {filteredMeds.length > PAGE_SIZE && (
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm" disabled={medPage === 0} onClick={() => setMedPage(p => p - 1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {medPage + 1} / {Math.ceil(filteredMeds.length / PAGE_SIZE)}
                    </span>
                    <Button variant="outline" size="sm" disabled={(medPage + 1) * PAGE_SIZE >= filteredMeds.length} onClick={() => setMedPage(p => p + 1)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* REVIEWS TAB */}
            {tab === "reviews" && (() => {
              const filteredReviews = reviews.filter(r =>
                !searchQuery ||
                r.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (userMap[r.user_id] || "").toLowerCase().includes(searchQuery.toLowerCase())
              );
              const pagedReviews = filteredReviews.slice(reviewPage * PAGE_SIZE, (reviewPage + 1) * PAGE_SIZE);
              return (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); setReviewPage(0); }}
                      placeholder="Пікірлерді іздеу..."
                      className="pl-10 h-11"
                    />
                  </div>
                  <div className="bg-card border border-border rounded-xl shadow-card divide-y divide-border">
                    {pagedReviews.map(r => (
                      <div key={r.id} className="p-4 sm:p-5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold">{(userMap[r.user_id] || "?")[0].toUpperCase()}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-foreground">{userMap[r.user_id] || "Белгісіз"}</span>
                              <p className="text-xs text-muted-foreground">{formatTime(r.created_at)}</p>
                            </div>
                          </div>
                          {r.rating && (
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating! ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/20"}`} />
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-foreground/80">{r.content}</p>
                      </div>
                    ))}
                    {pagedReviews.length === 0 && (
                      <div className="p-8 text-center text-sm text-muted-foreground">Пікірлер жоқ</div>
                    )}
                  </div>
                  {filteredReviews.length > PAGE_SIZE && (
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="outline" size="sm" disabled={reviewPage === 0} onClick={() => setReviewPage(p => p - 1)}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {reviewPage + 1} / {Math.ceil(filteredReviews.length / PAGE_SIZE)}
                      </span>
                      <Button variant="outline" size="sm" disabled={(reviewPage + 1) * PAGE_SIZE >= filteredReviews.length} onClick={() => setReviewPage(p => p + 1)}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })()}

            {tab === "ai-settings" && (
              <div className="space-y-6">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="bg-card border border-border rounded-xl p-5 shadow-card">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                        <KeyRound className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-foreground">OpenAI API Token</h2>
                        <p className="text-sm text-muted-foreground">Қауіпсіз backend token баптауы</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Token орны</label>
                        <Input
                          type="password"
                          value="••••••••••••••••••••••••"
                          readOnly
                          className="h-11"
                        />
                      </div>

                      <div className="flex items-start gap-2 rounded-lg bg-secondary/50 p-3">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Token backend-та сақталады</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Қауіпсіздік үшін токен қолданушыға көрсетілмейді және интерфейсте ашық сақталмайды.
                          </p>
                        </div>
                      </div>

                      <div className={`rounded-lg border p-3 ${aiStatus.state === "unavailable" ? "border-destructive/20 bg-destructive/5" : "border-border bg-secondary/50"}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">Backend күйі</p>
                            <p className={`text-xs mt-1 ${aiStatus.state === "unavailable" ? "text-destructive" : "text-muted-foreground"}`}>
                              {aiStatus.message}
                            </p>
                          </div>
                          <Badge variant={aiStatus.state === "unavailable" ? "destructive" : aiStatus.state === "available" ? "default" : "secondary"}>
                            {aiStatus.state === "checking" ? "Тексерілуде" : aiStatus.state === "available" ? "Қолжетімді" : "Қолжетімсіз"}
                          </Badge>
                        </div>
                        {aiStatus.model && (
                          <p className="text-xs text-muted-foreground mt-2">Model: {aiStatus.model}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-5 shadow-card">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-foreground">AI жауап режимі</h2>
                        <p className="text-sm text-muted-foreground">Толық жауап қайтару күйі</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="rounded-lg border border-border p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">Жауап форматы</p>
                            <p className="text-xs text-muted-foreground mt-1">Streaming емес, толық мәтін бірден қайтады</p>
                          </div>
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">Белсенді</span>
                        </div>
                      </div>

                      <div className="rounded-lg bg-secondary/50 p-4">
                        <p className="text-sm text-foreground font-medium">Қолданыс</p>
                        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                          <li>• Чат жауаптары толық мәтін болып келеді</li>
                          <li>• Дәрі іздеу нәтижесі толық дайын күйде шығады</li>
                          <li>• Админ ғана осы бөлімді көре алады</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default AdminPage;
