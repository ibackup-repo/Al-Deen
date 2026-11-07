import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Minus, X, Search } from "lucide-react";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";
import { Use_App } from "@Web/Context/App";
import { Button } from "@Web/Component/UI/button";
import { SlidingPill } from "@Web/Component/UI/Sliding-Pill";

type Mode_Type = "add" | "delete";

export function Add() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = Use_Course_Language();
  const { 
    Set_Learning_Language, 
    Remove_Course, 
    Inactive_Languages = [], 
    Active_Languages = [] 
  } = Use_App();

  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [Search_Query, Set_Search_Query] = useState("");
  const [mode, setMode] = useState<Mode_Type>("add");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (Inactive_Languages.length > 0) {
        setMode("add");
      } else if (Active_Languages.length > 0) {
        setMode("delete");
      }
    } else {
      setIsSearching(false);
      Set_Search_Query("");
    }
  }, [isOpen, Inactive_Languages.length, Active_Languages.length]);

  useEffect(() => {
    if (isSearching && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearching]);

  if (!location.pathname.toLowerCase().startsWith("/language")) {
    return null;
  }

  const Has_Active = Active_Languages.length > 0;
  const Has_Inactive = Inactive_Languages.length > 0;
  const Current_List = mode === "add" ? Inactive_Languages : Active_Languages;

  const Filtered_Languages = Current_List.filter((lang) =>
    !Search_Query || lang.toLowerCase().includes(Search_Query.toLowerCase().trim())
  );

  const Handle_Pick = (name: string) => {
    setIsOpen(false);
    setIsSearching(false);
    Set_Search_Query("");

    if (mode === "add") {
      Set_Learning_Language(name);
      navigate(`/Language/${name}`);
    } else {
      Remove_Course(name);
      navigate("/Language");
    }
  };

  const Pill_Options = [
    { value: "add" as Mode_Type, label: "", icon: <Plus className="h-4 w-4 stroke-[2.5]" /> },
    { value: "delete" as Mode_Type, label: "", icon: <Minus className="h-4 w-4 stroke-[2.5]" /> }
  ];

  const Trigger_Icon = !Has_Inactive ? (
    <Minus className="h-5 w-5" />
  ) : (
    <Plus className="h-5 w-5" />
  );

  return (
    <div className="relative z-[9999] w-72">
      {/* SVG Gooey Filter */}
      <svg style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}>
        <defs>
          <filter id="menu-gooey-split" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 19 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Top Header Control Cluster spanning full width (w-72) */}
      <div
        className="flex items-center justify-between w-full transition-all duration-300"
        style={{ filter: isOpen ? "url(#menu-gooey-split)" : "none" }}
      >
        {/* Search Mode UI */}
        {isOpen && isSearching ? (
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 flex items-center bg-white rounded-full px-3 h-10 border border-slate-200 shadow-md">
              <Search className="h-4 w-4 text-slate-400 shrink-0 mr-2" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search language..."
                value={Search_Query}
                onChange={(e) => Set_Search_Query(e.target.value)}
                className="w-full h-full text-xs bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {Search_Query.length > 0 && (
                <Button
                  size="icon"
                  Icon={<X className="h-3.5 w-3.5" />}
                  OnClick={() => Set_Search_Query("")}
                  aria-label="Clear Search Text"
                  Color="transparent"
                  TextColor="#64748b"
                  className="h-6 w-6 shrink-0 ml-1 hover:bg-slate-100"
                />
              )}
            </div>

            {/* X Button on the far right while searching */}
            <Button
              size="icon"
              Icon={<X className="h-4 w-4" />}
              OnClick={() => {
                setIsSearching(false);
                Set_Search_Query("");
              }}
              aria-label="Close Search"
              Color="#ffffff"
              TextColor="#0f172a"
              className="h-10 w-10 shrink-0 shadow-md"
            />
          </div>
        ) : (
          /* Standard Header Mode */
          <>
            {/* Left: Close/Trigger Button */}
            <Button
              size="icon"
              Icon={isOpen ? <X className="h-5 w-5" /> : Trigger_Icon}
              OnClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? "Close Menu" : "Open Menu"}
              Color="#ffffff"
              TextColor="#0f172a"
              className="z-20 shrink-0 shadow-md"
            />

            {/* Center: Switch Button */}
            {isOpen && Has_Active && Has_Inactive ? (
              <div className="animate-in fade-in slide-in-from-left-3 duration-300">
                <SlidingPill
                  options={Pill_Options}
                  selectedValue={mode}
                  onChange={(val) => setMode(val as Mode_Type)}
                  width="w-20"
                  height="h-8"
                />
              </div>
            ) : (
              isOpen && <div className="w-20" />
            )}

            {/* Right: Search Button */}
            {isOpen && (
              <Button
                size="icon"
                Icon={<Search className="h-4 w-4" />}
                OnClick={() => setIsSearching(true)}
                aria-label="Open Search"
                Color="#ffffff"
                TextColor="#0f172a"
                className="h-10 w-10 shrink-0 shadow-md"
              />
            )}
          </>
        )}
      </div>

      {/* Pure Black Dropdown Container with Squared Top Corners */}
      {isOpen && (
        <div className="absolute top-12 left-0 w-72 bg-[#000000] text-white rounded-t-none rounded-b-3xl shadow-2xl p-3 z-[10000] animate-in fade-in zoom-in-95 duration-200">
          {/* Scrollable Language List */}
          <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto pr-1">
            {Filtered_Languages.map((lang) => (
              <Button
                key={lang}
                Label={lang}
                Color="#ffffff"
                TextColor="#0f172a"
                Height={36}
                className="w-full text-left font-medium border-0 shadow-none"
                OnClick={() => Handle_Pick(lang)}
                Icon={
                  mode === "add" && lang.toLowerCase() === "pashto" ? (
                    <span className="ml-auto text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-800">
                      Preview
                    </span>
                  ) : undefined
                }
              />
            ))}

            {Filtered_Languages.length === 0 && (
              <p className="text-xs text-zinc-400 p-6 text-center">
                {mode === "add" 
                  ? (t("noInactive") || "No remaining tracks to add.") 
                  : (t("noActive") || "No active courses found.")}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}