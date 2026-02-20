export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/report/:path*", "/my-items/:path*"],
};
