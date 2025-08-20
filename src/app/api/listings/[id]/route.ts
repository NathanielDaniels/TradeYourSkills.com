// src/app/api/listings/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, verifyListingOwnership } from "@/lib/auth-utils";
import { generalApiLimit, getClientIP } from "@/lib/ratelimit";
import { sanitizeText } from "@/lib/sanitize";
import {
  listingUpdateSchema,
  listingDeleteSchema,
  listingStatusSchema,
} from "@/lib/validators";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import type { Session } from "next-auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const clientIP = getClientIP(request);

  try {
    // Rate limiting
    const { success } = await generalApiLimit.limit(clientIP);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Listing ID is required" },
        { status: 400 }
      );
    }

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        availability: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        skill: {
          select: {
            id: true,
            name: true,
            category: true,
            description: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            bio: true,
          },
        },
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Only show inactive listings to the owner
    if (!listing.isActive) {
      // Check if user is authenticated and owns the listing
      const { user, error: authError } = await getAuthenticatedUser(request);
      if (authError || !user?.id || listing.user.id !== user.id) {
        return NextResponse.json(
          { error: "Listing not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(listing);
  } catch (error) {
    console.error("Listing fetch error:", error);
    Sentry.captureException(error, {
      tags: {
        area: "listing-fetch-single",
        ip: clientIP,
        listingId: params.id,
      },
    });

    return NextResponse.json(
      { error: "Failed to fetch listing" },
      { status: 500 }
    );
  }
}

export async function PUT(
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
        { error: "Listing ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const { error: ownershipError } = await verifyListingOwnership(id, user.id);
    if (ownershipError) return ownershipError;

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
      isActive: body.isActive,
    };

    const validatedData = listingUpdateSchema.parse(sanitizedInput);

    // Update listing
    const updatedListing = await prisma.listing.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        availability: true,
        isActive: true,
        updatedAt: true,
        skill: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    });

    console.log(`Listing updated: ${user.id} - ${id}`);
    Sentry.addBreadcrumb({
      message: "Listing updated",
      category: "listing",
      level: "info",
      data: { userId: user.id, listingId: id },
    });

    return NextResponse.json(updatedListing);
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

    console.error("Listing update error:", error);
    Sentry.captureException(error, {
      tags: {
        area: "listing-update",
        ip: clientIP,
        userId: user?.id,
        listingId: params.id,
      },
    });

    return NextResponse.json(
      { error: "Failed to update listing" },
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
        { error: "Listing ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const { error: ownershipError } = await verifyListingOwnership(id, user.id);
    if (ownershipError) return ownershipError;

    // Check for active swap requests before deletion
    const activeSwapRequests = await prisma.swapRequest.findFirst({
      where: {
        OR: [{ offeredListingId: id }, { requestedListingId: id }],
        status: "pending",
      },
    });

    if (activeSwapRequests) {
      return NextResponse.json(
        { error: "Cannot delete listing with pending swap requests" },
        { status: 409 }
      );
    }

    // Soft delete: set isActive to false instead of hard delete
    await prisma.listing.update({
      where: { id },
      data: { isActive: false },
    });

    console.log(`Listing deleted: ${user.id} - ${id}`);
    Sentry.addBreadcrumb({
      message: "Listing deleted",
      category: "listing",
      level: "info",
      data: { userId: user.id, listingId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Listing deletion error:", error);
    Sentry.captureException(error, {
      tags: {
        area: "listing-deletion",
        ip: clientIP,
        userId: user?.id,
        listingId: params.id,
      },
    });

    return NextResponse.json(
      { error: "Failed to delete listing" },
      { status: 500 }
    );
  }
}

// Bonus: PATCH for status updates (activate/deactivate)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const clientIP = getClientIP(request);
  let user: Session["user"] | null = null;

  try {
    const { success } = await generalApiLimit.limit(clientIP);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

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
    const body = await request.json();
    const { isActive } = listingStatusSchema.parse({ id, ...body });

    // Verify ownership
    const { error: ownershipError } = await verifyListingOwnership(id, user.id);
    if (ownershipError) return ownershipError;

    const updatedListing = await prisma.listing.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        title: true,
        isActive: true,
        updatedAt: true,
      },
    });

    console.log(
      `Listing status updated: ${user.id} - ${id} - ${
        isActive ? "activated" : "deactivated"
      }`
    );

    return NextResponse.json(updatedListing);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Listing status update error:", error);
    Sentry.captureException(error, {
      tags: {
        area: "listing-status-update",
        ip: clientIP,
        userId: user?.id,
        listingId: params.id,
      },
    });

    return NextResponse.json(
      { error: "Failed to update listing status" },
      { status: 500 }
    );
  }
}
