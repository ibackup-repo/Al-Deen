import * as React from "react";
import { Class_Names } from "@/Library/Utility";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={Class_Names(
        "flex min-h-[100px] w-full rounded-[40px] bg-white dark:bg-black border-2 border-black dark:border-white px-4 py-3 text-sm transition-all Duration-200",
        "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "hover:border-primary focus:border-primary",
        "resize-none",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.Display_Name = "Textarea";

export { Textarea };