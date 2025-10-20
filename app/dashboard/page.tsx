"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  // Redirect to /projects
  useEffect(() => {
    router.replace("/projects");
  }, [router]);

  return null;
}
