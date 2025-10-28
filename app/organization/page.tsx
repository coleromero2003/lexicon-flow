"use client";

import { OrganizationProfile, CreateOrganization, useOrganization, useUser } from "@clerk/nextjs";
import Navbar from "@/components/navbar";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OrganizationPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded: userLoaded } = useUser();
  const { organization } = useOrganization();

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (userLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isSignedIn, userLoaded, router]);

  // Show loading while checking authentication
  if (!userLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner label="Loading your account..." />
      </div>
    );
  }

  // Don't render anything if not signed in (will redirect)
  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6">
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {organization ? "Organization Settings" : "Create Your Organization"}
          </h1>
          <p className="text-gray-600">
            {organization
              ? `Manage ${organization.name} settings, members, and invitations`
              : "Create your organization to start managing SCADA projects"}
          </p>
        </div>

        <div className="flex justify-center">
          {organization ? (
            <OrganizationProfile
              routing="hash"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-lg",
                },
              }}
            />
          ) : (
            <CreateOrganization
              routing="hash"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-lg",
                },
              }}
              afterCreateOrganizationUrl="/projects"
            />
          )}
        </div>
      </main>
    </div>
  );
}
