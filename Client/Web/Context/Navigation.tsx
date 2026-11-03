import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export interface TransitionItem {
  activeRoute: string;
  label?: string;
  fromPath: string;
  isVirtual?: boolean; // Nieuwe vlag voor paneel-only overlays
}

const PANEL_MARGIN = { top: 72, right: 16, bottom: 16, left: 16 };
const STORAGE_KEY_STACK = "nav_transition_stack_multi";

interface NavigationContextType {
  stack: TransitionItem[];
  triggerTransition: (activeRoute: string, label?: string, isVirtual?: boolean) => void;
  closeTransition: () => void;
  isRouteActive: (route: string) => boolean;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [stack, setStack] = useState<TransitionItem[]>(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY_STACK);
    if (!stored) return [];
    try {
      const parsed: TransitionItem[] = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY_STACK, JSON.stringify(stack));
  }, [stack]);

  // Sync alleen echte pagina-routes met de browsergeschiedenis
  useEffect(() => {
    if (stack.length === 0) return;

    const currentPath = location.pathname;
    
    // Bepaal of de huidige URL overeenkomt met een niet-virtueel item
    const matchingIndex = stack.findIndex(
      (item) => !item.isVirtual && (item.activeRoute === currentPath || currentPath.startsWith(item.activeRoute))
    );

    if (matchingIndex === -1 && currentPath === stack[0]?.fromPath) {
      // Als we terug zijn op de startpagina, leeg de stack
      setStack([]);
    }
  }, [location.pathname]);

  const triggerTransition = (activeRoute: string, label?: string, isVirtual: boolean = false) => {
    const newItem: TransitionItem = {
      activeRoute,
      label,
      fromPath: location.pathname,
      isVirtual,
    };

    setStack((prev) => [...prev, newItem]);

    // Alleen echt navigeren als het GEEN virtueel paneel is
    if (!isVirtual) {
      const targetPath = activeRoute.startsWith("/") ? activeRoute : `/${activeRoute}`;
      navigate(targetPath);
    }
  };

  const closeTransition = () => {
    setStack((prev) => {
      const lastItem = prev[prev.length - 1];
      const newStack = prev.slice(0, -1);

      // Als het gesloten item NIET virtueel was, navigeer terug naar het vorige pad
      if (lastItem && !lastItem.isVirtual) {
        const target = newStack.length > 0 ? newStack[newStack.length - 1].activeRoute : lastItem.fromPath || "/";
        navigate(target);
      }

      return newStack;
    });
  };

  const isRouteActive = (route: string) => stack.some((item) => item.activeRoute === route);

  return (
    <NavigationContext.Provider
      value={{
        stack,
        triggerTransition,
        closeTransition,
        isRouteActive,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export const useNavTransition = () => {
  const context = useContext(NavigationContext);
  if (!context) throw new Error("useNavTransition must be used within NavigationProvider");
  return context;
};
export function GlobalNavOverlay() {
  const { stack } = useNavTransition();

  return (
    <AnimatePresence>
      {stack.map((item, index) => (
        <motion.div
          key={`shared-panel-${item.activeRoute}`}
          layoutId={`shared-btn-${item.activeRoute}`}
          style={{
            position: "fixed",
            top: PANEL_MARGIN.top,
            left: PANEL_MARGIN.left,
            width: `calc(100vw - ${PANEL_MARGIN.left + PANEL_MARGIN.right}px)`,
            height: `calc(100vh - ${PANEL_MARGIN.top + PANEL_MARGIN.bottom}px)`,
            borderRadius: 24,
            backgroundColor: "#ffffff",
            zIndex: 1 + index,
            overflow: "hidden",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            mass: 0.8,
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.15 }}
            className="w-full h-full text-slate-900 relative"
          >
            {/* Tekst en knop zijn hier weggehaald */}
          </motion.div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}