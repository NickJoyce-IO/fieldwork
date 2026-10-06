// Maintainer-side commands for the Fieldwork monorepo (ADR-0002). These run in
// monorepo CI and on maintainers' machines, and are never shipped to Learners.
// Learner-side commands live in each Track's runner instead.
import { verifyCommand } from "./commands/verify.ts";

interface Command {
  summary: string;
  /** Receives the arguments after the command name; returns the exit code. */
  run: (args: string[]) => Promise<number>;
}

// Each maintainer command registers itself here, e.g. publish (#5).
const commands: Record<string, Command> = {
  verify: { summary: "Check Projects' Steps against their starter code and Reference Solutions", run: verifyCommand },
};

const [name, ...args] = process.argv.slice(2);
const command = name === undefined ? undefined : commands[name];

if (command === undefined) {
  if (name !== undefined) console.error(`Unknown command: ${name}\n`);
  console.error(
    ["Usage: npm run fieldwork -- <command> [options]", "", "Commands:"]
      .concat(Object.entries(commands).map(([commandName, { summary }]) => `  ${commandName}  ${summary}`))
      .join("\n"),
  );
  process.exitCode = 2;
} else {
  process.exitCode = await command.run(args);
}
