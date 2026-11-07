import React, { useEffect, useRef, useState } from "react";

import { Check, Edit2, Fingerprint, Repeat, RotateCcw } from "lucide-react";

import { Layout } from "@Web/Component/Layout/Index";
import UI from "@Web/Context/UI";
import { Container } from "@Web/Component/UI/Container/Index";
import { Button } from "@Web/Component/UI/Button/Index";

const HOLD_DURATION = 1000;
const INTERVAL_STEP = 10;

// Ontwerpmaten (de ruimste uitvoering). Alles schaalt hier vanaf.
const DESIGN_CIRCLE_SIZE = 224;
const DESIGN_ICON_SIZE = 160;
const DESIGN_COUNTER_FONT = 68;

const MAX_CONTENT_WIDTH = 448;
const PAGE_PADDING_HORIZONTAL = 16;

// De svg tekent altijd in een vaste viewBox, dus de cirkelwiskunde
// blijft hetzelfde, ook als de cirkel kleiner wordt getoond.
const CIRCLE_RADIUS = 104;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

const Clamp = (Value: number, Min: number, Max: number) =>
    Math.max(Min, Math.min(Max, Value));

const Use_Window_Size = () => {
    const Get_Size = () => ({
        Width: typeof window !== "undefined" ? window.innerWidth : 1024,
        Height: typeof window !== "undefined" ? window.innerHeight : 768,
    });

    const [Size, Set_Size] = useState(Get_Size);

    useEffect(() => {
        const Handle_Resize = () => Set_Size(Get_Size());

        window.addEventListener("resize", Handle_Resize);

        return () => window.removeEventListener("resize", Handle_Resize);
    }, []);

    return Size;
};

