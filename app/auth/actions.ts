"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function signup(formData: FormData) {
  const supabase = createClient();
  const admin = createAdminClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const track = formData.get("track") as string;
  const experience_level = formData.get("experience_level") as string;

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    // Use admin client — session may not be active yet if email confirmation required
    const { error: profileError } = await admin.from("users").insert({
      id: data.user.id,
      email,
      track: track || null,
      experience_level: experience_level || null,
    });
    if (profileError && profileError.code !== "23505") {
      // 23505 = unique violation (user already exists) — safe to ignore
      console.error("Profile insert error:", profileError.message);
    }
  }

  revalidatePath("/", "layout");
  redirect("/browse");
}

export async function login(formData: FormData) {
  const supabase = createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/browse");
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
