import { createClient } from "@/lib/supabase/client";

export async function isEmailAllowed(email: string): Promise<boolean> {
  const supabase = createClient();

  console.log("DEBUG URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("DEBUG KEY ada?:", !!process.env.NEXT_PUBLIC_SUPASE_ANON_KEY);
  console.log("DEBUG email dicari:", JSON.stringify(email));

  const { data, error } await supabase
    .from("allowed_emails")
    .select("id, email")
 .ilike("email", email.trim())
    .maybeSingle();

  console.log("DEBUG data:", data);
  console.log("DEBUG error:", error);

  if (error) {
    console.error("Whitelist check error:", error);
    return false;
  }
  return data !== null;
}
