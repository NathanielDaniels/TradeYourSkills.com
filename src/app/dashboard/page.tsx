import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/api/auth/signin");

  const user = session.user;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Banner */}
        <section className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-xl p-8 text-white mb-8 shadow-xl">
          <div className="flex items-center gap-6">
            {user?.image && (
              <div className="relative">
                <Image
                  src={user.image}
                  alt={user.name || "User"}
                  width={80}
                  height={80}
                  className="rounded-full border-4 border-white shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 border-2 border-white rounded-full"></div>
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user?.name?.split(" ")[0] || "User"}! 👋
              </h1>
              <p className="text-blue-100 text-lg">
                Ready to explore new skills and connect with others?
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Your Skills"
            value="0"
            icon="🎯"
            color="from-green-400 to-green-600"
          />
          <StatCard
            title="Active Swaps"
            value="0"
            icon="🔄"
            color="from-blue-400 to-blue-600"
          />
          <StatCard
            title="Messages"
            value="0"
            icon="💬"
            color="from-purple-400 to-purple-600"
          />
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <DashboardCard
              title="Add a New Skill"
              description="List a skill or service you want to offer."
              href="/profile"
              icon="🎨"
              color="bg-green-500"
            />
            <DashboardCard
              title="Browse Listings"
              description="See what others are offering and request swaps."
              href="/listings"
              icon="🔍"
              color="bg-blue-500"
            />
            <DashboardCard
              title="Check Messages"
              description="View and reply to swap messages."
              href="/messages"
              icon="📨"
              color="bg-purple-500"
            />
            <DashboardCard
              title="Swap Requests"
              description="Track your active and pending trades."
              href="/swaps"
              icon="⚡"
              color="bg-yellow-500"
            />
          </div>
        </section>

        {/* Recent Activity Section */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Recent Activity
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-gray-400 dark:text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No Recent Activity
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start by adding some skills or browsing available listings
              </p>
              <Link
                href="/profile"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                Get Started
                <svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
    // <main className="max-w-5xl mx-auto py-10 px-6">
    //   <section className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white mb-8 flex items-center gap-4">
    //     {user?.image && (
    //       <Image
    //         src={user.image}
    //         alt={user.name || "User"}
    //         width={60}
    //         height={60}
    //         className="rounded-full border-2 border-white"
    //       />
    //     )}
    //     <div>
    //       <h1 className="text-2xl font-bold">
    //         Welcome back, {user?.name || "User"}!
    //       </h1>
    //       <p className="text-gray-200">Here’s what you can do today:</p>
    //     </div>
    //   </section>

    //   //Quick Actions
    //   <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
    //     <DashboardCard
    //       title="Add a New Skill"
    //       description="List a skill or service you want to offer."
    //       href="/profile"
    //       color="bg-green-500"
    //     />
    //     <DashboardCard
    //       title="Browse Listings"
    //       description="See what others are offering and request swaps."
    //       href="/listings"
    //       color="bg-blue-500"
    //     />
    //     <DashboardCard
    //       title="Check Messages"
    //       description="View and reply to swap messages."
    //       href="/messages"
    //       color="bg-purple-500"
    //     />
    //     <DashboardCard
    //       title="Swap Requests"
    //       description="Track your active and pending trades."
    //       href="/swaps"
    //       color="bg-yellow-500"
    //     />
    //   </section>
    // </main>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: string;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center">
        <div
          className={`w-12 h-12 bg-gradient-to-r ${color} rounded-lg flex items-center justify-center text-2xl mb-4`}
        >
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  href,
  icon,
  color,
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      <div
        className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-200`}
      >
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium group-hover:translate-x-1 transition-transform duration-200">
        Get Started
        <svg
          className="w-4 h-4 ml-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </Link>
  );
}

// function DashboardCard({
//   title,
//   description,
//   href,
//   color,
// }: {
//   title: string;
//   description: string;
//   href: string;
//   color: string;
// }) {
//   return (
//     <Link
//       href={href}
//       className={`${color} p-6 rounded-lg text-white hover:opacity-90 transition`}
//     >
//       <h2 className="text-lg font-bold mb-2">{title}</h2>
//       <p className="text-sm opacity-90">{description}</p>
//     </Link>
//   );
// }
