import React, { useState, useRef } from "react";
import { Layout } from "@Web/Component/Layout/Index";
import { Container } from "@Web/Component/UI/Container";
import { Button } from "@Web/Component/UI/Button";
import { RotateCcw, Fingerprint, Edit2, Check, Repeat } from "lucide-react";

export default function Tasbih() {
  const [Tasbih_Count_Number, Set_Tasbih_Count_Number] = useState<number>(0);
  const [Target_Limit_Number, Set_Target_Limit_Number] = useState<number>(33);
  const [Completed_Loops_Count, Set_Completed_Loops_Count] = useState<number>(0);
  const [Is_Editing_Target_Flag, Set_Is_Editing_Target_Flag] = useState<boolean>(false);
  const [Temporary_Target_Input_Text, Set_Temporary_Target_Input_Text] = useState<string>("33");

  const [Hold_Progress_Percentage, Set_Hold_Progress_Percentage] = useState<number>(0);
  const [Is_Interaction_Locked_Flag, Set_Is_Interaction_Locked_Flag] = useState<boolean>(false);

  const Timer_Interval_Reference = useRef<ReturnType<typeof setInterval> | null>(null);

  const HOLD_DURATION_MILLISECONDS = 1000;
  const TIMER_INTERVAL_STEP_MILLISECONDS = 10;

  const Execute_Success_Action_Handler = () => {
    Set_Tasbih_Count_Number((Previous_Count_Number) => {
      const Next_Count_Number = Previous_Count_Number + 1;
      if (Next_Count_Number > Target_Limit_Number) {
        Set_Completed_Loops_Count((Previous_Loops_Count) => Previous_Loops_Count + 1);
        return 1;
      }
      return Next_Count_Number === 0 ? 1 : Next_Count_Number;
    });

    if (Timer_Interval_Reference.current) {
      clearInterval(Timer_Interval_Reference.current);
      Timer_Interval_Reference.current = null;
    }
    Set_Is_Interaction_Locked_Flag(true);
  };

  const Start_Holding_Interaction_Handler = (
    User_Interaction_Event: React.MouseEvent | React.TouchEvent
  ) => {
    if (Is_Interaction_Locked_Flag || Timer_Interval_Reference.current || Is_Editing_Target_Flag) return;

    Timer_Interval_Reference.current = setInterval(() => {
      Set_Hold_Progress_Percentage((Previous_Progress_Value) => {
        const Next_Progress_Value =
          Previous_Progress_Value + (100 / (HOLD_DURATION_MILLISECONDS / TIMER_INTERVAL_STEP_MILLISECONDS));
        if (Next_Progress_Value >= 100) {
          Execute_Success_Action_Handler();
          return 100;
        }
        return Next_Progress_Value;
      });
    }, TIMER_INTERVAL_STEP_MILLISECONDS);
  };

  const Stop_Holding_Interaction_Handler = () => {
    if (Timer_Interval_Reference.current) {
      clearInterval(Timer_Interval_Reference.current);
      Timer_Interval_Reference.current = null;
    }
    Set_Hold_Progress_Percentage(0);
    Set_Is_Interaction_Locked_Flag(false);
  };

  const Save_Target_Value_Handler = () => {
    const Parsed_Target_Value = parseInt(Temporary_Target_Input_Text);
    if (!isNaN(Parsed_Target_Value) && Parsed_Target_Value > 0) {
      Set_Target_Limit_Number(Parsed_Target_Value);
      Set_Is_Editing_Target_Flag(false);
    }
  };

  const Reset_Counter_Progress_Handler = () => {
    if (window.confirm("Reset all Render_Progress and loops?")) {
      Set_Tasbih_Count_Number(0);
      Set_Completed_Loops_Count(0);
      Set_Hold_Progress_Percentage(0);
      Set_Is_Interaction_Locked_Flag(false);
    }
  };

  const Is_Valid_Target_Input_Flag = parseInt(Temporary_Target_Input_Text) > 0;

  return (
    <Layout>
      <div className="Container max-w-md mx-auto p-0 sm:py-12 sm:px-4 select-none">
        <Container className="flex flex-col items-center min-h-[550px] !p-0 sm:!p-8">
          <div className="grid grid-cols-3 w-full items-center mb-12 px-4 sm:px-0 pt-4 sm:pt-0">
            <div className="flex justify-start">
              <Container className="!w-auto !px-3 !py-1 flex items-center gap-2">
                <Repeat size={14} className="text-current" />
                <span className="text-sm font-bold tabular-nums text-current">{Completed_Loops_Count}</span>
              </Container>
            </div>

            <div className="flex justify-center">
              <Container className="!w-auto !px-3 !py-1 flex items-center justify-center whitespace-nowrap">
                <span className="text-[10px] uppercase tracking-widest font-bold text-current">
                  Hold Fingerprint
                </span>
              </Container>
            </div>

            <div className="flex justify-end gap-2">
              {Is_Editing_Target_Flag ? (
                <Button
                  onClick={Save_Target_Value_Handler}
                  disabled={!Is_Valid_Target_Input_Flag}
                  size="icon"
                  className={!Is_Valid_Target_Input_Flag ? "opacity-20" : ""}
                >
                  <Check size={18} strokeWidth={3} className="text-current" />
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    Set_Temporary_Target_Input_Text(Target_Limit_Number.toString());
                    Set_Is_Editing_Target_Flag(true);
                  }}
                  size="icon"
                >
                  <Edit2 size={18} className="text-current" />
                </Button>
              )}

              <Button onClick={Reset_Counter_Progress_Handler} variant="secondary" size="icon">
                <RotateCcw className="h-4 w-4 text-current" />
              </Button>
            </div>
          </div>

          <div className="text-center w-full flex flex-col items-center justify-center flex-grow px-4">
            <div className="flex items-center justify-center text-7xl font-bold tracking-tighter tabular-nums text-black dark:text-white">
              <span>{Tasbih_Count_Number}</span>
              <span className="text-muted/20 mx-4">/</span>

              {Is_Editing_Target_Flag ? (
                <input
                  type="text"
                  value={Temporary_Target_Input_Text}
                  On_Change={(Event_Object) =>
                    Set_Temporary_Target_Input_Text(Event_Object.target.value.replace(/\D/g, "").slice(0, 3))
                  }
                  style={{ width: `${Math.max(Temporary_Target_Input_Text.length, 1)}ch` }}
                  className="bg-transparent outline-none text-7xl font-bold text-black dark:text-white transition-all"
                  autoFocus
                />
              ) : (
                <span>{Target_Limit_Number}</span>
              )}
            </div>
          </div>

          <div className="relative mt-8 mb-16">
            <div
              className={`relative cursor-pointer select-none touch-none transition-transform Duration-200 
                ${Hold_Progress_Percentage > 0 ? "scale-95" : "scale-100"}
              `}
              onContextMenu={(Event_Object) => Event_Object.preventDefault()}
              onMouseDown={Start_Holding_Interaction_Handler}
              onMouseUp={Stop_Holding_Interaction_Handler}
              onMouseLeave={Stop_Holding_Interaction_Handler}
              onTouchStart={Start_Holding_Interaction_Handler}
              onTouchEnd={Stop_Holding_Interaction_Handler}
            >
              <div
                style={{ color: "rgb(128, 128, 128)" }}
                className={Hold_Progress_Percentage >= 100 ? "opacity-0" : "opacity-100"}
              >
                <Fingerprint size={160} />
              </div>

              <div
                className="absolute inset-0 text-black dark:text-white overflow-hidden"
                style={{
                  clipPath: `inset(${100 - Hold_Progress_Percentage}% 0 0 0)`,
                  transition: Hold_Progress_Percentage === 0 ? "none" : "clip-path 10ms linear",
                }}
              >
                <Fingerprint size={160} />
              </div>
            </div>

            <svg className="absolute -inset-8 w-[224px] h-[224px] -rotate-90 pointer-events-none">
              <circle
                cx="112"
                cy="112"
                r="104"
                stroke="currentColor"
                strokeWidth="2"
                fill="transparent"
                className={`${Hold_Progress_Percentage > 0 ? "text-muted/10" : "text-transparent"}`}
              />
              <circle
                cx="112"
                cy="112"
                r="104"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={653}
                strokeDashoffset={
                  Hold_Progress_Percentage === 0 ? 653 : 653 - (653 * Hold_Progress_Percentage) / 100
                }
                className="text-black dark:text-white"
                strokeLinecap="round"
                style={{ transition: Hold_Progress_Percentage === 0 ? "none" : "stroke-dashoffset 10ms linear" }}
              />
            </svg>
          </div>
        </Container>
      </div>
    </Layout>
  );
}