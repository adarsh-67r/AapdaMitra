-- Where a report says it is, in words.
--
-- A report carries lat/lng, which is what the map and the allocator need, but an
-- operator reading the queue cannot tell "22.0767, 84.5039" from any other pair
-- of numbers. When a citizen's browser refuses to give up a position they name
-- their place by hand instead, and that name is the most useful thing anyone
-- downstream has: it says both where they are and how precise that is.
--
-- It was previously appended to the description text, which meant it could be
-- truncated with the description, could not be displayed on its own, and was one
-- careless edit away from being lost. It belongs in a column.
--
-- Null means the position came from the device and needs no gloss.
alter table reports add column if not exists place_label text;

-- Whether the position was measured or named. 'device' is a real fix; 'manual'
-- is a city or district centroid the citizen selected, and must never be read as
-- an address.
alter table reports add column if not exists location_source text not null default 'device';
