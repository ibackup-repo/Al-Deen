import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function Class_Names(...Inputs: ClassValue[]) {
  return twMerge(clsx(Inputs));
}
