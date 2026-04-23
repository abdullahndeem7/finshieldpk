import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextPath = url.searchParams.get("next") || "/dashboard";

  let response = NextResponse.redirect(new URL(nextPath, request.url));

  if (code) {
    const supabase = createSupabaseServerClient({
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

        response = NextResponse.redirect(new URL(nextPath, request.url));
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    });

    await supabase.auth.exchangeCodeForSession(code);
  } else {
    response = NextResponse.redirect(new URL("/login?error=missing_code", request.url));
  }

  return response;
}

export async function POST(request: NextRequest) {
  const { email, password, next, remember } = (await request.json()) as {
    email?: string;
    password?: string;
    next?: string;
    remember?: boolean;
  };

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  const nextPath = next || "/dashboard";
  let response = NextResponse.json({ ok: true, redirectTo: nextPath });

  const supabase = createSupabaseServerClient({
    getAll() {
      return request.cookies.getAll();
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
      cookiesToSet.forEach(({ name, value, options }) => {
        if (remember === false) {
          const sessionCookieOptions = { ...options };
          delete sessionCookieOptions.maxAge;
          delete sessionCookieOptions.expires;
          response.cookies.set(name, value, sessionCookieOptions);
          return;
        }

        response.cookies.set(name, value, options);
      });
    },
  });

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return response;
}
