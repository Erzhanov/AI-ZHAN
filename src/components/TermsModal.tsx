import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export const TermsModal = ({ onAccepted }: { onAccepted: () => void }) => {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleAccept = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ terms_accepted_at: new Date().toISOString() })
      .eq("user_id", user.id);
    
    if (error) {
      toast({ title: "Қате", description: "Келісімді сақтау кезінде қате шықты", variant: "destructive" });
      setLoading(false);
      return;
    }
    onAccepted();
  };

  return (
    <Dialog open modal>
      <DialogContent
        className="sm:max-w-md max-h-[90vh] flex flex-col"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        // Hide close button
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            Пайдаланушылық келісім
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Жалғастырмас бұрын төмендегі шарттармен танысыңыз
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 max-h-[50vh] border rounded-lg p-4 overflow-y-auto">
          <div className="space-y-4 text-sm text-foreground/90 pr-1">
            <section>
              <h3 className="font-semibold text-base mb-2">1. AI қызметі туралы ескерту</h3>
              <p>
                Бұл қосымша жасанды интеллект (AI) технологиясын пайдаланады. AI арқылы берілетін барлық жауаптар тек ақпараттық және анықтамалық мақсатта ұсынылады және{" "}
                <strong>медициналық кеңес, диагноз немесе емдеу нұсқаулығы болып табылмайды</strong>.
              </p>
              <p className="mt-2">
                AI — кәсіби дәрігердің орнын алмастырмайды. Денсаулығыңызға қатысты кез келген шешімді тек білікті медицина маманымен кеңесе отырып қабылдаңыз.
              </p>
              <p className="mt-2">
                AI жүйесі кейбір жағдайларда қате, толық емес немесе ескірген ақпарат беруі мүмкін. Сондықтан ұсынылған ақпаратқа толық сенуге болмайды және оны тексеру қажет.
              </p>
              <p className="mt-2 font-semibold text-destructive">
                Шұғыл медициналық жағдай туындаған жағдайда дереу жедел жәрдем шақырыңыз немесе жақын маңдағы медициналық мекемеге жүгініңіз.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">2. Жеке деректерді жинау және өңдеу</h3>
              <p>Қосымша қызмет көрсету сапасын қамтамасыз ету үшін келесі деректерді жинауы және өңдеуі мүмкін:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Тіркелу деректері (аты-жөні, email мекенжайы)</li>
                <li>Пайдаланушы енгізген сұрақтар және AI жауаптары (чат тарихы)</li>
                <li>Дәрі-дәрмек іздеу және қарау тарихы</li>
                <li>Құрылғы туралы ақпарат (IP мекенжайы, құрылғы түрі, операциялық жүйе, браузер)</li>
                <li>Қолдану статистикасы және әрекеттер</li>
              </ul>
              <p className="mt-2">
                Жиналған деректер <strong>Қазақстан Республикасының «Дербес деректер және оларды қорғау туралы» Заңына</strong>, сондай-ақ халықаралық{" "}
                <strong>GDPR (General Data Protection Regulation)</strong> талаптарына сәйкес өңделеді.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">3. Деректерді өңдеу мақсаты</h3>
              <p>Жиналған деректер келесі мақсаттарда пайдаланылады:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>AI қызметін көрсету және оның сапасын жақсарту</li>
                <li>Жауаптардың дәлдігін арттыру және жүйені үйрету</li>
                <li>Пайдаланушы тәжірибесін жақсарту</li>
                <li>Қауіпсіздікті қамтамасыз ету және алаяқтықтың алдын алу</li>
                <li>Техникалық ақауларды анықтау және түзету</li>
              </ul>
              <p className="mt-2">Деректеріңіз жоғарыда көрсетілген мақсаттардан тыс қолданылмайды.</p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">4. Деректерді сақтау және қорғау</h3>
              <p>Сіздің деректеріңіз заманауи қауіпсіздік стандарттарына сәйкес қорғалған серверлерде сақталады.</p>
              <p className="mt-2">Біз келесі шараларды қолданамыз:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Деректерді шифрлау (encryption)</li>
                <li>Қауіпсіз серверлік инфрақұрылым</li>
                <li>Рұқсат деңгейлерін шектеу</li>
                <li>Мониторинг және қауіпсіздік бақылауы</li>
              </ul>
              <p className="mt-2">
                Сіздің деректеріңіз <strong>үшінші тұлғаларға сатылмайды</strong> және заңсыз таратылмайды.
                Деректер тек AI қызметін қамтамасыз ететін сенімді серіктестерге (серверлерге) жіберілуі мүмкін.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">5. Cookies және аналитика</h3>
              <p>Қосымша сіздің тәжірибеңізді жақсарту үшін cookies және аналитикалық құралдарды қолдануы мүмкін.</p>
              <p className="mt-2">Бұл деректер:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Сайтты қалай қолданатыныңызды талдау</li>
                <li>Жүйені жақсарту</li>
                <li>Қателерді анықтау</li>
              </ul>
              <p className="mt-2">
                Cookies қолдануды браузер баптаулары арқылы өшіруге болады, бірақ бұл кейбір функциялардың дұрыс жұмыс істемеуіне әкелуі мүмкін.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">6. Пайдаланушының құқықтары</h3>
              <p>Сіз келесі құқықтарға ие боласыз:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Өз деректеріңізге қолжетімділік алу</li>
                <li>Қате деректерді түзету</li>
                <li>Деректерді жоюды талап ету</li>
                <li>Деректерді өңдеуге берген келісімді қайтарып алу</li>
                <li>Деректердің көшірмесін алу (экспорт)</li>
              </ul>
              <p className="mt-2">
                Бұл құқықтарды жүзеге асыру үшін профиль бөліміне өтіңіз немесе қолдау қызметіне хабарласыңыз.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">7. Жауапкершілік шектеулері</h3>
              <p>Қосымшаны пайдалану арқылы сіз келесімен келісесіз:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>AI берген ақпарат тек ұсыныстық сипатта</li>
                <li>Қосымша медициналық шешімдер үшін жауап бермейді</li>
                <li>Қате немесе толық емес ақпарат болуы мүмкін</li>
                <li>Қосымшаны пайдалану тәуекелі пайдаланушының өзіне жүктеледі</li>
              </ul>
              <p className="mt-2">
                AI берген ақпаратты тексерусіз нақты әрекеттерге негіз ретінде пайдалануға болмайды.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">8. Қызметті өзгерту және жаңарту</h3>
              <p>Қосымша кез келген уақытта:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Қызмет шарттарын өзгертуге</li>
                <li>Функцияларды жаңартуға немесе шектеуге</li>
                <li>Қызметті уақытша тоқтатуға</li>
              </ul>
              <p className="mt-2">құқылы. Маңызды өзгерістер болған жағдайда пайдаланушыға хабарланады.</p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">9. Келісімді қабылдау</h3>
              <p>
                Қосымшаны пайдалану арқылы сіз осы Пайдаланушылық келісімнің барлық шарттарымен толық келісесіз.
              </p>
              <p className="mt-2">
                Егер сіз осы шарттармен келіспесеңіз, қосымшаны пайдалануды тоқтатуыңыз қажет.
              </p>
            </section>
          </div>
        </div>

        <div className="flex items-start gap-3 mt-2">
          <Checkbox
            id="terms-agree"
            checked={agreed}
            onCheckedChange={(v) => setAgreed(v === true)}
            className="mt-0.5"
          />
          <label htmlFor="terms-agree" className="text-sm cursor-pointer select-none">
            Мен жоғарыдағы шарттармен таныстым және келісемін
          </label>
        </div>

        <Button
          onClick={handleAccept}
          disabled={!agreed || loading}
          className="w-full mt-2"
        >
          {loading ? "Сақталуда..." : "Жалғастыру"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
