import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    { error: "Production seeding is disabled over HTTP. Run the checked-in seed script from a trusted operator machine." },
    { status: 403 },
  )
}
