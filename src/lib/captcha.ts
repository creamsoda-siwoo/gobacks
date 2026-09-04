import { SignJWT, jwtVerify } from "jose";

// `||` on purpose, not `??` — an env var saved with a blank value is just
// as "unset" as one that's missing entirely (see src/db/client.ts).
const secret = new TextEncoder().encode(
  process.env.CAPTCHA_SECRET || "dev-only-captcha-secret-change-me"
);

export interface CaptchaChallenge {
  question: string;
  token: string;
}

// Stateless math captcha: the answer is embedded in a short-lived signed
// token instead of server-side session storage, so it works fine across
// serverless invocations.
export async function createCaptcha(): Promise<CaptchaChallenge> {
  const a = Math.floor(Math.random() * 8) + 1;
  const b = Math.floor(Math.random() * 8) + 1;
  const answer = a + b;

  const token = await new SignJWT({ answer })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(secret);

  return { question: `${a} + ${b} = ?`, token };
}

export async function verifyCaptcha(
  token: string,
  userAnswer: number
): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.answer === userAnswer;
  } catch {
    return false;
  }
}
