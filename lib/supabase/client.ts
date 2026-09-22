"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

export function createClient(){
  if(client) return client;
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL||"https://fxwejuwxsnaoqmtwjlxu.supabase.co";
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_dpcOfTFvmkvgBwZSspp4Ig_9sD_XdlP";
  if(!url || !key) throw new Error("Supabase não configurado");
  client=createBrowserClient(url,key);
  return client;
}