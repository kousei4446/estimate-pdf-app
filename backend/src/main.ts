import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createApp } from "./presentation/http/app.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const app = createApp();

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
