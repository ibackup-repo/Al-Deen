import FS from 'fs';
import { Output_Directory, Is_Force_Build } from './Config.ts';
import { Build_Lesson_DB } from './DB/Lesson.ts';
import { Build_Puzzle_DB } from './DB/Puzzle.ts';

function Run_Build(): void {
  console.log(`🚀 Starting Chess Corpus SQLite Build${Is_Force_Build ? ' (FORCE MODE)' : ''}...\n`);

  FS.mkdirSync(Output_Directory, { recursive: true });

  Build_Lesson_DB();
  console.log("");
  Build_Puzzle_DB();

  console.log("\n--- 📊 Corpus Build Finished ---");
}

Run_Build();