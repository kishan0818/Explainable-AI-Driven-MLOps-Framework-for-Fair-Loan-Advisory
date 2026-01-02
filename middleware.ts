import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Route protection logic
    if (request.nextUrl.pathname.startsWith("/user")) {
        // 1. Require Authenticated User
        if (!user) {
            return NextResponse.redirect(new URL("/", request.url));
        }

        // 2. Require Verified Email
        if (user.email_confirmed_at === undefined && !request.nextUrl.pathname.includes('/verify-email')) {
            // Since the task requirement says "Block dashboard access" and "Show a clear message",
            // we should redirect to a verification page if they are not verified.
            // However, we don't have a /verify-email page created yet in the plan.
            // For now, I will create a dedicated route for this or handle it on the dashboard.
            // Let's assume we will build /verify-email.
            return NextResponse.redirect(new URL("/verify-email", request.url));
        }
    }

    // Prevent logged-in users from visiting login page
    if (request.nextUrl.pathname === "/" && user) {
        return NextResponse.redirect(new URL("/user/dashboard", request.url));
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
