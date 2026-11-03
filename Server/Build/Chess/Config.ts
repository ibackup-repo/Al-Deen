import Path from 'path';
import { fileURLToPath } from 'url';

const File_Name = fileURLToPath(import.meta.url);
const Directory_Name = Path.dirname(File_Name);

export const Root_Directory = Path.join(Directory_Name, '../../');
export const Lesson_Data_Directory = Path.join(Root_Directory, 'Data/Chess/Lesson');
export const Puzzle_Data_Directory = Path.join(Root_Directory, 'Data/Chess/Puzzle');

export const Output_Directory = Path.join(Root_Directory, 'Asset/Corpus/Chess');
export const Lesson_DB_Path = Path.join(Output_Directory, 'Lesson.db');
export const Puzzle_DB_Path = Path.join(Output_Directory, 'Puzzle.db');

export const Is_Force_Build = process.argv.includes('--force');