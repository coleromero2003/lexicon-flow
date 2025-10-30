import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({
  usePathname: vi.fn(),
}));

const routerMock = vi.hoisted(() => ({
  back: vi.fn(),
  forward: vi.fn(),
}));

const clerkMocks = vi.hoisted(() => ({
  useOrganization: vi.fn(),
  useUser: vi.fn(),
}));

const projectsMock = vi.hoisted(() => ({
  useProjects: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMocks.usePathname(),
  useRouter: () => routerMock,
}));

vi.mock("next/link", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: React.forwardRef(
      (
        {
          children,
          href,
          ...rest
        }: {
          children: React.ReactNode;
          href: string;
        },
        ref: React.Ref<HTMLAnchorElement>,
      ) => (
        <a ref={ref} href={href} {...rest}>
          {children}
        </a>
      ),
    ),
  };
});

vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={typeof src === "string" ? src : src.src} alt={alt} />
  ),
}));

vi.mock("@clerk/nextjs", () => {
  const React = require("react");
  return {
    useOrganization: clerkMocks.useOrganization,
    useUser: clerkMocks.useUser,
    UserButton: () => <div data-testid="user-button">User Button</div>,
  };
});

vi.mock("@/lib/hooks/useProjects", () => ({
  useProjects: projectsMock.useProjects,
}));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "../app-sidebar";

const PROJECTS = [
  { id: 123, name: "Project Alpha" },
  { id: 456, name: "Project Beta" },
];

function renderSidebar() {
  return render(
    <SidebarProvider defaultOpen>
      <AppSidebar />
    </SidebarProvider>,
  );
}

describe("AppSidebar", () => {
  beforeEach(() => {
    navigationMocks.usePathname.mockReturnValue("/dashboard");
    routerMock.back = vi.fn();
    routerMock.forward = vi.fn();

    clerkMocks.useOrganization.mockReturnValue({
      organization: { name: "Acme Corporation" },
    });

    clerkMocks.useUser.mockReturnValue({
      user: {
        firstName: "Avery",
        emailAddresses: [{ emailAddress: "avery@example.com" }],
      },
    });

    projectsMock.useProjects.mockReturnValue({ projects: PROJECTS });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders organization and user info on the dashboard", () => {
    renderSidebar();

    expect(screen.getByText("Acme Corporation")).toBeInTheDocument();
    expect(screen.getByText("Avery")).toBeInTheDocument();
    expect(screen.getByText("avery@example.com")).toBeInTheDocument();
    expect(screen.getByTestId("user-button")).toBeInTheDocument();

    // Dashboard link should point to /dashboard
    const dashboardLink = screen.getByRole("link", { name: "Dashboard" });
    expect(dashboardLink).toHaveAttribute("href", "/dashboard");

    const goToDashboardLink = screen.getByRole("link", { name: "Go to Dashboard" });
    expect(goToDashboardLink).toHaveAttribute("href", "/dashboard");

    const organizationLink = screen.getByRole("link", { name: "Settings" });
    expect(organizationLink).toHaveAttribute("href", "/organization");

    // Project navigation should not render when no project matches the path
    expect(screen.queryByText("Project Alpha")).not.toBeInTheDocument();
  });

  it("shows project navigation and highlights the overview when visiting a project", () => {
    navigationMocks.usePathname.mockReturnValue("/projects/123");

    renderSidebar();

    expect(screen.getByText("Project Alpha")).toBeInTheDocument();
    expect(screen.queryByText("Project Beta")).not.toBeInTheDocument();

    const overviewLink = screen.getByRole("link", { name: "Overview" });
    expect(overviewLink).toHaveAttribute("href", "/projects/123");
    expect(overviewLink).toHaveAttribute("data-active", "true");

    const workflowsLink = screen.getByRole("link", { name: "Workflows" });
    expect(workflowsLink).toHaveAttribute("data-active", "false");
  });

  it("highlights the correct nested project link", () => {
    navigationMocks.usePathname.mockReturnValue("/projects/123/workflows/board");

    renderSidebar();

    const overviewLink = screen.getByRole("link", { name: "Overview" });
    const workflowsLink = screen.getByRole("link", { name: "Workflows" });
    const objectsLink = screen.getByRole("link", { name: "Objects" });

    expect(overviewLink).toHaveAttribute("data-active", "false");
    expect(workflowsLink).toHaveAttribute("data-active", "true");
    expect(objectsLink).toHaveAttribute("data-active", "false");
  });

  it("does not render a project group when the project is unknown", () => {
    navigationMocks.usePathname.mockReturnValue("/projects/999");

    renderSidebar();

    expect(screen.queryByText("Project Alpha")).not.toBeInTheDocument();
    expect(screen.queryByText("Project Beta")).not.toBeInTheDocument();
  });

  it("invokes router helpers when clicking back and forward", async () => {
    const user = userEvent.setup();
    renderSidebar();

    await user.click(screen.getByRole("button", { name: "Back" }));
    await user.click(screen.getByRole("button", { name: "Forward" }));

    expect(routerMock.back).toHaveBeenCalledTimes(1);
    expect(routerMock.forward).toHaveBeenCalledTimes(1);
  });
});
