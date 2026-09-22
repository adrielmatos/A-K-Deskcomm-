-- Deskcomm RLS invariants.
-- Run with Supabase CLI test db after project provisioning.
begin;
select plan(8);
select has_table_privilege('anon','public.contacts','select') is false as anon_contacts_denied;
select has_table_privilege('authenticated','public.contacts','select') as auth_contacts_select;
select row_security_active('public.contacts') as contacts_rls;
select row_security_active('public.leads') as leads_rls;
select row_security_active('public.audit_logs') as audit_rls;
select row_security_active('public.ai_agents') as ai_rls;
select has_table_privilege('anon','public.leads','insert') is false as anon_leads_insert_denied;
select finish();
rollback;
