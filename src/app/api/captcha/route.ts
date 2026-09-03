import { NextResponse } from "next/server";
import { createCaptcha } from "@/lib/captcha";

export async function GET() {
  const challenge = await createCaptcha();
  return NextResponse.json(challenge);
}
