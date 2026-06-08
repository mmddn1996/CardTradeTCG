"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { USER_COOKIE } from "@/lib/queries";

/**
 * Dev-only: switch the active user (stand-in for auth until Stage 5). Lets us
 * act as either party to exercise offers/counter-offers end to end.
 */
export async function switchUserAction(formData: FormData): Promise<void> {
  const id = String(formData.get("userId") ?? "");
  if (id) {
    (await cookies()).set(USER_COOKIE, id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }
  revalidatePath("/", "layout");
}
