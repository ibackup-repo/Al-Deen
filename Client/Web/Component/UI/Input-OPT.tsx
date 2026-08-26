import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { Dot } from "lucide-react";

import { Class_Names } from "@/Library/Utility";

const InputOTP = React.forwardRef<React.ElementRef<typeof OTPInput>, React.ComponentPropsWithoutRef<typeof OTPInput>>(
  ({ className, containerClassName, ...props }, ref) => (
    <OTPInput
      ref={ref}
      containerClassName={Class_Names("flex items-center gap-2 has-[:disabled]:opacity-50", containerClassName)}
      className={Class_Names("disabled:cursor-not-allowed", className)}
      {...props}
    />
  ),
);
InputOTP.Display_Name = "InputOTP";

const InputOTPGroup = React.forwardRef<React.ElementRef<"div">, React.ComponentPropsWithoutRef<"div">>(
  ({ className, ...props }, ref) => <div ref={ref} className={Class_Names("flex items-center gap-2", className)} {...props} />,
);
InputOTPGroup.Display_Name = "InputOTPGroup";

const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, Is_Active } = inputOTPContext.slots[index];

  return (
    <div
      ref={ref}
      className={Class_Names(
        "relative flex h-12 w-12 items-center justify-center rounded-[40px] bg-white dark:bg-black border-2 border-black dark:border-white text-lg font-semibold transition-all Duration-200",
        "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
        Is_Active && "ring-2 ring-primary ring-offset-2 border-primary",
        "hover:border-primary",
        className,
      )}
      {...props}
    >
      {char !== "" ? (
        <span className="text-foreground">{char}</span>
      ) : (
        <span className="text-muted-foreground">•</span>
      )}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink h-5 w-px bg-foreground Duration-1000" />
        </div>
      )}
    </div>
  );
});
InputOTPSlot.Display_Name = "InputOTPSlot";

const InputOTPSeparator = React.forwardRef<React.ElementRef<"div">, React.ComponentPropsWithoutRef<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} role="separator" className={Class_Names("text-muted-foreground", className)} {...props}>
      <Dot className="h-4 w-4" />
    </div>
  ),
);
InputOTPSeparator.Display_Name = "InputOTPSeparator";

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };