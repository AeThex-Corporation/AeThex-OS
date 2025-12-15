import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, CheckCircle, Sparkles } from "lucide-react";

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target?: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
  action?: string;
}

interface TutorialContextType {
  isActive: boolean;
  currentStep: number;
  steps: TutorialStep[];
  startTutorial: (steps: TutorialStep[]) => void;
  endTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  hasCompletedTutorial: boolean;
}

const TutorialContext = createContext<TutorialContextType | null>(null);

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error("useTutorial must be used within TutorialProvider");
  }
  return context;
}

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasCompletedTutorial(localStorage.getItem("aethex_tutorial_completed") === "true");
    }
  }, []);

  const startTutorial = (newSteps: TutorialStep[]) => {
    setSteps(newSteps);
    setCurrentStep(0);
    setIsActive(true);
  };

  const endTutorial = () => {
    setIsActive(false);
    setCurrentStep(0);
    setSteps([]);
    setHasCompletedTutorial(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("aethex_tutorial_completed", "true");
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      endTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTutorial = () => {
    endTutorial();
  };

  return (
    <TutorialContext.Provider
      value={{
        isActive,
        currentStep,
        steps,
        startTutorial,
        endTutorial,
        nextStep,
        prevStep,
        skipTutorial,
        hasCompletedTutorial,
      }}
    >
      {children}
      <TutorialOverlay />
    </TutorialContext.Provider>
  );
}

function TutorialOverlay() {
  const { isActive, currentStep, steps, nextStep, prevStep, skipTutorial } = useTutorial();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = steps[currentStep];

  useEffect(() => {
    if (!isActive || !step?.target) {
      setTargetRect(null);
      return;
    }

    const findTarget = () => {
      const element = document.querySelector(`[data-tutorial="${step.target}"]`);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        setTargetRect(null);
      }
    };

    findTarget();
    const interval = setInterval(findTarget, 500);
    return () => clearInterval(interval);
  }, [isActive, step]);

  if (!isActive || !step) return null;

  const getTooltipPosition = () => {
    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 800;
    const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 600;
    const isMobile = viewportWidth < 640;
    const padding = 16;
    const tooltipWidth = isMobile ? Math.min(320, viewportWidth - 32) : 360;
    const tooltipHeight = 200;

    if (!targetRect || step.position === "center" || isMobile) {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        maxWidth: `${viewportWidth - 32}px`,
      };
    }

    let top = 0;
    let left = 0;

    switch (step.position || "bottom") {
      case "top":
        top = targetRect.top - tooltipHeight - padding;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case "bottom":
        top = targetRect.bottom + padding;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case "left":
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left - tooltipWidth - padding;
        break;
      case "right":
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.right + padding;
        break;
      default:
        top = targetRect.bottom + padding;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
    }

    left = Math.max(padding, Math.min(left, viewportWidth - tooltipWidth - padding));
    top = Math.max(padding, Math.min(top, viewportHeight - tooltipHeight - padding));

    return {
      top: `${top}px`,
      left: `${left}px`,
      maxWidth: `${tooltipWidth}px`,
    };
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100]"
        role="dialog"
        aria-modal="true"
        aria-label="Platform tutorial"
      >
        {/* Dark overlay with cutout */}
        <div className="absolute inset-0 bg-black/80" aria-hidden="true" />
        
        {/* Highlight target element */}
        {targetRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute border-2 border-primary rounded-lg pointer-events-none"
            style={{
              top: targetRect.top - 4,
              left: targetRect.left - 4,
              width: targetRect.width + 8,
              height: targetRect.height + 8,
              boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.75), 0 0 20px rgba(234, 179, 8, 0.5)",
            }}
          />
        )}

        {/* Tooltip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute bg-card border border-white/10 p-6 w-[360px] max-w-[90vw] shadow-2xl"
          style={getTooltipPosition()}
          role="alertdialog"
          aria-labelledby="tutorial-title"
          aria-describedby="tutorial-content"
        >
          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Close button */}
          <button
            onClick={skipTutorial}
            className="absolute top-3 right-3 text-muted-foreground hover:text-white transition-colors"
            data-testid="button-tutorial-close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs text-primary font-bold uppercase tracking-wider">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>

          {/* Content */}
          <h3 id="tutorial-title" className="text-lg font-display text-white uppercase mb-2">{step.title}</h3>
          <p id="tutorial-content" className="text-sm text-muted-foreground mb-6 leading-relaxed">{step.content}</p>

          {step.action && (
            <p className="text-xs text-primary/80 mb-4 italic">{step.action}</p>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={skipTutorial}
              className="text-xs text-muted-foreground hover:text-white transition-colors"
              data-testid="button-tutorial-skip"
            >
              Skip Tutorial
            </button>

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={prevStep}
                  className="flex items-center gap-1 px-3 py-2 text-xs text-muted-foreground hover:text-white transition-colors"
                  data-testid="button-tutorial-prev"
                >
                  <ChevronLeft className="w-3 h-3" /> Back
                </button>
              )}
              <button
                onClick={nextStep}
                className="flex items-center gap-1 px-4 py-2 bg-primary text-background text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors"
                data-testid="button-tutorial-next"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    <CheckCircle className="w-3 h-3" /> Complete
                  </>
                ) : (
                  <>
                    Next <ChevronRight className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Step dots */}
          <div className="flex justify-center gap-1 mt-4">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentStep ? "bg-primary" : i < currentStep ? "bg-primary/50" : "bg-white/20"
                }`}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export const homeTutorialSteps: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to AeThex",
    content: "This is the Operating System for the Metaverse. Let me show you around the platform and its key features.",
    position: "center",
  },
  {
    id: "metrics",
    title: "Live Ecosystem Metrics",
    content: "These numbers update in real-time, showing the total number of architects, projects, and activity across the platform.",
    target: "metrics-section",
    position: "bottom",
  },
  {
    id: "axiom",
    title: "Axiom - The Law",
    content: "Click here to learn about our dual-entity model and view the investor pitch deck with real data and charts.",
    target: "axiom-card",
    position: "bottom",
  },
  {
    id: "codex",
    title: "Codex - The Standard",
    content: "The Foundation trains elite Metaverse Architects through gamified curriculum and verified certifications.",
    target: "codex-card",
    position: "bottom",
  },
  {
    id: "aegis",
    title: "Aegis - The Shield",
    content: "Real-time security for virtual environments. PII scrubbing, threat detection, and protection for every line of code.",
    target: "aegis-card",
    position: "bottom",
  },
  {
    id: "demos",
    title: "Try It Yourself",
    content: "Explore our demos: view a sample Passport credential, try the Terminal security demo, or browse the Tech Tree curriculum.",
    target: "demo-section",
    position: "top",
  },
  {
    id: "complete",
    title: "You're All Set!",
    content: "You now know the basics of AeThex. Start exploring, or visit our Foundation to begin your journey as a Metaverse Architect.",
    position: "center",
  },
];

export const dashboardTutorialSteps: TutorialStep[] = [
  {
    id: "welcome",
    title: "Your Dashboard",
    content: "Welcome to your personal command center. Here you can track your progress, achievements, and activity.",
    position: "center",
  },
  {
    id: "profile",
    title: "Your Profile",
    content: "This shows your current level, XP, and verification status. Keep completing challenges to level up!",
    target: "profile-section",
    position: "right",
  },
  {
    id: "stats",
    title: "Your Stats",
    content: "Track your key metrics: total XP earned, current level, and your verification status.",
    target: "stats-section",
    position: "bottom",
  },
];

export function TutorialButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 bg-primary text-background p-3 rounded-full shadow-lg hover:bg-primary/90 transition-colors group"
      data-testid="button-start-tutorial"
    >
      <Sparkles className="w-5 h-5" />
      <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-card border border-white/10 px-3 py-1 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
        Start Tutorial
      </span>
    </button>
  );
}
