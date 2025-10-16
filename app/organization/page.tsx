"use client";

import { OrganizationProfile, CreateOrganization, useOrganization } from "@clerk/nextjs";
import Navbar from "@/components/navbar";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OrganizationPage() {
  const { organization } = useOrganization();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
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
              afterCreateOrganizationUrl="/dashboard"
            />
          )}
        </div>
      </main>
    </div>
  );
}
