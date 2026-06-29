-- TLS 앱 테이블 생성 SQL
-- Supabase → SQL Editor에서 실행

-- 1. 체중 기록
create table if not exists weight_log (
  id         bigserial primary key,
  device_id  text not null,
  date       date not null,
  weight     numeric(5,1) not null,
  created_at timestamptz default now(),
  unique(device_id, date)
);

-- 2. 끼니 완료 체크
create table if not exists daily_checks (
  id         bigserial primary key,
  device_id  text not null,
  date       date not null,
  checks     boolean[] not null default '{false,false,false,false}',
  created_at timestamptz default now(),
  unique(device_id, date)
);

-- 3. 물 섭취
create table if not exists daily_water (
  id         bigserial primary key,
  device_id  text not null,
  date       date not null,
  water_ml   integer not null default 0,
  created_at timestamptz default now(),
  unique(device_id, date)
);

-- 4. 커스텀 식품
create table if not exists custom_foods (
  id           bigserial primary key,
  device_id    text not null,
  category     text not null check (category in ('carbs','protein','fat')),
  name         text not null,
  kcal_per100  numeric(6,1) not null,
  carbs_per100 numeric(5,1) not null default 0,
  protein_per100 numeric(5,1) not null default 0,
  fat_per100   numeric(5,1) not null default 0,
  unit         text not null default 'g',
  created_at   timestamptz default now()
);

-- RLS 비활성화 (디바이스 ID 기반으로 관리)
alter table weight_log    disable row level security;
alter table daily_checks  disable row level security;
alter table daily_water   disable row level security;
alter table custom_foods  disable row level security;
