// Copyright 2025 Yoshiya Hinosawa. MIT license.

import { parseArgs } from "@std/cli/parse-args";
import { dedent } from "@std/text/unstable_dedent";
import config from "./deno.json" with { type: "json" };

type TokenType =
  | "LBRACE"
  | "RBRACE"
  | "LPAREN"
  | "RPAREN"
  | "COLON"
  | "ARROW"
  | "EQUALS"
  | "NOT_EQUALS"
  | "AND"
  | "OR"
  | "IDENTIFIER"
  | "COMMENT"
  | "BLOCK_COMMENT"
  | "NEWLINE"
  | "WHITESPACE";

type Token = {
  type: TokenType;
  value: string;
  start: number;
  end: number;
}
type Ast = any; // Placeholder for the actual AST type

const IDENTIFIER_CHAR_REGEXP = /[a-zA-Z0-9_]/;
const WHITESPACE_REGEXP = /\s/;

// inspired by https://craftinginterpreters.com/scanning.html#the-scanner-class
class Scanner {
  #text: string;
  #p: number;

  constructor(text: string) {
    this.#text = text;
    this.#p = 0;
  }

  char(n = 0) {
    if (this.#p + n >= this.#text.length) {
      return null;
    }
    return this.#text[this.#p + n];
  }

  next(n = 1) {
    this.#p += n;
    return this.#text[this.#p] || null;
  }

  matches(str: string, n = 0) {
    return this.#text.startsWith(str, this.#p + n);
  }

  readLine() {
    const start = this.#p;
    while (this.#p < this.#text.length && this.char() !== "\n") {
      this.#p++;
    }
    return this.#text.slice(start, this.#p);
  }

  get finished() {
    return this.#p >= this.#text.length;
  }

  get p() {
    return this.#p;
  }
}

function tokenize(text: string): Token[] {
  const scanner = new Scanner(text);
  let char = scanner.char();

  const tokens: Token[] = [];
  while (char) {
    if (char === "{") {
      tokens.push({
        type: "LBRACE",
        value: "{",
        start: scanner.p,
        end: scanner.p + 1,
      });
      char = scanner.next();
    } else if (char === "}") {
      tokens.push({
        type: "RBRACE",
        value: "}",
        start: scanner.p,
        end: scanner.p + 1,
      });
      char = scanner.next();
    } else if (char === "(") {
      tokens.push({
        type: "LPAREN",
        value: "(",
        start: scanner.p,
        end: scanner.p + 1,
      });
      char = scanner.next();
    } else if (char === ")") {
      tokens.push({
        type: "RPAREN",
        value: ")",
        start: scanner.p,
        end: scanner.p + 1,
      });
      char = scanner.next();
    } else if (char === ":") {
      tokens.push({
        type: "COLON",
        value: ":",
        start: scanner.p,
        end: scanner.p + 1,
      });
      char = scanner.next();
    } else if (scanner.matches("//")) {
      const start = scanner.p;
      const line = scanner.readLine();
      tokens.push({
        type: "COMMENT",
        value: line,
        start,
        end: scanner.p,
      });
      char = scanner.char();
    } else if (scanner.matches("/*")) {
      const start = scanner.p;
      while (char && !scanner.matches("*/")) {
        char = scanner.next();
      }
      if (!char) {
        throw new Error(`Unterminated block comment at position ${scanner.p}`);
      }
      scanner.next(); // consume the closing */
      tokens.push({
        type: "BLOCK_COMMENT",
        value: text.slice(start, scanner.p),
        start,
        end: scanner.p,
      });
      char = scanner.char();
    } else if (scanner.matches("->")) {
      tokens.push({
        type: "ARROW",
        value: "->",
        start: scanner.p,
        end: scanner.p + 2,
      });
      char = scanner.next(2);
    } else if (scanner.matches("=")) {
      tokens.push({
        type: "EQUALS",
        value: "=",
        start: scanner.p,
        end: scanner.p + 1,
      });
      char = scanner.next();
    } else if (scanner.matches("!=")) {
      tokens.push({
        type: "NOT_EQUALS",
        value: "!=",
        start: scanner.p,
        end: scanner.p + 2,
      });
      char = scanner.next(2);
    } else if (scanner.matches("&")) {
      tokens.push({
        type: "AND",
        value: "&",
        start: scanner.p,
        end: scanner.p + 1,
      });
      char = scanner.next();
    } else if (scanner.matches("|")) {
      tokens.push({
        type: "OR",
        value: "|",
        start: scanner.p,
        end: scanner.p + 1,
      });
      char = scanner.next();
    } else if (char === "\n") {
      tokens.push({
        type: "NEWLINE",
        value: "\n",
        start: scanner.p,
        end: scanner.p + 1,
      });
      char = scanner.next();
    } else if (IDENTIFIER_CHAR_REGEXP.test(char)) {
      const start = scanner.p;
      char = scanner.next();
      while (char && IDENTIFIER_CHAR_REGEXP.test(char)) {
        char = scanner.next();
      }
      tokens.push({
        type: "IDENTIFIER",
        value: text.slice(start, scanner.p),
        start,
        end: scanner.p,
      });
    } else if (WHITESPACE_REGEXP.test(char)) {
      const start = scanner.p;
      while (char && WHITESPACE_REGEXP.test(char)) {
        char = scanner.next();
      }
      tokens.push({
        type: "WHITESPACE",
        value: text.slice(start, scanner.p),
        start,
        end: scanner.p,
      });
    } else {
      throw new Error(`Unexpected character '${char}' at position ${scanner.p}`);
    }
  }
  return tokens;
}

function parse(tokens: Token[]): Ast {
  return tokens; // Placeholder for the actual parsing logic
}

function execute(ast: Ast) {
  console.log(ast);
}

function printHelp() {
  console.log(dedent`
    Usage: lk [options] <file>
    Options:
      -h, --help     Show this help message
      -v, --version  Show version information
  `);
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
    printHelp();
    Deno.exit(0);
  }

  const file = String(args._[0] ?? "");
  if (!file) {
    console.error("Error: No file specified.");
    printHelp();
    Deno.exit(1);
  }

  try {
    const text = await Deno.readTextFile(file);
    const tokens = tokenize(text);
    const ast = parse(tokens);
    execute(ast);
  } catch (error) {
    console.log(error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
