import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const create = createUploadthing();

const auth = async (req: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return { id: session.user.email };
};

export const ourFileRouter = {
  avatar: create({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const user = await auth(req);
      if (!user) throw new UploadThingError("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const publicUrl = `https://utfs.io/f/${file.key}`;

      // Return the file URL to the client
      return { url: publicUrl, uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
