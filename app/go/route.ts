import { NextResponse } from "next/server";

import { referralLink } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.redirect(referralLink, 307);
}
