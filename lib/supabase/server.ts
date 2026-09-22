import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function required(name:string){const v=process.env[name];if(!v)throw new Error("Configuração do servidor ausente");return v;}
function publicKey(){const v=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;if(!v)throw new Error("Chave pública do Supabase ausente");return v;}

export async function createClient(){
  const cookieStore=await cookies();
  return createServerClient(required("NEXT_PUBLIC_SUPABASE_URL"),publicKey(),{
    cookies:{
      getAll(){return cookieStore.getAll();},
      setAll(cookiesToSet){try{cookiesToSet.forEach(({name,value,options})=>cookieStore.set(name,value,options));}catch{}}
    }
  });
}

export function createServiceClient(){
  return createSupabaseClient(required("NEXT_PUBLIC_SUPABASE_URL"),required("SUPABASE_SERVICE_ROLE_KEY"),{auth:{autoRefreshToken:false,persistSession:false}});
}