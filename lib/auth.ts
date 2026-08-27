import { createClient } from "@/lib/supabase/client";

export async function isEmailAllowed(email: string): Promise<boolean> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("allowed_emails")
    .select("id, email")
    .ilike("email", email.trim())
    .maybeSingle();

  if (error) {
    console.error("Whitelist check error:", error);
    return false;
  }
  return data !== null;
}
