import { useEffect, useRef, useState, ReactNode } from "react";

interface Scroll_Navbar_Properties {
  children: ReactNode;
}

export default function Scroll_Navbar({ children }: Scroll_Navbar_Properties) {
  const [visible, setVisible] = useState(true);
  const Last_Scroll = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY;
      setVisible(current < Last_Scroll.current || current < 10);
      Last_Scroll.current = current;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 transition-transform duration-300 px-4 py-3 flex items-center justify-between"
      style={{ transform: visible ? "translateY(0)" : "translateY(-100%)" }}
    >
      {children}
    </div>
  );
}
