import { NextResponse } from "next/server";
import * as XLSX from "@keep-lts/xlsx";
import { createClient } from "@/lib/supabase/server";

export const runtime="nodejs";
export const maxDuration=10;
const MAX_BYTES=10*1024*1024;
const MAX_ROWS=2000;
const allowed=new Set([".csv",".xls",".xlsx",".ods"]);
const norm=(v:unknown)=>String(v??"").trim();
function key(s:string){return s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");}
export async function POST(req:Request){
  const supabase=await createClient();
  const {data}=await supabase.auth.getClaims(); const userId=data?.claims?.sub;
  if(!userId)return NextResponse.json({error:"Sessão necessária"},{status:401});
  const member=await supabase.from("organization_members").select("organization_id").eq("user_id",userId).eq("status","active").limit(1).maybeSingle();
  const orgId=member.data?.organization_id; if(!orgId)return NextResponse.json({error:"Organização não configurada"},{status:403});
  const form=await req.formData(); const file=form.get("file");
  if(!(file instanceof File))return NextResponse.json({error:"Arquivo obrigatório"},{status:400});
  const ext="."+file.name.toLowerCase().split(".").pop();
  if(!allowed.has(ext)||file.size>MAX_BYTES)return NextResponse.json({error:"Arquivo inválido: use CSV/XLS/XLSX/ODS até 10 MB"},{status:400});
  try{
    const buf=Buffer.from(await file.arrayBuffer());
    const wb=XLSX.read(buf,{type:"buffer",cellFormula:false,cellHTML:false,cellDates:true,WTF:false});
    const sheet=wb.Sheets[wb.SheetNames[0]]; if(!sheet)return NextResponse.json({error:"Planilha vazia"},{status:400});
    const rows=XLSX.utils.sheet_to_json<Record<string,unknown>>(sheet,{defval:"",raw:false}).slice(0,MAX_ROWS);
    if(!rows.length)return NextResponse.json({error:"Nenhuma linha encontrada"},{status:400});
    let imported=0;
    for(const raw of rows){
      const r:Record<string,string>={}; for(const [k,v] of Object.entries(raw))r[key(k)]=norm(v);
      const name=r.nome||r.name||r.cliente||r.contato; const phone=r.telefone||r.phone||r.celular||r.whatsapp; const product=r.produto||r.product||"Não informado";
      if(!name||!phone||phone.length>32)continue;
      const c=await supabase.from("contacts").upsert({organization_id:orgId,name,phone,cpf:r.cpf||null,email:r.email||null,source:"importacao"},{onConflict:"organization_id,phone"}).select("id").single();
      if(c.error)continue;
      const blocked=await supabase.from("blocked_numbers").select("id").eq("organization_id",orgId).eq("phone",phone).maybeSingle();
      if(blocked.data)continue;
      const l=await supabase.from("leads").insert({organization_id:orgId,contact_id:c.data.id,product}).select("id").single();
      if(!l.error)imported++;
    }
    await supabase.from("import_jobs").insert({organization_id:orgId,file_name:file.name,row_count:imported,status:"completed",created_by:userId});
    return NextResponse.json({ok:true,imported,read:rows.length});
  }catch{return NextResponse.json({error:"Arquivo não pôde ser processado"},{status:400});}
}
