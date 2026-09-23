import { useEffect, RefObject } from 'react';

interface Copy_Interceptor_Props {
  Container_ID: string;
  Standard_Kalimaat_Map_Reference: RefObject<Map<number, string[]>>;
}

export function Use_Copy_Interceptor({ Container_ID, Standard_Kalimaat_Map_Reference }: Copy_Interceptor_Props) {
  useEffect(() => {
    const Handle_Copy = (e: ClipboardEvent) => {
      const Container = document.getElementById(Container_ID);
      if (!Container) return;

      const Selection = window.getSelection();
      if (!Selection || Selection.isCollapsed) return;

      const Range = Selection.getRangeAt(0);
      const Common_Ancestor = Range.commonAncestorContainer;
      if (!Container.contains(Common_Ancestor)) return;

      // Collect all Kalimah spans that are inside the Selection
      const Word_Spans: HTMLElement[] = [];
      const Walker = document.createTreeWalker(
        Container,
        NodeFilter.SHOW_ELEMENT,
        {
          acceptNode: (node) => {
            const el = node as HTMLElement;
            if (el.hasAttribute('data-Ayah') && el.hasAttribute('data-Kalimah')) {
              if (Selection.containsNode(el, true)) {
                return NodeFilter.FILTER_ACCEPT;
              }
            }
            return NodeFilter.FILTER_SKIP;
          }
        }
      );

      while (Walker.nextNode()) {
        Word_Spans.push(Walker.currentNode as HTMLElement);
      }

      if (Word_Spans.length === 0) return;

      const Standard_Map = Standard_Kalimaat_Map_Reference.current;
      if (!Standard_Map) {
        console.warn('Standard Kalimaat map not available for copy');
        return;
      }

      // Build standard Arabic text from the selected spans
      const Standard_Parts: string[] = [];
      for (const span of Word_Spans) {
        const Ayah = parseInt(span.getAttribute('data-Ayah')!);
        const Kalimah_Index = parseInt(span.getAttribute('data-Kalimah')!);
        const Ayah_Words = Standard_Map.get(Ayah);
        if (Ayah_Words && Ayah_Words[Kalimah_Index]) {
          Standard_Parts.push(Ayah_Words[Kalimah_Index]);
        } else {
          // Fallback to the displayed text (should never happen)
          Standard_Parts.push(span.textContent?.trim() || '');
        }
      }

      const Standard_Text = Standard_Parts.join(' ');
      e.clipboardData?.setData('text/plain', Standard_Text);
      e.preventDefault();
      console.log('📋 Copied standard Arabic:', Standard_Text);
    };

    document.addEventListener('copy', Handle_Copy);
    return () => document.removeEventListener('copy', Handle_Copy);
  }, [Container_ID, Standard_Kalimaat_Map_Reference]);
}