-- Huellas de Abya Yala · Bloque 9: asignaturas compartidas y recursos
-- Pega TODO en Supabase → SQL Editor → New query → Run. (Requiere haber ejecutado antes sql/supabase.sql)

-- ---------- Asignaturas creadas por el docente (las ven todos los usuarios con sesión) ----------
create table if not exists public.subjects (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 60),
  grade      text,
  summary    text,
  color      text,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.subjects enable row level security;
drop policy if exists "ver asignaturas" on public.subjects;
create policy "ver asignaturas" on public.subjects for select to authenticated using (true);
drop policy if exists "docente crea asignaturas" on public.subjects;
create policy "docente crea asignaturas" on public.subjects for insert to authenticated with check (public.is_teacher());

-- ---------- Recursos (video, audio, PDF, imágenes, archivos, enlaces, YouTube) ----------
create table if not exists public.resources (
  id          uuid primary key default gen_random_uuid(),
  subject_id  text not null,
  title       text not null check (char_length(title) between 1 and 120),
  description text,
  kind        text not null check (kind in ('video','audio','pdf','image','file','link','youtube')),
  url         text not null,
  path        text,
  size        bigint,
  created_by  uuid default auth.uid() references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists resources_subject_idx on public.resources (subject_id, created_at desc);
alter table public.resources enable row level security;
drop policy if exists "ver recursos" on public.resources;
create policy "ver recursos" on public.resources for select to authenticated using (true);
drop policy if exists "docente sube recursos" on public.resources;
create policy "docente sube recursos" on public.resources for insert to authenticated with check (public.is_teacher());
drop policy if exists "docente borra recursos" on public.resources;
create policy "docente borra recursos" on public.resources for delete to authenticated using (public.is_teacher());

grant select, insert on public.subjects  to authenticated;
grant select, insert, delete on public.resources to authenticated;

-- ---------- Almacenamiento de archivos (límite del plan gratuito: 50 MB por archivo) ----------
insert into storage.buckets (id, name, public, file_size_limit)
values ('resources', 'resources', true, 52428800)
on conflict (id) do update set public = true, file_size_limit = 52428800;

drop policy if exists "docente sube archivos" on storage.objects;
create policy "docente sube archivos" on storage.objects for insert to authenticated
  with check (bucket_id = 'resources' and public.is_teacher());
drop policy if exists "docente borra archivos" on storage.objects;
create policy "docente borra archivos" on storage.objects for delete to authenticated
  using (bucket_id = 'resources' and public.is_teacher());
-- Nota: el bucket es público para lectura: quien tenga el enlace exacto de un archivo puede abrirlo.
