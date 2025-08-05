import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";

export default async function ListingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/api/auth/signin");

  return (
    <main>
      <h1>Listings</h1>
      <p>Browse and search available skills here.</p>
    </main>
  );
}

