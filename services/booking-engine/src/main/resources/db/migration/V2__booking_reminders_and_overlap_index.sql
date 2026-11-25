-- Owned by booking-engine.

-- SRS 4.3.6: when the 24-hour reminder was sent (NULL = not yet), so no booking is reminded twice.
ALTER TABLE bookings ADD reminder_sent_at TIMESTAMPTZ NULL;

-- FR-U5 overlap check: "same facility, overlapping times". The index lets the database find a facility's
-- bookings without scanning the whole table, which also keeps the SERIALIZABLE transaction's
-- read locks small (fewer unrelated bookings aborted with "try again").
CREATE INDEX ix_bookings_facility_start ON bookings (facility_id, start_time);
