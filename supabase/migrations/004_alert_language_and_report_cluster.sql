-- 1. Language. Each SACHET alert is published in exactly one language (the feed
--    carries a mix of en/hi/ml/te/or as separate alerts, not translations of the
--    same alert). Roughly half are non-English, so storing the language lets the
--    UI label them instead of showing Devanagari text with no explanation.
alter table alerts add column if not exists language text;

-- 2. Report clustering. When several citizens report from the same area in a short
--    window, that is a developing incident, not five unrelated reports. cluster_id
--    groups them; cluster_size is denormalised so the UI can flag a hotspot without
--    a second query.
alter table reports add column if not exists cluster_id uuid;
alter table reports add column if not exists cluster_size int not null default 1;

create index if not exists reports_cluster_id_idx on reports (cluster_id);
