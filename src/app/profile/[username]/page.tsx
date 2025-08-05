import { notFound } from "next/navigation";
import Image from "next/image";

async function fetchPublicProfile(username: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/profile/${username}`,
    {
      cache: "no-store",
    }
  );
  if (!res.ok) return null;
  return res.json();
}

export default async function PublicProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const profile = await fetchPublicProfile(params.username);

  if (!profile) return notFound();

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-8">
          <div className="w-28 h-28 mx-auto relative mb-4">
            <Image
              src={profile.avatar || "/default-avatar.png"}
              alt={profile.name}
              fill
              className="rounded-full object-cover border border-gray-300"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {profile.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{profile.location}</p>
        </header>

        {profile.bio && (
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              About Me
            </h2>
            <p className="text-gray-700 dark:text-gray-300">{profile.bio}</p>
          </section>
        )}

        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Skills
          </h2>
          {profile.skills.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {profile.skills.map((skill: { id: string; name: string }) => (
                <li
                  key={skill.id}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
                >
                  {skill.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              This user hasn’t added any skills yet.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
