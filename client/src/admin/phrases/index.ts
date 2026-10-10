/** Every admin phrase, merged from one dictionary per area. Each entry carries both languages. */
import { CONTENT_PHRASES } from "./content";
import { DASHBOARD_PHRASES } from "./dashboard";
import { INBOX_PHRASES } from "./inbox";
import { LOGIN_PHRASES } from "./login";
import { PRODUCTS_PHRASES } from "./products";
import { SHELL_PHRASES } from "./shell";
import { USERS_PHRASES } from "./users";

/** Per-area dictionaries, kept separate so a test can catch one phrase translated two ways. */
export const PHRASE_AREAS = {
  shell: SHELL_PHRASES,
  login: LOGIN_PHRASES,
  dashboard: DASHBOARD_PHRASES,
  products: PRODUCTS_PHRASES,
  inbox: INBOX_PHRASES,
  users: USERS_PHRASES,
  content: CONTENT_PHRASES,
} as const;

export const ADMIN_PHRASES = {
  ...SHELL_PHRASES,
  ...LOGIN_PHRASES,
  ...DASHBOARD_PHRASES,
  ...PRODUCTS_PHRASES,
  ...INBOX_PHRASES,
  ...USERS_PHRASES,
  ...CONTENT_PHRASES,
} satisfies Record<string, { id: string; en: string }>;

export type AdminPhrase = keyof typeof ADMIN_PHRASES;
