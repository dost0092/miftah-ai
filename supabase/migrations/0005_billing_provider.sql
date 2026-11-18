-- Billing moved from Stripe to Paddle: provider-neutral column names.
-- Idempotent: safe on databases created before or after 0004 was renamed.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'subscriptions' and column_name = 'stripe_customer_id') then
    alter table public.subscriptions rename column stripe_customer_id to customer_id;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'subscriptions' and column_name = 'stripe_subscription_id') then
    alter table public.subscriptions rename column stripe_subscription_id to subscription_id;
  end if;
end $$;

alter table public.subscriptions add column if not exists provider text not null default 'paddle';
create index if not exists subscriptions_customer_id on public.subscriptions (customer_id);
