import concurrently from "concurrently";
import { execa } from "execa";

await execa("npm", ["run", "build"], { stdio: "inherit" });

const { result } = concurrently(
  [
    {
      name: "ts",
      command: "tsc -p tsconfig.app.json --watch --preserveWatchOutput",
    },
    {
      name: "css",
      command:
        "tailwindcss -i ./public/input.css -o ./public/output.css --watch",
    },
    {
      name: "server",
      command:
        "browser-sync start --server public --files public/**/* --port 3000 --no-open --no-notify",
    },
  ],
  {
    killOthersOn: ["failure", "success"],
    prefix: "name",
  },
);

await result;
