import { createInsforgeServer } from "./insforge-server";

export async function getCurrentUser() {
  const insforge = await createInsforgeServer();
  const { data } = await insforge.auth.getCurrentUser();
  return data?.user ?? null;
}
