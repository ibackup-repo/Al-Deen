import { Info, Play, Pause } from "lucide-react";
import { Tooltip_Provider } from "@Web/Component/UI/Tooltip";
import { Use_Audio } from "@Web/Context/Audio";
import { Use_Translation } from "@/Hook/Use-Translation";

interface Actions_Properties {
  Surah_ID: number;
  Surah_Name?: string;
  On_Info_Click: () => void;
  On_Audio_Click?: () => void;
}

export function Action({
  Surah_ID,
  On_Info_Click,
  On_Audio_Click,
}: Actions_Properties) {
  const { Translation } = Use_Translation();
  const {
    Is_Playing: Is_Audio_Playing,
    Is_Loading_Corpus_Data: Is_Audio_Loading,
    Current_Surah: Audio_Current_Surah,
    Play_Full_Surah,
    Toggle_Play_Pause,
  } = Use_Audio();

  const Is_This_Surah_Playing = Audio_Current_Surah === Surah_ID && Is_Audio_Playing;

  const Handle_Audio_Click = () => {
    On_Audio_Click?.();

    if (Is_This_Surah_Playing) {
      Toggle_Play_Pause();
    } else if (Audio_Current_Surah === Surah_ID && !Is_Audio_Playing) {
      Toggle_Play_Pause();
    } else {
      Play_Full_Surah(Surah_ID);
    }
  };

  return (
    <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
      <Tooltip_Provider>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={On_Info_Click}
            className="glass-hover flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
          >
            <Info className="h-4 w-4" />
            {Translation.Quran.Surah_Info}
          </button>

          <button
            className="glass-btn px-4 py-2.5 gap-2 text-sm text-primary disabled:opacity-50"
            disabled={Is_Audio_Loading}
            onClick={Handle_Audio_Click}
          >
            {Is_This_Surah_Playing ? (
              <><Pause className="h-4 w-4 fill-current" />{Translation.Quran.Pause_Audio}</>
            ) : (
              <><Play className="h-4 w-4 fill-current" />{Translation.Quran.Play_Audio}</>
            )}
          </button>
        </div>
      </Tooltip_Provider>
    </div>
  );
}