import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const clerkMocks = vi.hoisted(() => ({
  useUser: vi.fn(),
}));

const navigationMocks = vi.hoisted(() => ({
  usePathname: vi.fn(),
}));

vi.mock("@clerk/nextjs", () => {
  const React = require("react");
  return {
    useUser: clerkMocks.useUser,
    SignInButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SignUpButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    UserButton: () => <div data-testid="user-button">User profile</div>,
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMocks.usePathname(),
}));

vi.mock("next/link", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ children, href }: { children: React.ReactNode; href: string }) => (
      <a href={href}>{children}</a>
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

import Navbar from "../navbar";

describe("Navbar", () => {
  beforeEach(() => {
    navigationMocks.usePathname.mockReturnValue("/");
    clerkMocks.useUser.mockReturnValue({ isSignedIn: false, user: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders project navigation when on the dashboard", () => {
    navigationMocks.usePathname.mockReturnValue("/dashboard");
    clerkMocks.useUser.mockReturnValue({
      isSignedIn: true,
      user: {
        firstName: "Avery",
        emailAddresses: [{ emailAddress: "avery@example.com" }],
      },
    });

    render(<Navbar />);

    expect(screen.getByText("Lexicon Flow")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /organization settings/i })).toBeInTheDocument();
    expect(screen.getByTestId("user-button")).toBeInTheDocument();
  });

  it("renders workflow navigation with board actions", () => {
    navigationMocks.usePathname.mockReturnValue("/workflows");

    render(
      <Navbar
        boardTitle="Workflow Board"
        onEditBoard={vi.fn()}
        onFilterClick={vi.fn()}
        filterCount={2}
      />,
    );

    expect(screen.getByText("Workflow Board")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /filter/i })).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByTestId("user-button")).toBeInTheDocument();
  });

  it("renders board navigation with filter count", () => {
    navigationMocks.usePathname.mockReturnValue("/boards/123");

    render(
      <Navbar boardTitle="Project Board" onFilterClick={vi.fn()} filterCount={3} />,
    );

    expect(screen.getByRole("link", { name: /back to dashboard/i })).toBeInTheDocument();
    expect(screen.getByText("Project Board")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /filter/i })).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders authentication buttons when signed out", () => {
    navigationMocks.usePathname.mockReturnValue("/");
    clerkMocks.useUser.mockReturnValue({ isSignedIn: false, user: null });

    render(<Navbar />);

    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument();
  });
});
