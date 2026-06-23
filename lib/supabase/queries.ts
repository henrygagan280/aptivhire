import { createClient } from "@/lib/supabase/server";

export async function getCurrentUserAndTeam() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      teamId: null,
    };
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    user,
    teamId: membership?.team_id ?? null,
  };
}