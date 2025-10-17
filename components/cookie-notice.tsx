"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function CookieNotice() {
  const COOKIE_NAME = "lf_cookie_notice_seen";

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hasSeen = document.cookie.includes(`${COOKIE_NAME}=1`);
    if (!hasSeen) setVisible(true);
  }, []);

  const dismiss = () => {
    document.cookie = `${COOKIE_NAME}=1; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-gray-900 text-white text-sm py-3 px-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 shadow-lg">
      <p>
        By using this website, you agree to our use of cookies.{" "}
        <Link
          href="/legal/privacy"
          className="underline hover:text-gray-300 transition"
        >
          Learn more
        </Link>
        .
      </p>
      <button
        onClick={dismiss}
        className="bg-white text-gray-900 rounded-md px-3 py-1 text-sm font-medium hover:bg-gray-200 transition"
      >
        OK
      </button>
    </div>
  );
}
