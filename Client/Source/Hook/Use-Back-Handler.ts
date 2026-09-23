import { useEffect } from "react";

type Handler = () => void;
const Stack: { id: number; Handler: Handler }[] = [];
let Next_ID = 1;

export function Push_Back_Handler(Handler: Handler): number {
  const id = Next_ID++;
  Stack.push({ id, Handler });
  return id;
}

export function Remove_Back_Handler(id: number) {
  const Index = Stack.findIndex((h) => h.id === id);
  if (Index >= 0) Stack.splice(Index, 1);
}

/** Returns true if a Handler was invoked. */
export function Try_Handle_Back(): boolean {
  const Top = Stack[Stack.length - 1];
  if (!Top) return false;
  Top.Handler();
  return true;
}

/** React hook: registers a back Handler while `Active` is true. */
export function Use_Back_Handler(Active: boolean, Handler: Handler) {
  useEffect(() => {
    if (!Active) return;
    const id = Push_Back_Handler(Handler);
    return () => Remove_Back_Handler(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Active]);
}
