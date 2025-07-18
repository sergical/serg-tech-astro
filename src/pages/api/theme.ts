import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, cookies }) => {
  const { theme } = await request.json();

  // Validate theme
  if (theme !== "light" && theme !== "dark" && theme !== "sentry") {
    return new Response("Invalid theme", { status: 400 });
  }

  // Set cookie with 1 year expiry
  cookies.set("theme", theme, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return new Response(JSON.stringify({ success: true }));
};
