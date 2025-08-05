import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Image from "next/image";

// interface ProfilePageProps {
//   params: { username: string };
// }

// export default async function UserProfilePage({ params }: ProfilePageProps) {
// export default async function UserProfilePage({
//   params,
// }: {
//   params: { username: string };
// }) {
export default async function UserProfilePage() {
  //   const { username } = params;

  //   const user = await prisma.user.findUnique({
  //     where: { username },
  //     select: {
  //       name: true,
  //       username: true,
  //       bio: true,
  //       location: true,
  //       avatar: true,
  //       skills: { select: { id: true, name: true }, orderBy: { order: "asc" } },
  //     },
  //   });

  //   if (!user) return notFound();

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      {/* <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="flex items-center gap-6 mb-8">
          <div className="relative w-24 h-24">
            <Image
              src={user.avatar || "/default-avatar.png"}
              alt={`${user.name || user.username}'s avatar`}
              fill
              className="rounded-full object-cover border"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {user.name || user.username}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">@{user.username}</p>
            {user.location && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                📍 {user.location}
              </p>
            )}
          </div>
        </header>

        {user.bio && (
          <section className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Bio
            </h2>
            <p className="mt-2 text-gray-700 dark:text-gray-300">{user.bio}</p>
          </section>
        )}

        <section>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Skills
          </h2>
          {user.skills.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {user.skills.map((skill) => (
                <li
                  key={skill.id}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 text-sm rounded-full"
                >
                  {skill.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              No skills added yet.
            </p>
          )}
        </section>
      </div> */}
    </main>
  );
}
