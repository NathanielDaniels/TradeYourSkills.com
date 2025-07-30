import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/api/auth/signin");

  return (
    <main>
      <h1>Messages</h1>
      <p>This will be your inbox for user-to-user messages.</p>
    </main>
  );
}
