import React, { useState } from "react";
import { Layout } from "@Web/Component/Layout/Index";
import { 
  ChevronLeft, 
  ChevronRight, 
  Check 
} from "lucide-react";
import { Button } from "@Web/Component/UI/Button";
import { Container } from "@Web/Component/UI/Container";

const NISAB_GOLD_GRAMS = 87.48;
const NISAB_SILVER_GRAMS = 612.36;
const ZAKAT_RATE = 0.025;

type Wizard_Step = 1 | 2 | 3 | 4 | 5;

const ZakatCalculatorPage = () => {
  const [Step, Set_Step] = useState<Wizard_Step>(1);
  
  // Wealth Inputs
  const [goldPrice, setGoldPrice] = useState(70);
  const [silverPrice, setSilverPrice] = useState(0.85);
  const [cash, setCash] = useState(0);
  const [savings, setSavings] = useState(0);
  const [goldValue, setGoldValue] = useState(0);
  const [silverValue, setSilverValue] = useState(0);
  const [investments, setInvestments] = useState(0);
  const [debts, setDebts] = useState(0);

  const totalWealth = cash + savings + investments + goldValue + silverValue;
  const netWealth = Math.max(0, totalWealth - debts);
  const nisabGold = NISAB_GOLD_GRAMS * goldPrice;
  const nisabSilver = NISAB_SILVER_GRAMS * silverPrice;
  const nisab = Math.min(nisabGold, nisabSilver);
  const zakatDue = netWealth >= nisab ? netWealth * ZAKAT_RATE : 0;

  const resetCalculator = () => {
    Set_Step(1);
    setCash(0);
    setSavings(0);
    setGoldValue(0);
    setSilverValue(0);
    setInvestments(0);
    setDebts(0);
  };

  // Base input class - removed focus:border-primary to stop the green border
  const inputBaseClass = "w-full px-6 py-3 rounded-[40px] bg-white dark:bg-black border-2 border-black dark:border-white text-sm font-bold outline-none transition-colors focus:ring-0 focus:ring-offset-0";

  return (
    <Layout>
      <div className="Container max-w-md mx-auto p-0 sm:py-12 sm:px-4 select-none">
        <Container className="flex flex-col items-center min-h-[580px] !p-0 sm:!p-8">
          <div className="w-full px-6 flex-grow flex flex-col pt-2">
            
            {/* Step Indicator */}
            <div className="flex items-center justify-center mb-8 mt-4">
              {[1, 2, 3, 4, 5].map((s, Index) => {
                const Is_Current = Step === s;
                return (
                  <React.Fragment key={s}>
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all Duration-300 border-2
                      ${Is_Current 
                        ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white" 
                        : Step > s 
                          ? "bg-[rgb(128,128,128)] border-[rgb(128,128,128)] text-white" 
                          : "bg-transparent border-black/20 dark:border-white/20 text-muted-foreground"
                      }
                    `}>
                      {Step > s ? <Check className="h-4 w-4" /> : s}
                    </div>
                    {Index < 4 && (
                      <div className={`h-[2px] transition-all Duration-500 ease-in-out ${
                        Is_Current ? "bg-black dark:bg-white w-12 mx-2" : "bg-muted/30 w-4 mx-1"
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Content Area - Keyed by Step to prevent re-renders on input but allow Step animations */}
            <div className="flex-grow space-y-6" key={`Step-${Step}`}>
              {Step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 Duration-300">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold ml-4 text-muted-foreground">Gold price/g ($)</label>
                    <input
                      type="number"
                      value={goldPrice || ""}
                      On_Change={(e) => setGoldPrice(Number(e.target.value))}
                      className={inputBaseClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold ml-4 text-muted-foreground">Silver price/g ($)</label>
                    <input
                      type="number"
                      value={silverPrice || ""}
                      On_Change={(e) => setSilverPrice(Number(e.target.value))}
                      className={inputBaseClass}
                    />
                  </div>
                  <div className="text-center p-6 border-2 border-dashed border-black/10 dark:border-white/10 rounded-[40px] mt-4">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Nisab Threshold</p>
                    <p className="text-3xl font-bold tabular-nums">${nisab.toFixed(2)}</p>
                  </div>
                </div>
              )}

              {Step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 Duration-300">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold ml-4 text-muted-foreground">Cash in Hand ($)</label>
                    <input
                      type="number"
                      value={cash || ""}
                      On_Change={(e) => setCash(Number(e.target.value) || 0)}
                      placeholder="0.00"
                      className={inputBaseClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold ml-4 text-muted-foreground">Bank Savings ($)</label>
                    <input
                      type="number"
                      value={savings || ""}
                      On_Change={(e) => setSavings(Number(e.target.value) || 0)}
                      placeholder="0.00"
                      className={inputBaseClass}
                    />
                  </div>
                </div>
              )}

              {Step === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 Duration-300">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold ml-4 text-muted-foreground">Gold Value ($)</label>
                    <input
                      type="number"
                      value={goldValue || ""}
                      On_Change={(e) => setGoldValue(Number(e.target.value) || 0)}
                      placeholder="0.00"
                      className={inputBaseClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold ml-4 text-muted-foreground">Silver Value ($)</label>
                    <input
                      type="number"
                      value={silverValue || ""}
                      On_Change={(e) => setSilverValue(Number(e.target.value) || 0)}
                      placeholder="0.00"
                      className={inputBaseClass}
                    />
                  </div>
                </div>
              )}

              {Step === 4 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 Duration-300">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold ml-4 text-muted-foreground">Investments ($)</label>
                    <input
                      type="number"
                      value={investments || ""}
                      On_Change={(e) => setInvestments(Number(e.target.value) || 0)}
                      placeholder="0.00"
                      className={inputBaseClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold ml-4 text-muted-foreground">Debts Owed ($)</label>
                    <input
                      type="number"
                      value={debts || ""}
                      On_Change={(e) => setDebts(Number(e.target.value) || 0)}
                      placeholder="0.00"
                      className={inputBaseClass}
                    />
                  </div>
                </div>
              )}

              {Step === 5 && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 Duration-300">
                  <div className="text-center space-y-2 py-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">Zakat Due (2.5%)</p>
                    <h1 className="text-6xl font-bold tracking-tighter tabular-nums">
                      ${zakatDue.toFixed(2)}
                    </h1>
                  </div>
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center px-4 py-3 border-2 border-black dark:border-white rounded-[40px]">
                      <span className="text-[10px] uppercase tracking-widest font-bold">Net Wealth</span>
                      <span className="font-bold tabular-nums">${netWealth.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3 border-2 border-black/10 dark:border-white/10 rounded-[40px]">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Threshold</span>
                      <span className="font-bold tabular-nums text-muted-foreground">${nisab.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Navigation */}
            <div className="py-8 flex gap-4 mt-auto">
              {Step > 1 && (
                <Button 
                  onClick={() => Set_Step((s) => (s - 1) as Wizard_Step)} 
                  variant="secondary" 
                  size="icon"
                >
                  <ChevronLeft size={20} />
                </Button>
              )}
              
              {Step < 5 ? (
                <Button 
                  onClick={() => Set_Step((s) => (s + 1) as Wizard_Step)} 
                  className="flex-grow font-bold uppercase tracking-widest text-[10px] h-12"
                >
                  Continue <ChevronRight size={14} className="ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={resetCalculator} 
                  className="flex-grow font-bold uppercase tracking-widest text-[10px] h-12"
                >
                  Calculate Again
                </Button>
              )}
            </div>
          </div>
        </Container>
      </div>
    </Layout>
  );
};

export default ZakatCalculatorPage;