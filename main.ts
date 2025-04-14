// Copyright 2025 Yoshiya Hinosawa. MIT license.

import { parseArgs } from "@std/cli/parse-args";
import { dedent } from "@std/text/unstable_dedent";
import config from "./deno.json" with { type: "json" };

function parse(text: string): any {
  // Placeholder for the actual parsing logic
  return text;
}

function execute(ast: any): any {
  // Placeholder for the actual execution logic
  return ast;
}

export async function main() {
  const args = parseArgs(Deno.args, {
    boolean: ["help", "version"],
    alias: {
      h: "help",
      v: "version",
    }
  });

  if (args.version) {
    console.log(`lk version ${config.version}`);
    Deno.exit(0);
  }

  if (args.help) {
    console.log(dedent`
      Usage: lk [options] <file>

      Options:
        -h, --help     Show this help message
        -v, --version  Show version information
    `);
    Deno.exit(0);
  }

  const file = args._[0];
  if (!file) {
    console.error("Error: No file specified.");
    console.error("Use -h or --help for more information.");
    Deno.exit(1);
  }

  try {
    const text = await Deno.readTextFile(file);
    const ast = parse(text);
    const result = execute(ast);
    console.log(result);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
