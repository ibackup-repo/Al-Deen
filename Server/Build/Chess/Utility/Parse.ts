import FS from 'fs';
import Path from 'path';

export function Walk_Directory(Directory_Path: string, File_List: string[] = []): string[] {
  if (!FS.existsSync(Directory_Path)) {
    console.warn(`[WARN] Directory does not exist: ${Directory_Path}`);
    return File_List;
  }

  const Files = FS.readdirSync(Directory_Path);
  for (const File of Files) {
    const Full_Path = Path.join(Directory_Path, File);
    if (FS.statSync(Full_Path).isDirectory()) {
      Walk_Directory(Full_Path, File_List);
    } else if (File.endsWith('.json')) {
      File_List.push(Full_Path);
    }
  }

  return File_List;
}

export function Sanitize_Table_Name(Name: string): string {
  return Name.replace(/[^a-zA-Z0-9_]/g, '_');
}