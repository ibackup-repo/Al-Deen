import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname, "../../../");
export const DATA_DIR = path.join(ROOT_DIR, "Server/Data/Language");
export const OUTPUT_DIR = path.join(ROOT_DIR, "Server/Asset/Corpus/Language");

export const SUPPORTED_LANGUAGES = ["English", "Dutch", "Arabic", "Pashto"];