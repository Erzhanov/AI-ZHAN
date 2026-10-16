import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  Bot,
  User,
  Stethoscope,
  Brain,
  Smile,
  Apple,
  Dumbbell,
  ChevronDown,
  Copy,
  Check,
  Crown,
  CreditCard,
  Zap,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  FileText,
  Infinity as InfinityIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { streamChat } from "@/lib/ai-stream";
import { useToast } from "@/hooks/use-toast";
import ChatMessageContent from "@/components/ChatMessageContent";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProStatus } from "@/hooks/use-pro-status";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

type ChatMode = "medical" | "psychology" | "motivation" | "nutrition" | "fitness";

const modes = [
  { id: "medical" as ChatMode, label: "Медицина", icon: Stethoscope },
  { id: "psychology" as ChatMode, label: "Психология", icon: Brain },
  { id: "motivation" as ChatMode, label: "Мотивация", icon: Smile },
  { id: "nutrition" as ChatMode, label: "Тамақ", icon: Apple },
  { id: "fitness" as ChatMode, label: "Фитнес", icon: Dumbbell },
];

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<ChatMode>("medical");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { isPro, loading: proLoading } = useProStatus();
  const [remainingQuestions, setRemainingQuestions] = useState<number | null>(null);
  const [limitResetAt, setLimitResetAt] = useState<string | null>(null);
  const [proDialogOpen, setProDialogOpen] = useState(false);
  const [limitDialogShown, setLimitDialogShown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user, session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const loadUsage = async () => {
      const { data: usage } = await supabase
        .from("ai_usage_limits")
        .select("window_started_at, used_count, limit_exhausted_at")
        .eq("user_id", user.id)
        .maybeSingle();

      let windowStartedAt: number | null = null;
      if (usage?.window_started_at) {
        const parsed = new Date(usage.window_started_at).getTime();
        if (!isNaN(parsed)) windowStartedAt = parsed;
      }

      const resetAt = windowStartedAt ? new Date(windowStartedAt + 12 * 60 * 60 * 1000) : null;
      const windowExpired = resetAt ? resetAt.getTime() <= Date.now() : false;

      setRemainingQuestions(isPro || windowExpired ? (isPro ? null : 5) : Math.max(5 - (usage?.used_count || 0), 0));
      setLimitResetAt(isPro || windowExpired ? null : resetAt && !isNaN(resetAt.getTime()) ? resetAt.toISOString() : null);
    };

    void loadUsage();

    return () => {
      isMounted = false;
    };
  }, [user, isPro]);

  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === "function") {
      try {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      } catch {
        // Safe fallback in environments lacking smooth scroll
        messagesEndRef.current.scrollIntoView();
      }
    }
  }, [messages]);

  useEffect(() => {
    if (!isPro && !proLoading && remainingQuestions === 0 && !limitDialogShown) {
      setProDialogOpen(true);
      setLimitDialogShown(true);
    }
  }, [isPro, proLoading, limitDialogShown, remainingQuestions]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const normalizedText = text.trim();

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: normalizedText,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      await streamChat({
        messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        mode,
        accessToken: session?.access_token,
        onDelta: (content) => {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            const assistantMessage = {
              id: (Date.now() + 1).toString(),
              role: "assistant" as const,
              content,
              timestamp: new Date(),
            };

            if (last?.role === "assistant") {
              return prev.map((m, i) => (i === prev.length - 1 ? assistantMessage : m));
            }

            return [...prev, assistantMessage];
          });
        },
        onUsage: (usage) => {
          setRemainingQuestions(usage.remaining);
          setLimitResetAt(usage.resetAt ?? null);
          if (!isPro && !proLoading && usage.remaining === 0) {
            setProDialogOpen(true);
            setLimitDialogShown(true);
          }
        },
        onDone: () => {
          setIsLoading(false);
        },
        onError: (err) => {
          toast({ title: "AI қатесі", description: err, variant: "destructive" });
          if (!isPro && !proLoading && err.includes("лимит")) {
            setRemainingQuestions(0);
            setProDialogOpen(true);
            setLimitDialogShown(true);
          }
          setIsLoading(false);
        },
      });
    } catch {
      toast({ title: "Қате", description: "AI қызметімен байланыс орнатылмады", variant: "destructive" });
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleCopy = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(messageId);
      toast({ title: "Көшірілді", description: "Жауап көшіріліп алынды." });
      setTimeout(() => setCopiedId((current) => (current === messageId ? null : current)), 1500);
    } catch {
      toast({ title: "Қате", description: "Көшіру мүмкін болмады", variant: "destructive" });
    }
  };

  const modeInfo = modes.find((m) => m.id === mode) || modes[0];
  const ModeIcon = modeInfo.icon;
  const resetTimeLabel = limitResetAt
    ? (() => {
        try {
          const d = new Date(limitResetAt);
          return isNaN(d.getTime())
            ? null
            : d.toLocaleString("kk-KZ", {
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              });
        } catch {
          return null;
        }
      })()
    : null;
  return (
    <Layout>
      <div className="pb-20 md:pb-4">
        <section className="surface-soft overflow-hidden rounded-3xl border border-border/80 ring-soft">
          <div className="border-b border-border/80 px-4 py-3 sm:px-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-medical shadow-card">
                  <ModeIcon className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-sm font-semibold text-foreground">{modeInfo.label}</h1>
                    {mode === "medical" && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        ҚР Хаттамалары (MedElement)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {mode === "medical"
                      ? "1185 клиникалық хаттама негізінде"
                      : "Сұрағыңызды қысқа жазыңыз"}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <div className={`hidden items-center gap-2 rounded-xl border px-3 py-2 text-xs sm:flex ${isPro ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200" : "border-border/80 bg-card text-muted-foreground"}`}>
                  <Crown className="h-4 w-4" />
                  {isPro ? "Pro: лимитсіз" : `${remainingQuestions ?? 5}/5 қалды`}
                </div>
                {!isPro && (
                  <Button type="button" variant="outline" onClick={() => navigate("/pro")} className="h-10 rounded-xl border-border/80 bg-card px-3 text-xs">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pro
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="min-h-[58vh] space-y-4 px-3 py-4 sm:min-h-[55vh] sm:px-5 sm:py-5">
            {messages.length === 0 ? (
              <div className="flex min-h-[45vh] flex-col items-center justify-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-medical shadow-card">
                  <ModeIcon className="h-5 w-5 text-primary-foreground" />
                </div>
                {mode === "medical" ? (
                  <>
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      ҚР 1187 Клиникалық хаттамасы базасы (MedElement)
                    </div>
                    <p className="mt-3 text-base font-semibold text-foreground">
                      Медициналық AI: ҚР Протоколдары бойынша кеңес
                    </p>
                    <p className="mt-2 max-w-lg text-xs leading-5 text-muted-foreground sm:text-sm">
                      Симптомдарыңызды жазыңыз. AI хаттаманың «Жалобы и анамнез» бөлімін зерттеп, жынысыңызға сай нақтылайтын сұрақтар қояды және сәйкес келетін хаттаманы ресми сілтемесімен ұсынады.
                    </p>
                    <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar py-1 px-1 -mx-1 sm:flex-wrap sm:justify-center">
                      {[
                        "Басым қатты ауырып жатыр",
                        "Оң жақ қабырға астым шаншып ауырады",
                        "Баламның қызуы 38.5, жөтел басталды",
                        "Жүктіліктің 32-аптасы, басым бұлдырап тұр",
                        "Белім мен бүйрегім сыздап ауырып тұр",
                      ].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => sendMessage(chip)}
                          className="inline-flex shrink-0 items-center rounded-full border border-border/80 bg-card px-3.5 py-2 text-xs font-medium text-foreground shadow-sm transition-all hover:border-primary/50 hover:bg-secondary active:scale-95"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mt-4 text-sm font-semibold text-foreground">Сұрағыңызды төменге жазыңыз</p>
                    <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                      Мысалы: "басым ауырып тұр", "дәрі туралы айт", "күйзелісім көбейіп кетті".
                    </p>
                  </>
                )}

                {isPro && (
                  <div className="mt-6 grid w-full max-w-lg gap-3 sm:grid-cols-2">
                    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5 text-left dark:border-amber-500/20 dark:bg-amber-500/5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/15">
                        <InfinityIcon className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">Лимитсіз сұрақ</p>
                        <p className="mt-0.5 text-[11px] leading-4 text-amber-700/80 dark:text-amber-300/70">Қанша қойсаңыз да — шектеу жоқ</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5 text-left dark:border-amber-500/20 dark:bg-amber-500/5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/15">
                        <Zap className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">Күшті AI режимі</p>
                        <p className="mt-0.5 text-[11px] leading-4 text-amber-700/80 dark:text-amber-300/70">Тереңірек, толық жауаптар</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5 text-left dark:border-amber-500/20 dark:bg-amber-500/5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/15">
                        <ShieldCheck className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">Қауіпсіз кеңес</p>
                        <p className="mt-0.5 text-[11px] leading-4 text-amber-700/80 dark:text-amber-300/70">Қауіп белгілерін ескертеді</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5 text-left dark:border-amber-500/20 dark:bg-amber-500/5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/15">
                        <Sparkles className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">Pro артықшылық</p>
                        <p className="mt-0.5 text-[11px] leading-4 text-amber-700/80 dark:text-amber-300/70">Барлық режимде басымдылық</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg gradient-medical shadow-card">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                  <div className={`max-w-[90%] rounded-2xl px-3.5 py-3 text-sm leading-6 sm:max-w-[85%] sm:px-4 ${msg.role === "user" ? "gradient-medical text-primary-foreground shadow-card" : "border border-border/80 bg-card text-foreground shadow-card"}`}>
                    {msg.role === "assistant" ? (
                      <>
                        <ChatMessageContent content={msg.content} />
                        {(() => {
                          const linkMatch = msg.content.match(
                            /\[(.*?) — MedElement[^\]]*\]\((https:\/\/diseases\.medelement\.com\/disease\/[^\s)>\]]+)\)/
                          );
                          const bareUrlMatch = msg.content.match(
                            /https:\/\/diseases\.medelement\.com\/disease\/[^\s)>\]]+/
                          );
                          const protocolUrl = linkMatch ? linkMatch[2] : bareUrlMatch ? bareUrlMatch[0] : null;
                          if (!protocolUrl) return null;

                          const rawTitle = linkMatch ? linkMatch[1].replace(/^[«"']+|[»"']+$/g, "").trim() : "";
                          const protocolName = rawTitle || "ҚР Клиникалық протоколы";

                          return (
                            <div className="mt-3 rounded-2xl border border-primary/20 bg-primary/5 p-3 text-left">
                              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <FileText className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-xs font-semibold text-foreground truncate max-w-[280px] sm:max-w-[360px]" title={protocolName}>
                                        «{protocolName}»
                                      </span>
                                      <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary shrink-0">
                                        MedElement
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                      ҚР Денсаулық сақтау министрлігінің ресми стандарты
                                    </p>
                                  </div>
                                </div>
                                <a
                                  href={protocolUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center gap-1.5 rounded-xl gradient-medical px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition hover:opacity-95 shrink-0"
                                >
                                  <span>Хаттаманы ашу</span>
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </div>
                            </div>
                          );
                        })()}
                        <div className="mt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-card/80 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                          >
                            {copiedId === msg.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            {copiedId === msg.id ? "Көшірілді" : "Көшіру"}
                          </button>
                        </div>
                      </>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-secondary shadow-card">
                      <User className="h-4 w-4 text-foreground" />
                    </div>
                  )}
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-medical shadow-card">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="rounded-2xl border border-border/80 bg-card px-4 py-3 text-sm text-muted-foreground shadow-card">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="typing-dot" />
                    <span className="typing-dot typing-dot-delay-1" />
                    <span className="typing-dot typing-dot-delay-2" />
                  </div>
                  <p className="typing-text">Жауап дайындалуда...</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="sticky bottom-14 md:bottom-0 border-t border-border/80 bg-background/95 px-2.5 py-2.5 backdrop-blur-xl supports-[backdrop-filter]:bg-background/85 sm:px-5">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={!isPro && remainingQuestions === 0 ? "Лимит бітті" : "Сұрағыңызды жазыңыз..."}
                className="h-11 rounded-2xl border-border/80 bg-card text-base sm:text-sm px-3.5 shadow-sm focus-visible:ring-primary"
                disabled={isLoading || (!isPro && remainingQuestions === 0)}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" className="h-11 shrink-0 rounded-2xl border-border/80 bg-card gap-1.5 px-3 text-xs sm:text-sm shadow-sm active:scale-95 transition-transform">
                    <span className="hidden sm:inline">{modeInfo.label}</span>
                    <ModeIcon className="h-4 w-4 sm:hidden" />
                    <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {modes.map((m) => {
                    const Icon = m.icon;
                    const active = mode === m.id;

                    return (
                      <DropdownMenuItem
                        key={m.id}
                        onClick={() => {
                          setMode(m.id);
                          setMessages([]);
                        }}
                        className={`flex items-center gap-2 ${active ? "bg-secondary" : ""}`}
                      >
                        <Icon className="h-4 w-4 text-primary" />
                        <span>{m.label}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button type="submit" disabled={!input.trim() || isLoading || (!isPro && remainingQuestions === 0)} className="h-11 w-11 shrink-0 rounded-xl gradient-medical text-primary-foreground shadow-card">
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="mt-2 text-xs text-muted-foreground">
              {isPro ? (
                <span className="inline-flex items-center gap-1.5">
                  <Crown className="inline h-3 w-3 text-amber-600 dark:text-amber-400" />
                  <span className="font-medium text-amber-700 dark:text-amber-300">Pro режимі</span>
                  <span>— лимитсіз сұрақ, толық жауап, басым өңдеу.</span>
                </span>
              ) : (
                <>{`Тегін режим: 12 сағатқа 5 сұрақ, қысқа жауаптар. Қалды: ${remainingQuestions ?? 5}. `}
                {remainingQuestions === 0 && resetTimeLabel ? `Жаңа лимит: ${resetTimeLabel}. ` : ""}</>
              )}
              {" "}AI нақты диагноз қоймайды. Ауыр жағдайда дәрігерге жүгініңіз.
            </p>
          </div>
        </section>
      </div>

      <Dialog open={proDialogOpen} onOpenChange={setProDialogOpen}>
        <DialogContent className="max-w-[92vw] rounded-3xl border-border/80 p-5 sm:max-w-md sm:p-6">
          <DialogHeader className="text-left">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200">
              <Crown className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl leading-7">Лимит бітті</DialogTitle>
            <DialogDescription className="leading-6">
              Қарапайым пайдаланушыларға 12 сағатқа 5 сұрақ беріледі. {resetTimeLabel ? `Жаңа лимит ${resetTimeLabel} уақытында ашылады. ` : ""}Pro-ға өтсеңіз, AI-ды лимитсіз қолданып, толық әрі терең жауап аласыз.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl border border-border/80 bg-secondary/40 p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium">AIZHAN Pro</span>
              <span className="font-semibold text-primary">4990 тг / ай</span>
            </div>
            <p className="mt-2 text-muted-foreground">Лимитсіз сұрақ, толық жауап, күшті AI режимі.</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setProDialogOpen(false)} className="rounded-2xl">
              Кейін
            </Button>
            <Button onClick={() => {
              const msg = encodeURIComponent("Сәлем! Мен сайттан келдім маған PRO версиясы керек.");
              window.open(`https://wa.me/77057812935?text=${msg}`, "_blank");
            }} className="rounded-2xl bg-[#25D366] hover:bg-[#1fb855] text-white">
              <Send className="mr-2 h-4 w-4" />
              WhatsApp арқылы Pro алу
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default ChatPage;
