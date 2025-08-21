import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthenticatedUser,
  verifySwapRequestAccess,
  verifySwapRequestResponse,
} from "@/lib/auth-utils";
import { generalApiLimit, getClientIP } from "@/lib/ratelimit";
import { sanitizeText } from "@/lib/sanitize";
import { swapRequestResponseSchema } from "@/lib/validators";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import type { Session } from "next-auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Swap request ID is required" },
        { status: 400 }
      );
    }

    // Verify access to this swap request
    const { error: accessError } = await verifySwapRequestAccess(id, user.id);
    if (accessError) return accessError;

    const swapRequest = await prisma.swapRequest.findUnique({
      where: { id },
      select: {
        id: true,
        message: true,
        responseMessage: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        requester: {
          select: {
            id: true,
            name: true,
            avatar: true,
            bio: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            avatar: true,
            bio: true,
          },
        },
        offeredListing: {
          select: {
            id: true,
            title: true,
            description: true,
            location: true,
            skill: {
              select: {
                id: true,
                name: true,
                category: true,
                description: true,
              },
            },
          },
        },
        requestedListing: {
          select: {
            id: true,
            title: true,
            description: true,
            location: true,
            skill: {
              select: {
                id: true,
                name: true,
                category: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!swapRequest) {
      return NextResponse.json(
        { error: "Swap request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(swapRequest);
  } catch (error) {
    console.error("Swap request fetch error:", error);
    Sentry.captureException(error, {
      tags: {
        area: "swap-request-fetch-single",
        ip: clientIP,
        userId: user?.id,
        swapRequestId: params.id,
      },
    });

    return NextResponse.json(
      { error: "Failed to fetch swap request" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Swap request ID is required" },
        { status: 400 }
      );
    }

    // Input validation and sanitization
    const body = await request.json();

    const sanitizedInput = {
      status: body.status,
      responseMessage: body.responseMessage
        ? sanitizeText(body.responseMessage, 300)
        : body.responseMessage,
    };

    const validatedData = swapRequestResponseSchema.parse(sanitizedInput);

    // Handle different status updates with business logic
    const updatedSwapRequest = await prisma.$transaction(async (tx) => {
      if (!user?.id) {
        throw new Error("User authentication lost");
      }

      // Get current swap request
      const currentSwapRequest = await tx.swapRequest.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          requesterId: true,
          recipientId: true,
          offeredListingId: true,
          requestedListingId: true,
        },
      });

      if (!currentSwapRequest) {
        throw new Error("Swap request not found");
      }

      // Handle different status transitions
      if (
        validatedData.status === "accepted" ||
        validatedData.status === "declined"
      ) {
        // Only recipient can accept/decline
        const { error: responseError } = await verifySwapRequestResponse(
          id,
          user.id
        );
        if (responseError)
          throw new Error("Only recipient can respond to requests");

        // If accepting, handle the swap logic
        if (validatedData.status === "accepted") {
          // Mark both listings as inactive (they're being swapped)
          const listingUpdates = [];

          if (currentSwapRequest.offeredListingId) {
            listingUpdates.push(
              tx.listing.update({
                where: { id: currentSwapRequest.offeredListingId },
                data: { isActive: false },
              })
            );
          }

          if (currentSwapRequest.requestedListingId) {
            listingUpdates.push(
              tx.listing.update({
                where: { id: currentSwapRequest.requestedListingId },
                data: { isActive: false },
              })
            );
          }

          await Promise.all(listingUpdates);

          // Cancel any other pending requests for these listings
          await tx.swapRequest.updateMany({
            where: {
              AND: [
                {
                  OR: [
                    { offeredListingId: currentSwapRequest.offeredListingId },
                    { requestedListingId: currentSwapRequest.offeredListingId },
                    { offeredListingId: currentSwapRequest.requestedListingId },
                    {
                      requestedListingId: currentSwapRequest.requestedListingId,
                    },
                  ],
                },
                { status: "pending" },
                { id: { not: id } }, // Don't update the current request
              ],
            },
            data: { status: "cancelled" },
          });
        }
      }

      // Update the swap request
      return tx.swapRequest.update({
        where: { id },
        data: {
          status: validatedData.status,
          responseMessage: validatedData.responseMessage,
        },
        select: {
          id: true,
          message: true,
          responseMessage: true,
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
      });
    });

    console.log(`Swap request ${validatedData.status}: ${user.id} - ${id}`);
    Sentry.addBreadcrumb({
      message: `Swap request ${validatedData.status}`,
      category: "swap-request",
      level: "info",
      data: {
        userId: user.id,
        swapRequestId: id,
        status: validatedData.status,
      },
    });

    return NextResponse.json(updatedSwapRequest);
  } catch (error) {
    if (!user?.id) {
      throw new Error("User authentication lost");
    }
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
        "Swap request not found": { status: 404 },
        "Only recipient can respond to requests": { status: 403 },
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

    console.error("Swap request update error:", error);
    Sentry.captureException(error, {
      tags: {
        area: "swap-request-update",
        ip: clientIP,
        userId: user.id,
        swapRequestId: params.id,
      },
    });

    return NextResponse.json(
      { error: "Failed to update swap request" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Swap request ID is required" },
        { status: 400 }
      );
    }

    // Verify access and check if user can cancel
    const { error: accessError, swapRequest } = await verifySwapRequestAccess(
      id,
      user.id
    );
    if (accessError) return accessError;

    // Only requester can cancel, and only if status is pending
    if (swapRequest?.requesterId !== user.id) {
      return NextResponse.json(
        { error: "Only the requester can cancel this swap request" },
        { status: 403 }
      );
    }

    if (swapRequest?.status !== "pending") {
      return NextResponse.json(
        { error: "Can only cancel pending swap requests" },
        { status: 409 }
      );
    }

    // Update status to cancelled instead of hard delete
    await prisma.swapRequest.update({
      where: { id },
      data: { status: "cancelled" },
    });

    console.log(`Swap request cancelled: ${user.id} - ${id}`);
    Sentry.addBreadcrumb({
      message: "Swap request cancelled",
      category: "swap-request",
      level: "info",
      data: { userId: user.id, swapRequestId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Swap request cancellation error:", error);
    Sentry.captureException(error, {
      tags: {
        area: "swap-request-cancellation",
        ip: clientIP,
        userId: user?.id,
        swapRequestId: params.id,
      },
    });

    return NextResponse.json(
      { error: "Failed to cancel swap request" },
      { status: 500 }
    );
  }
}
