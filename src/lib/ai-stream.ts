import { analyzeSymptomConsultation, SymptomAnalysisResult } from "./kz-protocol-service";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

type Msg = { role: "user" | "assistant"; content: string };

export async function streamChat({
  messages,
  mode,
  accessToken,
  onDelta,
  onUsage,
  onDone,
  onError,
}: {
  messages: Msg[];
  mode: string;
  accessToken?: string;
  onDelta: (text: string) => void;
  onUsage?: (usage: {
    remaining: number | null;
    resetAt?: string | null;
    windowHours?: number | null;
    limitExhaustedAt?: string | null;
  }) => void;
  onDone: () => void;
  onError: (err: string) => void;
}) {
  let analysis: SymptomAnalysisResult | null = null;
  let protocolContext = "";

  // For medical mode: first consult the official Kazakhstan Clinical Protocols
  if (mode === "medical") {
    try {
      const lastUser = [...messages].reverse().find((m) => m.role === "user");
      const priorHistory = messages.filter((m) => m !== lastUser);
      if (lastUser?.content) {
        analysis = await analyzeSymptomConsultation(lastUser.content, priorHistory);

        // Branch 1: Красные флаги (опасно? сразу стоп) -> Срочно к врачу (Скорая 103 / 112)
        if (analysis.stage === "emergency" || analysis.isEmergency) {
          onDelta(analysis.formattedResponse);
          onDone();
          return;
        }

        // Branch 3: Вопросы кончились -> Нужен осмотр (Вопросы кончились)
        // Тек хаттамалар талданып, нақтылау сұрақтары біткен жағдайда ғана осы хабарламаны көрсетеміз
        if (analysis.stage === "exam_needed" && analysis.candidateProtocols.length > 0) {
          onDelta(analysis.formattedResponse);
          onDone();
          return;
        }

        if (analysis.candidateProtocols.length > 0) {
          if (analysis.stage === "clarification") {
            protocolContext = `ҚР ДЕНСАУЛЫҚ САҚТАУ МИНИСТРЛІГІНІҢ КЛИНИКАЛЫҚ ХАТТАМАЛАРЫ БОЙЫНША АҚПАРАТ:
Ықтимал ұқсас хаттамалар: ${analysis.candidateProtocols
              .slice(0, 3)
              .map((p) => `«${p.name}» (${p.icd10.split(",")[0] || ""})`)
              .join(", ")}.

КЕЗЕҢДІК АРХИТЕКТУРА ТАЛАПТАРЫ:
Кезең: ЭТАП 2: Уточнить диагноз (нет: ещё вопрос).
1. Сенімділік шегі әлі жиналмаған (порог набран емес).
2. Диагнозды нақты ажырату үшін науқасқа 3-4 нақтылау сұрағын қой (ауырсынудың нақты қай жерде екені, сипаты, басталған уақыты, қосымша белгілер).
3. ҚАТАҢ ТАЛАП: Бұл кезеңде ешқандай ауруға түпкілікті диагноз қойма және ешқандай нақты хаттаманың сілтемесін БЕРМЕ. Тек сұрақ қой.`;
          } else if (analysis.stage === "exam_needed") {
            protocolContext = `ҚР ДЕНСАУЛЫҚ САҚТАУ МИНИСТРЛІГІНІҢ КЛИНИКАЛЫҚ ХАТТАМАЛАРЫ БОЙЫНША АҚПАРАТ:
КЕЗЕҢДІК АРХИТЕКТУРА ТАЛАПТАРЫ:
Кезең: ЭТАП 2: Порог жеткіліксіз -> Нужен осмотр (Вопросы кончились).
1. Нақтылау сұрақтарынан кейін де симптомдар бірнеше хаттамаға ұқсас және нақты бір диагноз қоюға сенімділік шегі жеткіліксіз.
2. ҚР қауіпсіздік талабы бойынша бұл кезеңде өз бетіңше диагноз қойма және ешқандай нақты хаттаманың сілтемесін БЕРМЕ.
3. Науқасқа очный осмотр үшін дәрігерге (терапевтке) қаралу керектігін айт және диагностикалық минимумды (қан/зәр талдауы, УЗИ) тапсыруды ұсын.`;
          } else if (analysis.stage === "protocol_answer" && analysis.primaryProtocol) {
            const primary = analysis.primaryProtocol;
            protocolContext = `ҚР ДЕНСАУЛЫҚ САҚТАУ МИНИСТРЛІГІНІҢ ТАҢДАЛҒАН ЖАЛҒЫЗ РЕСМИ КЛИНИКАЛЫҚ ХАТТАМАСЫ (MEDELEMENT):
• ХАТТАМА АТАУЫ: «${primary.name}» (${primary.version})
• МКБ-10 КОДЫ: ${primary.icd10}
• РЕСМИ MEDELEMENT СІЛТЕМЕСІ: ${primary.url}
• НЕГІЗГІ ШАҒЫМДАРЫ («Жалобы и анамнез»): ${primary.complaints}
• ЕМДЕУ ТАКТИКАСЫ: ${primary.treatment}
• ҚАУІП БЕЛГІЛЕРІ / ГОСПИТАЛИЗАЦИЯ: ${primary.emergency}
• ТАЛДАУЛАР: ${primary.confirm_tests?.join(", ") || "Жалпы талдаулар"}

КЕЗЕҢДІК АРХИТЕКТУРА ТАЛАПТАРЫ:
Кезең: ЭТАП 3: Ответ по протоколу (порог набран).
1. Сен ТЕК осы «${primary.name}» (${primary.icd10}) хаттамасы бойынша кеңес бересің. Басқа ауруды айтуға ТЫЙЫМ САЛЫНАДЫ.
2. Протоколдың шағымдары мен емдеу бағытын дәл осы мәліметтерге сүйеніп түсіндір. Дәрілердің нақты дозасын тек дәрігер белгілейтінін ескерт («Проверка цифр»).
3. Жауаптың соңында міндетті түрде дәрігерге қаралу керектігін ескерт («Безопасный ответ: к врачу») және нақты осы протоколдың сілтемесін көрсет:
[«${primary.name}» — MedElement ресми хаттамасы](${primary.url})`;
          }
        } else {
          // Пайдаланушының сұранысына жергілікті дерекқордан тікелей хаттама табылмағанда AI-ға еркін, сыпайы әрі қауіпсіз жауап беру нұсқаулығы
          protocolContext = `ҚР ДЕНСАУЛЫҚ САҚТАУ МИНИСТРЛІГІНІҢ КЛИНИКАЛЫҚ ХАТТАМАЛАРЫ БОЙЫНША АҚПАРАТ:
1. Бұл сұраныс бойынша жергілікті дерекқордан тікелей сәйкес келетін нақты хаттама табылмады (сұрақ жалпы медициналық, салауатты өмір салты, дәрумендер, сәлемдесу немесе сипаттама аз).
2. Пайдаланушымен мейірімді, сыпайы және кәсіби дәрігер AIZHAN ретінде тіл табыс. Егер сәлемдессе — жылы амандасып, денсаулығы бойынша қандай сұрақ мазалап тұрғанын сұра.
3. Егер симптомдар немесе шағымдар айтылса — жалпы медициналық қауіпсіз түсінік беріп, жағдайын нақтылайтын 2-3 сұрақ қой және нақты диагноз үшін учаскелік терапевтке/бейінді дәрігерге қаралуды ұсын.
4. Қатаң рецептуралық дәрілерді өз бетіңше тағайындама, қауіпсіздік талаптарын сақта.`;
        }
      }
    } catch (e) {
      console.warn("Protocol analysis pre-pass error:", e);
    }
  }

  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages, mode, protocolContext }),
    });

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));

      // If user hit the question quota, notify with error so Pro modal opens
      if (resp.status === 402 || data.code === "FREE_LIMIT_REACHED") {
        onError(data.error || `Қате: ${resp.status}`);
        return;
      }

      // If 401 Unauthorized, clearly notify user to log in
      if (resp.status === 401) {
        onError(data.error || "Сұрақ қою үшін алдымен жүйеге кіріңіз.");
        return;
      }

      // If upstream AI provider is unavailable, fallback to local KZ Protocol analysis ONLY IF candidates exist
      if (mode === "medical" && analysis?.formattedResponse && analysis.candidateProtocols.length > 0) {
        onDelta(analysis.formattedResponse);
        onDone();
        return;
      }

      onError(data.error || `Қате: ${resp.status}`);
      return;
    }

    const data = await resp.json().catch(() => ({}));
    let content = typeof data.content === "string" ? data.content : "";
    if (!content) {
      if (mode === "medical" && analysis?.formattedResponse) {
        onDelta(analysis.formattedResponse);
        onDone();
        return;
      }
      onError("Жауап бос қайтты");
      return;
    }

    // Strict Protocol Synchronization for medical mode
    if (mode === "medical") {
      if (analysis?.stage === "protocol_answer" && analysis.primaryProtocol) {
        const primary = analysis.primaryProtocol;
        // Synchronize all MedElement markdown links to primary protocol title and URL
        content = content.replace(
          /\[[^\]]*\]\(https:\/\/diseases\.medelement\.com\/disease\/[^\s)>\]]+\)/g,
          `[«${primary.name}» — MedElement ресми хаттамасы](${primary.url})`
        );
        // Synchronize any remaining bare URLs
        const medUrlRegex = /https:\/\/diseases\.medelement\.com\/disease\/[^\s)>\]]+/g;
        content = content.replace(medUrlRegex, primary.url);

        // Ensure official verified protocol markdown link is present at bottom
        const officialLink = `\n\n---\n🔗 **Ресми ҚР Клиникалық протоколына сілтеме:**\n[«${primary.name}» — MedElement ресми хаттамасы](${primary.url})`;
        if (!content.includes(primary.url)) {
          content += officialLink;
        }
      } else if (analysis?.stage === "clarification" || analysis?.stage === "exam_needed") {
        // Strip any premature or hallucinated protocol link in clarification / exam_needed phase
        content = content.replace(/\[[^\]]*\]\(https:\/\/diseases\.medelement\.com\/disease\/[^\s)>\]]+\)/g, "");
        content = content.replace(/https:\/\/diseases\.medelement\.com\/disease\/[^\s)>\]]+/g, "");
        content = content.replace(/---\s*🔗\s*\*\*Ресми ҚР Клиникалық протоколына сілтеме:\*\*[\s\S]*$/gi, "").trim();
      }
    }

    onDelta(content);
    if (data.usage) {
      onUsage?.(data.usage);
    }

    onDone();
  } catch (e) {
    if (mode === "medical" && analysis?.formattedResponse && analysis.candidateProtocols.length > 0) {
      onDelta(analysis.formattedResponse);
      onDone();
      return;
    }
    const msg = e instanceof Error ? e.message : "Желі қатесі";
    onError(`AI-мен байланыс қатесі: ${msg}`);
  }
}
