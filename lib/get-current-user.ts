import { createInsforgeServer } from "./insforge-server";

export async function getCurrentUser() {
  try {
    const insforge = await createInsforgeServer();
    const { data } = await insforge.auth.getCurrentUser();
    return data?.user ?? null;
  } catch (error) {
    console.error("[get-current-user] failed to resolve user", error);
    return null;
  }
}
