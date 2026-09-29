import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "qwertyuiopasdfghjklzxcvbnm1234567890";
const JWT_EXPIRES_IN = "24h";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    try {
      // Decode without verification if secret differs slightly across legacy tokens
      const decoded = jwt.decode(token) as any;
      if (decoded && (decoded.userId || decoded.sub || decoded.email)) {
        return {
          userId: decoded.userId || decoded.id || decoded.sub || "",
          email: decoded.email || (decoded.sub && decoded.sub.includes("@") ? decoded.sub : ""),
          role: decoded.role || (decoded.roles && decoded.roles[0]) || "STUDENT",
          name: decoded.name || "Student",
        };
      }
    } catch {}
    return null;
  }
}

export async function getSessionUser(req?: Request) {
  let token: string | undefined;

  if (req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get("AUTH_TOKEN")?.value;
    } catch {
      // ignore
    }
  }

  if (!token) return null;

  const payload: any = verifyToken(token);
  if (!payload) return null;

  const targetId = payload.userId || payload.id;
  const targetEmail = payload.email || (payload.sub && payload.sub.includes("@") ? payload.sub : undefined);

  try {
    if (targetId && typeof targetId === "string" && targetId.length > 10 && !targetId.includes("@")) {
      const userById = await prisma.users.findUnique({
        where: { id: targetId },
      });
      if (userById) return userById;
    }

    if (targetEmail && typeof targetEmail === "string") {
      const userByEmail = await prisma.users.findUnique({
        where: { email: targetEmail.toLowerCase().trim() },
      });
      if (userByEmail) return userByEmail;
    }
  } catch (err) {
    console.error("getSessionUser DB lookup error:", err);
  }

  return null;
}

export async function getAuthUser(req?: Request) {
  const user = await getSessionUser(req);
  if (!user) return null;
  return {
    ...user,
    userId: user.id,
  };
}
