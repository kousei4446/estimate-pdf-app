import { createApp } from "./presentation/http/app.js";

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const app = createApp();

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
