import { useState, useEffect } from "react";

export function Use_Media_Query(query: string): boolean {
  const [matches, Set_Matches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      Set_Matches(media.matches);
    }
    const listener = () => Set_Matches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}