const Aid_Tasbih_Counter = () => {
    const { Width: Screen_Width, Height: Screen_Height } = Use_Window_Size();

    // Op gsm staat de vingerafdruk onderaan, binnen bereik van de duim.
    const Is_Mobile = Screen_Width < 768;

    /* -------------------------------------------------------------- */
    /* Responsive maten                                               */
    /* -------------------------------------------------------------- */

    const Content_Width =
        Math.min(Screen_Width, MAX_CONTENT_WIDTH) -
        PAGE_PADDING_HORIZONTAL * 2;

    // Cirkel: past in de breedte én in de hoogte van het scherm.
    const Circle_Size = Clamp(
        Math.min(
            DESIGN_CIRCLE_SIZE,
            Content_Width * 0.75,
            Screen_Height * 0.3
        ),
        140,
        DESIGN_CIRCLE_SIZE
    );

    const Scale = Circle_Size / DESIGN_CIRCLE_SIZE;
    const Icon_Size = Math.round(DESIGN_ICON_SIZE * Scale);

    const Counter_Font = Clamp(
        Content_Width * 0.2,
        40,
        DESIGN_COUNTER_FONT
    );

    const Font_Scale = Counter_Font / DESIGN_COUNTER_FONT;

    /* -------------------------------------------------------------- */
    /* State                                                          */
    /* -------------------------------------------------------------- */

    const [Count, Set_Count] = useState(0);
    const [Target, Set_Target] = useState(33);
    const [Loops, Set_Loops] = useState(0);

    const [Is_Editing_Target, Set_Is_Editing_Target] = useState(false);
    const [Temp_Target, Set_Temp_Target] = useState("33");

    const [Render_Progress, Set_Render_Progress] = useState(0);
    const [Is_Locked, Set_Is_Locked] = useState(false);

    const Timer_Ref = useRef<ReturnType<typeof setInterval> | null>(null);
    const Progress_Ref = useRef(0);
    const Count_Ref = useRef(0);

    const Is_Valid_Target =
        Temp_Target.trim() !== "" && Number(Temp_Target) > 0;

    /* -------------------------------------------------------------- */
    /* Hold timer                                                     */
    /* -------------------------------------------------------------- */

    const Clear_Hold_Timer = () => {
        if (Timer_Ref.current) {
            clearInterval(Timer_Ref.current);
            Timer_Ref.current = null;
        }
    };

    const Handle_Success = () => {
        Clear_Hold_Timer();

        const Next_Count = Count_Ref.current + 1;

        if (Next_Count > Target) {
            Set_Loops((Previous_Loops) => Previous_Loops + 1);
            Count_Ref.current = 1;
        } else {
            Count_Ref.current = Next_Count;
        }

        Set_Count(Count_Ref.current);
        Set_Render_Progress(100);
        Set_Is_Locked(true);
    };

    const Start_Holding = () => {
        if (Is_Locked || Timer_Ref.current || Is_Editing_Target) {
            return;
        }

        Progress_Ref.current = 0;
        Set_Render_Progress(0);

        Timer_Ref.current = setInterval(() => {
            const Next_Progress =
                Progress_Ref.current + 100 / (HOLD_DURATION / INTERVAL_STEP);

            Progress_Ref.current = Next_Progress;

            Set_Render_Progress(Math.min(Next_Progress, 100));

            if (Next_Progress >= 100) {
                Handle_Success();
            }
        }, INTERVAL_STEP);
    };

    const Stop_Holding = () => {
        Clear_Hold_Timer();

        Progress_Ref.current = 0;

        Set_Render_Progress(0);
        Set_Is_Locked(false);
    };

    /* -------------------------------------------------------------- */
    /* Target editing                                                 */
    /* -------------------------------------------------------------- */

    const Start_Editing_Target = () => {
        Stop_Holding();
        Set_Temp_Target(Target.toString());
        Set_Is_Editing_Target(true);
    };

    const Save_Target = () => {
        const Parsed_Target = parseInt(Temp_Target, 10);

        if (!isNaN(Parsed_Target) && Parsed_Target > 0) {
            Set_Target(Parsed_Target);
            Set_Is_Editing_Target(false);
        }
    };

    /* -------------------------------------------------------------- */
    /* Reset                                                          */
    /* -------------------------------------------------------------- */

    const Reset_Counter = () => {
        if (!window.confirm("Wil je de teller en rondes resetten?")) {
            return;
        }

        Clear_Hold_Timer();

        Count_Ref.current = 0;
        Progress_Ref.current = 0;

        Set_Count(0);
        Set_Loops(0);
        Set_Render_Progress(0);
        Set_Is_Locked(false);
    };

    /* -------------------------------------------------------------- */
    /* Cleanup                                                        */
    /* -------------------------------------------------------------- */

    useEffect(() => {
        return () => {
            Clear_Hold_Timer();
        };
    }, []);

    /* -------------------------------------------------------------- */
    /* Render                                                         */
    /* Kleuren volgen de semantische theme-tokens van de applicatie. */
    /* Waarden die meeschalen met het scherm staan in style.          */
    /* -------------------------------------------------------------- */

    const Counter_Text_Style: React.CSSProperties = {
        fontSize: Counter_Font,
        lineHeight: 1.15,
        letterSpacing: -3 * Font_Scale,
        fontVariantNumeric: "tabular-nums",
    };

    return (
<UI>
        <Layout>
                <div
                    className="w-full max-w-[448px] mx-auto flex flex-col items-center px-4 pt-6 pb-8"
                    style={{
                        justifyContent: Is_Mobile
                            ? "space-between"
                            : "flex-start",
                        minHeight: Is_Mobile
                            ? "80dvh"
                            : Math.min(650, Screen_Height),
                    }}
                >
                    <div className="w-full flex flex-col items-center">

                        {/* Header */}

                        <div className="w-full flex flex-row items-center justify-between gap-1.5">

                            {/* Cycles */}

                            <Container
                                Padding={10}
                                Gap={0}
                                Style_Properties={{
                                    width: "auto",
                                    flexShrink: 0,
                                }}
                            >
                                <div className="min-h-[22px] flex flex-row items-center justify-center gap-[7px]">
                                    <Repeat size={16}  />

                                    <span className="text-sm font-bold tabular-nums">
                                        {Loops}
                                    </span>
                                </div>
                            </Container>

                            {/* Actions */}

                            <div className="flex flex-row items-center gap-[7px] shrink-0">

                                {/* Edit / Save */}

                                <div className="w-12 h-12">
                                    {Is_Editing_Target ? (
                                        <Button
                                            Variant="Primary"
                                            Size="icon"
                                               Icon={
                                                <Check
                                                    size={19}
                                                   />
                                            }
                                            On_Click={Save_Target}
                                            Active={true}
                                            Style_Properties={
                                                !Is_Valid_Target
                                                    ? { opacity: 0.35 }
                                                    : undefined
                                            }
                                            aria-label="Doel opslaan"
                                        />
                                    ) : (
                                        <Button
                                            Variant="Primary"
                                            Size="icon"
                                               Icon={
                                                <Edit2
                                                    size={18}
                                                   />
                                            }
                                            On_Click={Start_Editing_Target}
                                            aria-label="Doel aanpassen"
                                        />
                                    )}
                                </div>

                                {/* Reset */}

                                <div className="w-12 h-12">
                                    <Button
                                        Variant="Primary"
                                        Size="icon"
                                        Icon={
                                            <RotateCcw
                                                size={18}
                                            />
                                        }
                                        On_Click={Reset_Counter}
                                        aria-label="Reset teller"
                                    />
                                </div>

                            </div>
                        </div>

                        {/* Counter */}

                        <div
                            className="w-full flex flex-col items-center justify-center"
                            style={{
                                marginTop: Math.round(50 * Scale),
                                marginBottom: Math.round(30 * Scale),
                            }}
                        >
                            <div className="flex flex-row items-center justify-center">

                                <span
                                    className="font-extrabold"
                                    style={Counter_Text_Style}
                                >
                                    {Count}
                                </span>

                                <span

                                    style={{
                                        fontSize: Counter_Font * 0.8,
                                        lineHeight: 1.15,
                                        marginLeft: 12 * Font_Scale,
                                        marginRight: 12 * Font_Scale,
                                    }}
                                >
                                    /
                                </span>

                                {Is_Editing_Target ? (
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={Temp_Target}
                                        onChange={(Event) =>
                                            Set_Temp_Target(
                                                Event.target.value
                                                    .replace(/\D/g, "")
                                                    .slice(0, 3)
                                            )
                                        }
                                        onKeyDown={(Event) => {
                                            if (Event.key === "Enter") {
                                                Save_Target();
                                            }

                                            if (Event.key === "Escape") {
                                                Set_Is_Editing_Target(false);
                                            }
                                        }}
                                        onFocus={(Event) =>
                                            Event.target.select()
                                        }
                                        maxLength={3}
                                        autoFocus
                                        className="font-extrabold p-0 m-0 border-0 bg-transparent outline-none text-center"
                                        style={{
                                            ...Counter_Text_Style,
                                            width: `${Math.max(
                                                1,
                                                Temp_Target.length
                                            )}ch`,
                                            minWidth: Counter_Font * 0.9,
                                            maxWidth: Counter_Font * 1.8,
                                        }}
                                    />
                                ) : (
                                    <span
                                        className="font-extrabold"
                                        style={Counter_Text_Style}
                                    >
                                        {Target}
                                    </span>
                                )}

                            </div>
                        </div>

                    </div>

                    {/* Fingerprint */}

                    <div
                        className="flex items-center justify-center"
                        style={{
                            marginTop: Math.round(20 * Scale),
                            marginBottom: Math.round(24 * Scale),
                        }}
                    >
                        <div
                            className="relative flex items-center justify-center"
                            style={{
                                width: Circle_Size,
                                height: Circle_Size,
                            }}
                        >

                            {/* Houdbare vingerafdruk */}

                            <div
                                role="button"
                                aria-label="Houd ingedrukt om te tellen"
                                aria-disabled={Is_Editing_Target}
                                className="relative flex items-center justify-center select-none touch-none cursor-pointer outline-none active:scale-95 transition-transform"
                                style={{
                                    width: Icon_Size,
                                    height: Icon_Size,
                                    zIndex: 2,
                                    pointerEvents: Is_Editing_Target
                                        ? "none"
                                        : "auto",
                                    WebkitTouchCallout: "none",
                                    WebkitTapHighlightColor: "transparent",
                                }}
                                onPointerDown={Start_Holding}
                                onPointerUp={Stop_Holding}
                                onPointerLeave={Stop_Holding}
                                onPointerCancel={Stop_Holding}
                                onContextMenu={(Event) =>
                                    Event.preventDefault()
                                }
                            >
                                <Fingerprint
                                    size={Icon_Size}
                                    strokeWidth={1.5}
                                    style={{ opacity: 0.3 }}
                                />

                                <div
                                    className="absolute bottom-0 left-0 right-0 overflow-hidden pointer-events-none"
                                    style={{ height: `${Render_Progress}%` }}
                                >
                                    {/* Vast onderaan geplaatst met vaste maat,
                                        zodat de icoon afgeknipt wordt in plaats
                                        van mee te krimpen. */}
                                    <div
                                        className="absolute bottom-0 left-0"
                                        style={{
                                            width: Icon_Size,
                                            height: Icon_Size,
                                        }}
                                    >
                                        <Fingerprint
                                            size={Icon_Size}
                                            strokeWidth={1.5}
                                            style={{ opacity: 1 }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Progress Circle */}

                            <div
                                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                style={{
                                    width: Circle_Size,
                                    height: Circle_Size,
                                }}
                            >
                                <svg
                                    width={Circle_Size}
                                    height={Circle_Size}
                                    viewBox={`0 0 ${DESIGN_CIRCLE_SIZE} ${DESIGN_CIRCLE_SIZE}`}
                                    style={{ transform: "rotate(-90deg)" }}
                                    aria-hidden="true"
                                >
                                    <circle
                                        cx="112"
                                        cy="112"
                                        r={CIRCLE_RADIUS}
                                        strokeWidth="2"
                                        fill="transparent"
                                        stroke="currentColor"

                                    />

                                    <circle
                                        cx="112"
                                        cy="112"
                                        r={CIRCLE_RADIUS}
                                        strokeWidth="4"
                                        fill="transparent"
                                        stroke="currentColor"

                                        strokeDasharray={CIRCLE_CIRCUMFERENCE}
                                        strokeDashoffset={
                                            CIRCLE_CIRCUMFERENCE -
                                            (CIRCLE_CIRCUMFERENCE *
                                                Render_Progress) /
                                                100
                                        }
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </div>

                        </div>
                    </div>

                </div>
             </Layout>
            </UI>
    );
};

export default Aid_Tasbih_Counter;