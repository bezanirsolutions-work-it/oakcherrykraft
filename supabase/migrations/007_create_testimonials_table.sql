-- Create testimonials table for CMS-managed customer testimonials
create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  company text,
  photo_url text,
  rating int check (rating >= 1 and rating <= 5),
  testimonial text not null,
  featured boolean not null default false,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);
