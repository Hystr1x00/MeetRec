import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    const { pathname } = req.nextUrl;
    const isLoggedIn = !!req.auth;

    const publicRoutes = ["/login"];
    const isPublicRoute = publicRoutes.includes(pathname);

    if (!isLoggedIn && !isPublicRoute) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    if (isLoggedIn && pathname === "/login") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
