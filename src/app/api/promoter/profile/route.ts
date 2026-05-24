import { NextResponse } from "next/server";
import { requirePromoter } from "@/lib/auth/require-promoter";
import { getPromoterProfile, updatePromoterProfile } from "@/lib/data/promoter-profile";

export async function GET(request: Request) {
  const auth = await requirePromoter(request);
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getPromoterProfile(auth.user!.id, auth.supabase);
  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const auth = await requirePromoter(request);
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  try {
    const profile = await updatePromoterProfile(
      auth.user!.id,
      {
        display_name: typeof body.display_name === "string" ? body.display_name : "",
        bio: typeof body.bio === "string" ? body.bio : "",
        contact_phone: typeof body.contact_phone === "string" ? body.contact_phone : "",
        contact_email: typeof body.contact_email === "string" ? body.contact_email : "",
        profile_image_url:
          typeof body.profile_image_url === "string" ? body.profile_image_url : "",
        slug: typeof body.slug === "string" ? body.slug : "",
      },
      auth.supabase,
    );
    return NextResponse.json({ profile });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Save failed" },
      { status: 400 },
    );
  }
}
