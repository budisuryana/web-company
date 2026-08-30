/**
 * One-time creation of the first CMS administrator.
 *
 * Automatic seeding no longer creates an account in production — deliberately,
 * because the account it used to create had a password published in this
 * repository. Someone has to choose a real credential instead, and this is the
 * only supported way to do it.
 *
 * The password is read without echo by default, hashed with the same
 * `hashPassword` the login path verifies against, and never printed, logged or
 * returned. Nothing here touches the demo seed policy.
 *
 *   pnpm admin:create
 *   pnpm admin:create --username budi --email budi@example.com --name "Budi"
 */
import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { users } from "../drizzle/schema";
import { hashPassword } from "./_core/password";
import { getDb, getUserByUsernameOrEmail } from "./db";

const MIN_PASSWORD_LENGTH = 12;

/** Passwords this tool exists to stop being used. */
const REFUSED_PASSWORDS = new Set(["admin123", "password", "admin", "12345678", "changeme"]);

const KEY_ENTER = ["\r", "\n"];
const KEY_CTRL_C = String.fromCharCode(3); // Ctrl-C
const KEY_BACKSPACE = [String.fromCharCode(127), String.fromCharCode(8)]; // DEL, BS
const SPACE = " ";

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const body = token.slice(2);
    const equals = body.indexOf("=");
    if (equals !== -1) {
      // --key=value, splitting on the first "=" so the value may contain more.
      out[body.slice(0, equals)] = body.slice(equals + 1);
      continue;
    }
    const key = body;
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      out[key] = next;
      i += 1;
    } else {
      out[key] = "true";
    }
  }
  return out;
}

function maskedTarget(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.host}${parsed.pathname}`;
  } catch {
    return "(unparseable DATABASE_URL)";
  }
}

/**
 * Reads a line without echoing it, so the password never reaches the terminal
 * scrollback or a screen recording.
 */
function promptHidden(question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    if (!stdin.isTTY) {
      reject(new Error("No interactive terminal. Pass --password, or run this in a real shell."));
      return;
    }

    process.stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let value = "";
    const cleanup = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off("data", onData);
    };

    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (KEY_ENTER.includes(char)) {
          cleanup();
          process.stdout.write("\n");
          resolve(value);
          return;
        }
        if (char === KEY_CTRL_C) {
          cleanup();
          process.stdout.write("\n");
          reject(new Error("Cancelled."));
          return;
        }
        if (KEY_BACKSPACE.includes(char)) {
          value = value.slice(0, -1);
          continue;
        }
        // Ignore other control characters rather than storing them.
        if (char >= SPACE) value += char;
      }
    };

    stdin.on("data", onData);
  });
}

function fail(message: string): never {
  console.error(`[admin:create] ${message}`);
  process.exit(1);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const url = process.env.DATABASE_URL?.trim();
  if (!url) fail("DATABASE_URL is not set. Refusing to run.");

  const db = await getDb();
  if (!db) fail(`Could not connect to ${maskedTarget(url)}. Nothing was written.`);

  console.log(`[admin:create] Target: ${maskedTarget(url)}`);

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  let rlClosed = false;
  const closeRl = () => {
    if (!rlClosed) {
      rlClosed = true;
      rl.close();
    }
  };

  try {
    const username = (args.username ?? (await rl.question("Username: "))).trim();
    if (!username) fail("Username is required.");
    if (username.length > 80) fail("Username must be 80 characters or fewer.");

    const email = (args.email ?? (await rl.question("Email: "))).trim();
    if (!email || !email.includes("@")) fail("A valid email is required.");
    if (email.length > 320) fail("Email must be 320 characters or fewer.");

    const name = (args.name ?? (await rl.question(`Display name [${username}]: `))).trim() || username;

    const slug = username.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (!slug) fail("Username must contain at least one letter or digit.");
    const openId = `local_${slug}`.slice(0, 64);

    // Checked before asking for a password, so a doomed run ends early.
    for (const identifier of [username, email, openId]) {
      const clash = await getUserByUsernameOrEmail(identifier);
      if (clash) fail(`An account matching "${identifier}" already exists (id ${clash.id}). Refusing to overwrite it.`);
    }

    closeRl();

    let password: string;
    if (args.password) {
      console.warn("[admin:create] --password was read from the command line; your shell may record it in history.");
      password = args.password;
    } else {
      password = await promptHidden("Password (hidden): ");
      const confirmation = await promptHidden("Confirm password: ");
      if (password !== confirmation) fail("Passwords do not match. Nothing was written.");
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      fail(`Password must be at least ${MIN_PASSWORD_LENGTH} characters. Nothing was written.`);
    }
    if (REFUSED_PASSWORDS.has(password.toLowerCase())) {
      fail("That password is one of the defaults this tool exists to replace. Nothing was written.");
    }

    await db.insert(users).values({
      openId,
      username,
      name,
      email,
      passwordHash: hashPassword(password),
      loginMethod: "credentials",
      role: "admin",
      lastSignedIn: new Date(),
    });

    // Deliberately reports the identity only — never the password.
    console.log("[admin:create] Administrator created.");
    console.log(`[admin:create]   username: ${username}`);
    console.log(`[admin:create]   email:    ${email}`);
    console.log(`[admin:create]   openId:   ${openId}`);
    console.log("[admin:create]   role:     admin");
    if (!process.env.JWT_SECRET?.trim()) {
      console.warn("[admin:create] JWT_SECRET is not set — sign-in will fail until it is configured.");
    }
    process.exit(0);
  } finally {
    closeRl();
  }
}

main().catch((error) => {
  console.error("[admin:create] Failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
