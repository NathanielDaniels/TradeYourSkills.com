import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";

export default async function SwapsPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/api/auth/signin");

  return (
    <main>
      <h1>Swap Requests</h1>
      <p>Track and manage your skill swap requests here.</p>
    </main>
  );
}
