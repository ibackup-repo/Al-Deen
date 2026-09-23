import * as File_System from "fs";
import * as Path_Module from "path";
import { execSync as Execute_Synchronous_Command } from "child_process";
import {
  Quran_Directory,
  Data_Directory,
  Server_Root,
  Archive_Name,
  Release_Uniform_Resource_Locator,
} from "../Config.js";

export async function Ensure_Data_Exists(): Promise<void> {
  if (File_System.existsSync(Quran_Directory) && File_System.readdirSync(Quran_Directory).length > 0) {
    console.log(`Local Quran data found at: ${Quran_Directory}. Skipping download.`);
    return;
  }

  console.log(`Data missing at ${Quran_Directory}. Downloading ${Archive_Name}...`);
  if (!File_System.existsSync(Data_Directory)) {
    File_System.mkdirSync(Data_Directory, { recursive: true });
  }

  const Archive_Path: string = Path_Module.join(Server_Root, Archive_Name);

  const Response_Object: Response = await fetch(Release_Uniform_Resource_Locator);
  if (!Response_Object.ok) {
    throw new Error(`Failed to download archive: ${Response_Object.status} ${Response_Object.statusText}`);
  }

  const Array_Buffer_Data: ArrayBuffer = await Response_Object.arrayBuffer();
  File_System.writeFileSync(Archive_Path, Buffer.from(Array_Buffer_Data));
  console.log(`Archive Downloaded successfully. Extracting...`);

  if (Archive_Name.endsWith(".tar.gz") || Archive_Name.endsWith(".tgz")) {
    Execute_Synchronous_Command(`tar -xzf "${Archive_Path}" -C "${Server_Root}"`);
  } else if (Archive_Name.endsWith(".zip")) {
    Execute_Synchronous_Command(`unzip -q "${Archive_Path}" -d "${Server_Root}"`);
  }

  if (File_System.existsSync(Archive_Path)) {
    File_System.unlinkSync(Archive_Path);
  }

  console.log("Extraction complete.");
}