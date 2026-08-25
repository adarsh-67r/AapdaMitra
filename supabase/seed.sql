-- AapdaMitra — demo seed data
-- Demo region: Chennai, Tamil Nadu (flood/cyclone-prone, well-known coastal district).
-- Run after schema.sql, in the Supabase SQL editor.

insert into resources (type, name, lat, lng, capacity, status) values
  ('shelter', 'Anna Nagar Community Hall', 13.0850, 80.2101, 150, 'available'),
  ('shelter', 'Mylapore Govt School', 13.0339, 80.2619, 100, 'available'),
  ('shelter', 'Velachery Municipal Shelter', 12.9791, 80.2183, 200, 'available'),
  ('shelter', 'Tambaram Relief Center', 12.9249, 80.1000, 120, 'full'),
  ('shelter', 'Perambur Community Center', 13.1143, 80.2329, 80, 'available'),

  ('rescue_team', 'NDRF Team Alpha', 13.0674, 80.2376, 8, 'available'),
  ('rescue_team', 'NDRF Team Bravo', 12.9950, 80.2200, 8, 'available'),
  ('rescue_team', 'Fire & Rescue Unit 3', 13.0500, 80.2450, 6, 'dispatched'),
  ('rescue_team', 'Coast Guard Response Unit', 13.0900, 80.2900, 10, 'available'),

  ('supply_stock', 'Adyar Relief Warehouse', 13.0012, 80.2565, 500, 'available'),
  ('supply_stock', 'T Nagar Supply Depot', 13.0418, 80.2341, 300, 'available'),
  ('supply_stock', 'Tambaram Ration Store', 12.9249, 80.1000, 250, 'full');

-- A few sample citizen reports so the dashboard has something to show before
-- the citizen app is wired up. Safe to delete once real reports come in.
insert into reports (lat, lng, severity, description, status) values
  (13.0600, 80.2450, 'high', 'Waterlogging on main road, 2 families stranded on rooftop', 'open'),
  (12.9800, 80.2100, 'critical', 'House collapse risk, elderly residents need evacuation', 'open'),
  (13.1100, 80.2350, 'medium', 'Street flooded, cars stuck, no immediate danger to people', 'open');
