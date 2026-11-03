import { useState } from "react";
import { Phone } from "lucide-react";
import { Button } from "@Web/Component/UI/Button";
import { AI_Call_Overlay } from "./AI-Call-Overlay";

/**
 * Inline "Call AI" button. Sits next to the Practice button on the root.
 */
export function AI_Call_Button() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Call AI tutor"
      >
        <Phone className="h-5 w-5" />
      </Button>
      {open && <AI_Call_Overlay onClose={() => setOpen(false)} />}
    </>
  );
}
