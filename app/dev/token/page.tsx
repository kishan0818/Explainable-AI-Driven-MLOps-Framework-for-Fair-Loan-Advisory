"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

export default function DevTokenPage() {
    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            console.log("ACCESS TOKEN:", data.session?.access_token);
        });
    }, []);

    return (
        <div style={{ padding: 24 }}>
            <h1>Dev Token Helper</h1>
            <p>
                Open the browser console to copy your Supabase access token.
            </p>
        </div>
    );
}
