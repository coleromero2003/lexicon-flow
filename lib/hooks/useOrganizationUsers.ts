"use client";

import { useOrganization } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export interface OrganizationUser {
  id: string;
  userId: string;
  email: string;
  name: string;
  imageUrl: string;
  role: string;
}

export function useOrganizationUsers() {
  const { organization, isLoaded } = useOrganization();
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUsers() {
      if (!isLoaded || !organization) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch organization memberships
        const memberships = await organization.getMemberships();

        const formattedUsers: OrganizationUser[] = memberships.data
          .filter((membership) => membership.publicUserData)
          .map((membership) => {
            const user = membership.publicUserData!;
            return {
              id: membership.id,
              userId: user.userId || "",
              email: user.identifier || "",
              name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.identifier || "Unknown User",
              imageUrl: user.imageUrl || "",
              role: membership.role,
            };
          });

        setUsers(formattedUsers);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load organization users");
        console.error("Failed to load organization users:", err);
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, [organization, isLoaded]);

  return {
    users,
    loading,
    error,
  };
}
