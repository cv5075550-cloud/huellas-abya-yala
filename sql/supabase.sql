-- Huellas de Abya Yala · Bloque 8: perfiles y roles
-- Pega TODO esto en Supabase → SQL Editor → New query → Run. Hazlo ANTES de crear las cuentas.

create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  role       text not null default 'student' check (role in ('student','teacher')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- ¿El usuario actual es docente? (security definer evita recursión en las políticas)
create or replace function public.is_teacher()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher');
$$;

drop policy if exists "ver mi perfil" on public.profiles;
create policy "ver mi perfil" on public.profiles for select using (auth.uid() = id);

drop policy if exists "docente ve perfiles" on public.profiles;
create policy "docente ve perfiles" on public.profiles for select using (public.is_teacher());
-- No hay políticas de insert/update/delete para usuarios: nadie puede cambiarse el rol desde la app.

-- Al crearse un usuario se genera su perfil. Solo este correo recibe el rol de docente.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id, new.email,
    coalesce(nullif(new.raw_user_meta_data->>'full_name',''), split_part(new.email,'@',1)),
    case when lower(new.email) = 'docente@abyayala.edu' then 'teacher' else 'student' end
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Por si ya existían usuarios antes de ejecutar este script
insert into public.profiles (id, email, full_name, role)
select id, email, split_part(email,'@',1),
       case when lower(email) = 'docente@abyayala.edu' then 'teacher' else 'student' end
from auth.users
on conflict (id) do nothing;

-- Para nombrar a otro docente más adelante:
--   update public.profiles set role = 'teacher' where email = 'otro@correo.com';
