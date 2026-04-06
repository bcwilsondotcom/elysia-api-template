import app from "./index";
import { createLogger } from "./lib/logger";

const log = createLogger({ module: "server" });
const port = process.env.PORT || 3000;

app.listen(port, () => {
  log.info({ port }, "server started");
});
