-- The SACHET feed carries an `alert_source` field naming the agency that
-- actually issued each alert — IMD regional centres (IMD Bhubaneswar, IMD
-- Chennai, ...), the Central Water Commission, and state SDMAs all publish
-- into it. We were discarding that and storing only the constant
-- 'sachet_ndma' in `source`, so the UI could never show that IMD warnings
-- are in fact being ingested. Keep `source` as the ingestion channel and add
-- `issuing_agency` for the originating authority.
alter table alerts add column if not exists issuing_agency text;
