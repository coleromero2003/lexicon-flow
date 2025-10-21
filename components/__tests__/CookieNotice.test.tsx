import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import CookieNotice from "../cookie-notice";

const COOKIE_NAME = "lf_cookie_notice_seen";
const COOKIE_VALUE = `${COOKIE_NAME}=1`;
const EXPECTED_COOKIE =
  `${COOKIE_VALUE}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`;

describe("CookieNotice", () => {
  let cookieStore = "";
  let setCookieMock: ReturnType<typeof vi.fn>;

  beforeAll(() => {
    vi.stubGlobal("React", React);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  const mockDocumentCookie = () => {
    setCookieMock = vi.fn((value: string) => {
      cookieStore = value;
    });

    Object.defineProperty(document, "cookie", {
      configurable: true,
      get: vi.fn(() => cookieStore),
      set: setCookieMock,
    });
  };

  beforeEach(() => {
    cookieStore = "";
    mockDocumentCookie();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("shows the banner when the notice has not been seen", async () => {
    render(<CookieNotice />);

    expect(
      await screen.findByText(/By using this website, you agree to our use of cookies/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ok/i })).toBeInTheDocument();
  });

  it("remains hidden when the notice has already been seen", () => {
    cookieStore = COOKIE_VALUE;

    render(<CookieNotice />);

    expect(
      screen.queryByText(/By using this website, you agree to our use of cookies/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /ok/i })).not.toBeInTheDocument();
    expect(setCookieMock).not.toHaveBeenCalled();
  });

  it("sets the cookie when dismissed and stays hidden afterwards", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<CookieNotice />);

    const okButton = await screen.findByRole("button", { name: /ok/i });
    await user.click(okButton);

    expect(setCookieMock).toHaveBeenCalledWith(EXPECTED_COOKIE);

    await waitFor(() => {
      expect(
        screen.queryByText(/By using this website, you agree to our use of cookies/i),
      ).not.toBeInTheDocument();
    });

    unmount();
    render(<CookieNotice />);

    expect(
      screen.queryByText(/By using this website, you agree to our use of cookies/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /ok/i })).not.toBeInTheDocument();
  });
});
