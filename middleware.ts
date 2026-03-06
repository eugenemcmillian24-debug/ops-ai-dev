import { auth } from "@/lib/auth";

const PROTECTED_PATHS = ["/dashboard", "/ai-terminal", "/api/credits", "/api/ai"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path)
  );

  if (isProtected && !req.auth) {
    const redirectUrl = new URL("/", req.url);
    redirectUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(redirectUrl);
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
