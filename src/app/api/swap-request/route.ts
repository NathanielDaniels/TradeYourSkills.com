// src/app/api/swap-requests/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { generalApiLimit, getClientIP } from "@/lib/ratelimit";
import { sanitizeText } from "@/lib/sanitize";
import { swapRequestCreateSchema } from "@/lib/validators";
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

    if (!user.id) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    // Input validation and sanitization
    const body = await request.json();

    const sanitizedInput = {
      message: body.message ? sanitizeText(body.message, 500) : body.message,
      recipientId: body.recipientId,
      offeredListingId: body.offeredListingId,
      requestedListingId: body.requestedListingId,
    };

    const validatedData = swapRequestCreateSchema.parse(sanitizedInput);

    // Create swap request with comprehensive validation
    const swapRequest = await prisma.$transaction(async (tx) => {
      if (!user?.id) {
        throw new Error("User authentication lost");
      }

      // Can't request from yourself
      if (validatedData.recipientId === user.id) {
        throw new Error("Cannot create swap request with yourself");
      }

      // Verify recipient exists
      const recipient = await tx.user.findUnique({
        where: { id: validatedData.recipientId },
        select: { id: true },
      });

      if (!recipient) {
        throw new Error("Recipient not found");
      }

      // Verify requested listing exists and is active
      const requestedListing = await tx.listing.findUnique({
        where: { id: validatedData.requestedListingId },
        select: {
          id: true,
          userId: true,
          isActive: true,
          title: true,
        },
      });

      if (!requestedListing || !requestedListing.isActive) {
        throw new Error("Requested listing not found or inactive");
      }

      // Requested listing must belong to recipient
      if (requestedListing.userId !== validatedData.recipientId) {
        throw new Error("Requested listing does not belong to recipient");
      }

      // Verify offered listing (if provided) belongs to requester and is active
      let offeredListing = null;
      if (validatedData.offeredListingId) {
        offeredListing = await tx.listing.findUnique({
          where: { id: validatedData.offeredListingId },
          select: {
            id: true,
            userId: true,
            isActive: true,
            title: true,
          },
        });

        if (!offeredListing || !offeredListing.isActive) {
          throw new Error("Offered listing not found or inactive");
        }

        if (offeredListing.userId !== user.id) {
          throw new Error("Offered listing does not belong to you");
        }
      }

      // Check for existing pending request between these parties for same listings
      const existingRequest = await tx.swapRequest.findFirst({
        where: {
          requesterId: user.id,
          recipientId: validatedData.recipientId,
          requestedListingId: validatedData.requestedListingId,
          offeredListingId: validatedData.offeredListingId,
          status: "pending",
        },
      });

      if (existingRequest) {
        throw new Error("You already have a pending request for this swap");
      }

      return tx.swapRequest.create({
        data: {
          message: validatedData.message,
          requesterId: user.id,
          recipientId: validatedData.recipientId,
          offeredListingId: validatedData.offeredListingId,
          requestedListingId: validatedData.requestedListingId,
          status: "pending",
        },
        select: {
          id: true,
          message: true,
          status: true,
          createdAt: true,
          requester: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          recipient: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          offeredListing: {
            select: {
              id: true,
              title: true,
              skill: {
                select: {
                  name: true,
                  category: true,
                },
              },
            },
          },
          requestedListing: {
            select: {
              id: true,
              title: true,
              skill: {
                select: {
                  name: true,
                  category: true,
                },
              },
            },
          },
        },
      });
    });

    console.log(
      `Swap request created: ${user.id} -> ${validatedData.recipientId}`
    );
    Sentry.addBreadcrumb({
      message: "Swap request created",
      category: "swap-request",
      level: "info",
      data: {
        requesterId: user.id,
        recipientId: validatedData.recipientId,
        requestedListingId: validatedData.requestedListingId,
      },
    });

    return NextResponse.json(swapRequest);
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
      const errorMessages = {
        "Cannot create swap request with yourself": { status: 400 },
        "Recipient not found": { status: 404 },
        "Requested listing not found or inactive": { status: 404 },
        "Offered listing not found or inactive": { status: 404 },
        "Requested listing does not belong to recipient": { status: 400 },
        "Offered listing does not belong to you": { status: 400 },
        "You already have a pending request for this swap": { status: 409 },
      };

      const errorConfig =
        errorMessages[error.message as keyof typeof errorMessages];
      if (errorConfig) {
        return NextResponse.json(
          { error: error.message },
          { status: errorConfig.status }
        );
      }
    }

    console.error("Swap request creation error:", error);
    Sentry.captureException(error, {
      tags: {
        area: "swap-request-creation",
        ip: clientIP,
        userId: user?.id,
      },
    });

    return NextResponse.json(
      { error: "Failed to create swap request" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const clientIP = getClientIP(request);
  let user: Session["user"] | null = null;

  try {
    // Rate limiting
    const { success } = await generalApiLimit.limit(clientIP);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // Authentication required for viewing swap requests
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all"; // "sent", "received", "all"
    const status = searchParams.get("status"); // "pending", "accepted", "declined"
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      20,
      Math.max(1, parseInt(searchParams.get("limit") || "10"))
    );
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (type === "sent") {
      where.requesterId = user.id;
    } else if (type === "received") {
      where.recipientId = user.id;
    } else {
      // all - both sent and received
      where.OR = [{ requesterId: user.id }, { recipientId: user.id }];
    }

    if (
      status &&
      ["pending", "accepted", "declined", "cancelled"].includes(status)
    ) {
      where.status = status;
    }

    const [swapRequests, total] = await Promise.all([
      prisma.swapRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          message: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          requester: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          recipient: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          offeredListing: {
            select: {
              id: true,
              title: true,
              skill: {
                select: {
                  name: true,
                  category: true,
                },
              },
            },
          },
          requestedListing: {
            select: {
              id: true,
              title: true,
              skill: {
                select: {
                  name: true,
                  category: true,
                },
              },
            },
          },
        },
      }),
      prisma.swapRequest.count({ where }),
    ]);

    return NextResponse.json({
      swapRequests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Swap requests fetch error:", error);
    Sentry.captureException(error, {
      tags: {
        area: "swap-request-fetch",
        ip: clientIP,
        userId: user?.id,
      },
    });

    return NextResponse.json(
      { error: "Failed to fetch swap requests" },
      { status: 500 }
    );
  }
}
