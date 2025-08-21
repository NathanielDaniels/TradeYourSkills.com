import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { generalApiLimit, getClientIP } from "@/lib/ratelimit";
import { sanitizeText } from "@/lib/sanitize";
import { listingCreateSchema } from "@/lib/validators";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import type { Session } from "next-auth";

export async function POST(request: Request) {
  const clientIP = getClientIP(request);
  let user: Session["user"] | null = null;

  try {
    // Rate limiting
    const { success } = await generalApiLimit.limit(clientIP);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // Authentication
    const { user: authenticatedUser, error: authError } =
      await getAuthenticatedUser(request);
    if (authError) return authError;

    user = authenticatedUser;

    if (!user?.id) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    // Input validation and sanitization
    const body = await request.json();

    const sanitizedInput = {
      title: body.title ? sanitizeText(body.title, 100) : body.title,
      description: body.description
        ? sanitizeText(body.description, 1000)
        : body.description,
      location: body.location
        ? sanitizeText(body.location, 100)
        : body.location,
      availability: body.availability
        ? sanitizeText(body.availability, 200)
        : body.availability,
      skillId: body.skillId,
      isActive: body.isActive,
    };

    const validatedData = listingCreateSchema.parse(sanitizedInput);

    // Create listing with transaction
    const listing = await prisma.$transaction(async (tx) => {
      if (!user?.id) {
        throw new Error("User authentication lost");
      }

      // Verify the skill belongs to the user
      const skill = await tx.skill.findFirst({
        where: {
          id: validatedData.skillId,
          userId: user.id,
        },
      });

      if (!skill) {
        throw new Error("Skill not found or not owned by user");
      }

      // Check for existing active listing for this skill
      const existingListing = await tx.listing.findFirst({
        where: {
          userId: user.id,
          skillId: validatedData.skillId,
          isActive: true,
        },
      });

      if (existingListing) {
        throw new Error("You already have an active listing for this skill");
      }

      return tx.listing.create({
        data: {
          title: validatedData.title,
          description: validatedData.description,
          location: validatedData.location,
          availability: validatedData.availability,
          skillId: validatedData.skillId,
          userId: user.id,
          isActive: validatedData.isActive,
        },
        select: {
          id: true,
          title: true,
          description: true,
          location: true,
          availability: true,
          isActive: true,
          createdAt: true,
          skill: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      });
    });

    console.log(`Listing created: ${user.id} - ${validatedData.title}`);
    Sentry.addBreadcrumb({
      message: "Listing created",
      category: "listing",
      level: "info",
      data: { userId: user.id, listingTitle: validatedData.title },
    });

    return NextResponse.json(listing);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));
      return NextResponse.json(
        { error: "Invalid input data", details: issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message === "Skill not found or not owned by user") {
        return NextResponse.json(
          { error: "Invalid skill selection" },
          { status: 400 }
        );
      }
      if (
        error.message === "You already have an active listing for this skill"
      ) {
        return NextResponse.json(
          { error: "You already have an active listing for this skill" },
          { status: 409 }
        );
      }
    }

    console.error("Listing creation error:", error);
    Sentry.captureException(error, {
      tags: {
        area: "listing-creation",
        ip: clientIP,
        userId: user?.id,
      },
    });

    return NextResponse.json(
      { error: "Failed to create listing" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const clientIP = getClientIP(request);

  try {
    // Rate limit
    const { success } = await generalApiLimit.limit(clientIP);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      20,
      Math.max(1, parseInt(searchParams.get("limit") || "10"))
    );
    const skill = searchParams.get("skill");
    const location = searchParams.get("location");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isActive: true,
    };

    if (skill) {
      where.skill = {
        name: {
          contains: sanitizeText(skill, 50),
          mode: "insensitive",
        },
      };
    }

    if (location) {
      where.location = {
        contains: sanitizeText(location, 100),
        mode: "insensitive",
      };
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          title: true,
          description: true,
          location: true,
          availability: true,
          createdAt: true,
          skill: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    return NextResponse.json({
      listings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Listings fetch error:", error);
    Sentry.captureException(error, {
      tags: {
        area: "listing-fetch",
        ip: clientIP,
      },
    });

    return NextResponse.json(
      { error: "Failed to fetch listings" },
      { status: 500 }
    );
  }
}
