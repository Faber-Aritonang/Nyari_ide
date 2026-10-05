import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/session";

export default async function Home() {
  const user = await getAuthUser();

  if (user) {
    redirect("/chat");
  } else {
    redirect("/login");
  }
}
