import { supabase } from "./supabaseClient.js";

async function loadSidebarProfile() {
  const avatar = document.getElementById("sidebarAvatar");

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Fetch profile row
    const { data, error } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single();

    if (error) throw error;

    // ✅ Use Supabase image if exists
    if (data?.avatar_url) {
      avatar.src = data.avatar_url;
    } else {
      avatar.src = "/images/default-avatar.png";
    }
  } catch (err) {
    console.error("Sidebar profile load error:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadSidebarProfile);
