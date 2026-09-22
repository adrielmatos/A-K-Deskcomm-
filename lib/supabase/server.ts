import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function env(name:string){const value=process.env[name];if(!value)throw new Error("Configuração do servidor ausente");return value;}

export async function createClient(){
  const cookieStore=await cookies();
  return createServerClient(env("NEXT_PUBLIC_SUPABASE_URL"),env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")||env("NEXT_PUBLIC_SUPABASE_ANON_KEY"),{
    cookies:{
      getAll(){return cookieStore.getAll();},
      setAll(cookiesToSet){
        try{cookiesToSet.forEach(({name,value,options})=>cookieStore.set(name,value,options));}catch{}
      }
    }
  });
}

export function createServiceClient(){
  return createSupabaseClient(env("NEXT_PUBLIC_SUPABASE_URL"),env("SUPABASE_SERVICE_ROLE_KEY"),{auth:{autoRefreshToken:false,persistSession:false}});
}