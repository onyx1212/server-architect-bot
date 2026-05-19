import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import type { ServerBlueprint, UserConversation, UserWarnings } from "./types.js";

const DATA_DIR = join(process.cwd(), "data");

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function readJson<T>(file: string, fallback: T): T {
  ensureDataDir();
  const path = join(DATA_DIR, file);
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function writeJson(file: string, data: unknown) {
  ensureDataDir();
  writeFileSync(join(DATA_DIR, file), JSON.stringify(data, null, 2), "utf8");
}

let blueprints: ServerBlueprint[] = readJson<ServerBlueprint[]>("blueprints.json", []);
let nextId = blueprints.length > 0 ? Math.max(...blueprints.map((b) => b.id)) + 1 : 1;

export function saveBlueprint(bp: Omit<ServerBlueprint, "id">): ServerBlueprint {
  const full: ServerBlueprint = { ...bp, id: nextId++ };
  blueprints.push(full);
  writeJson("blueprints.json", blueprints);
  return full;
}

export function getBlueprint(id: number): ServerBlueprint | undefined {
  return blueprints.find((b) => b.id === id);
}

export function getUserBlueprints(userId: string): ServerBlueprint[] {
  return blueprints.filter((b) => b.userId === userId);
}

const conversations = new Map<string, UserConversation>();

export function getConversation(userId: string): UserConversation | undefined {
  return conversations.get(userId);
}

export function setConversation(userId: string, conv: UserConversation) {
  conversations.set(userId, conv);
}

export function deleteConversation(userId: string) {
  conversations.delete(userId);
}

const warnings = new Map<string, Map<string, UserWarnings>>();

function guildWarnings(guildId: string): Map<string, UserWarnings> {
  if (!warnings.has(guildId)) warnings.set(guildId, new Map());
  return warnings.get(guildId)!;
}

export function getWarnings(guildId: string, userId: string): UserWarnings {
  return guildWarnings(guildId).get(userId) ?? { count: 0, lastWarning: "" };
}

export function addWarning(guildId: string, userId: string): UserWarnings {
  const gw = guildWarnings(guildId);
  const current = gw.get(userId) ?? { count: 0, lastWarning: "" };
  const updated: UserWarnings = {
    count: current.count + 1,
    lastWarning: new Date().toISOString(),
  };
  if (updated.count >= 3) {
    updated.timedOutUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    updated.count = 0;
  }
  gw.set(userId, updated);
  return updated;
}
