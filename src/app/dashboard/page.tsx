import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/api/auth/signin");

  const user = session.user;

  return (
    <main className="max-w-5xl mx-auto py-10 px-6">
      {/* Welcome Banner */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white mb-8 flex items-center gap-4">
        {user?.image && (
          <Image
            src={user.image}
            alt={user.name || "User"}
            width={60}
            height={60}
            className="rounded-full border-2 border-white"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {user?.name || "User"}!
          </h1>
          <p className="text-gray-200">Here’s what you can do today:</p>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardCard
          title="Add a New Skill"
          description="List a skill or service you want to offer."
          href="/profile"
          color="bg-green-500"
        />
        <DashboardCard
          title="Browse Listings"
          description="See what others are offering and request swaps."
          href="/listings"
          color="bg-blue-500"
        />
        <DashboardCard
          title="Check Messages"
          description="View and reply to swap messages."
          href="/messages"
          color="bg-purple-500"
        />
        <DashboardCard
          title="Swap Requests"
          description="Track your active and pending trades."
          href="/swaps"
          color="bg-yellow-500"
        />
      </section>
    </main>
  );
}

function DashboardCard({
  title,
  description,
  href,
  color,
}: {
  title: string;
  description: string;
  href: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className={`${color} p-6 rounded-lg text-white hover:opacity-90 transition`}
    >
      <h2 className="text-lg font-bold mb-2">{title}</h2>
      <p className="text-sm opacity-90">{description}</p>
    </Link>
  );
}
