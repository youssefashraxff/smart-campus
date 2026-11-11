-- Smart Campus Platform — initial data (PostgreSQL)
-- Setting: Faculty of Computer and Information Sciences (FCIS), Ain Shams University,
--          main campus, Khalifa El-Ma'mun St., Abbassia, Cairo.
-- Period:  Fall semester 2026 (dataset "today" = Wed 11 Nov 2026), Cairo time (+02:00).
--          All event and booking days fall Sunday–Thursday (Egyptian working week).
--
-- People are sample accounts (realistic names, not real individuals).
-- Dev passwords (BCrypt, cost 11 — verify with BCrypt.Net-Next):
--   Admins:            Admin@2026
--   Students, faculty: Campus@2026
--
-- Run order: schema (or EF Core migrations) first, then this file.

BEGIN;

-- ============================================================
-- Auth service: Users
-- ============================================================
INSERT INTO "Users" ("Id","Name","UniversityId","Email","PasswordHash","Role","CreatedAt") VALUES
-- Admins
( 1,'Facilities Office Admin',        'ADM-001',   'facilities.admin@cis.asu.edu.eg','$2b$11$LyjSEbpVtvpqWWmdOZ3szuXi.1tTXgjVHlFWoQjIIcI0PbCFJVNFe','Admin',  '2026-09-01 09:00+02'),
( 2,'Student Activities Admin',       'ADM-002',   'activities.admin@cis.asu.edu.eg','$2b$11$LyjSEbpVtvpqWWmdOZ3szuXi.1tTXgjVHlFWoQjIIcI0PbCFJVNFe','Admin',  '2026-09-01 09:05+02'),
-- Faculty
( 3,'Dr. Mona Abdelaziz',             'FAC-1043',  'mona.abdelaziz@cis.asu.edu.eg',  '$2b$11$yh2j6jiJcEHg4XgKIbuca.RRPSi7PG.oyVtpQtzncHs3HYsH8ryaq','Faculty','2026-09-06 10:12+02'),
( 4,'Dr. Tarek El-Sayed',             'FAC-1077',  'tarek.elsayed@cis.asu.edu.eg',   '$2b$11$yh2j6jiJcEHg4XgKIbuca.RRPSi7PG.oyVtpQtzncHs3HYsH8ryaq','Faculty','2026-09-06 11:40+02'),
( 5,'Eng. Nourhan Samir',             'FAC-2110',  'nourhan.samir@cis.asu.edu.eg',   '$2b$11$yh2j6jiJcEHg4XgKIbuca.RRPSi7PG.oyVtpQtzncHs3HYsH8ryaq','Faculty','2026-09-07 08:55+02'),
( 6,'Dr. Hesham Kamal',               'FAC-1015',  'hesham.kamal@cis.asu.edu.eg',    '$2b$11$yh2j6jiJcEHg4XgKIbuca.RRPSi7PG.oyVtpQtzncHs3HYsH8ryaq','Faculty','2026-09-07 13:20+02'),
-- Students
( 7,'Ahmed Mostafa',                  '2022170045','ahmed.mostafa@cis.asu.edu.eg',   '$2b$11$yh2j6jiJcEHg4XgKIbuca.RRPSi7PG.oyVtpQtzncHs3HYsH8ryaq','Student','2026-09-20 18:02+02'),
( 8,'Mariam Hassan',                  '2022170112','mariam.hassan@cis.asu.edu.eg',   '$2b$11$yh2j6jiJcEHg4XgKIbuca.RRPSi7PG.oyVtpQtzncHs3HYsH8ryaq','Student','2026-09-20 19:47+02'),
( 9,'Omar Khaled',                    '2022170187','omar.khaled@cis.asu.edu.eg',     '$2b$11$yh2j6jiJcEHg4XgKIbuca.RRPSi7PG.oyVtpQtzncHs3HYsH8ryaq','Student','2026-09-21 09:15+02'),
(10,'Salma Adel',                     '2023170034','salma.adel@cis.asu.edu.eg',      '$2b$11$yh2j6jiJcEHg4XgKIbuca.RRPSi7PG.oyVtpQtzncHs3HYsH8ryaq','Student','2026-09-21 12:31+02'),
(11,'Karim Mahmoud',                  '2023170221','karim.mahmoud@cis.asu.edu.eg',   '$2b$11$yh2j6jiJcEHg4XgKIbuca.RRPSi7PG.oyVtpQtzncHs3HYsH8ryaq','Student','2026-09-22 16:08+02'),
(12,'Nada Ibrahim',                   '2022170306','nada.ibrahim@cis.asu.edu.eg',    '$2b$11$yh2j6jiJcEHg4XgKIbuca.RRPSi7PG.oyVtpQtzncHs3HYsH8ryaq','Student','2026-09-23 20:44+02'),
(13,'Mohamed Reda',                   '2024170058','mohamed.reda@cis.asu.edu.eg',    '$2b$11$yh2j6jiJcEHg4XgKIbuca.RRPSi7PG.oyVtpQtzncHs3HYsH8ryaq','Student','2026-09-27 10:03+02'),
(14,'Habiba Sherif',                  '2023170149','habiba.sherif@cis.asu.edu.eg',   '$2b$11$yh2j6jiJcEHg4XgKIbuca.RRPSi7PG.oyVtpQtzncHs3HYsH8ryaq','Student','2026-09-28 14:26+02'),
(15,'Ziad Walid',                     '2022170273','ziad.walid@cis.asu.edu.eg',      '$2b$11$yh2j6jiJcEHg4XgKIbuca.RRPSi7PG.oyVtpQtzncHs3HYsH8ryaq','Student','2026-10-01 11:50+02'),
(16,'Farida Tamer',                   '2024170190','farida.tamer@cis.asu.edu.eg',    '$2b$11$yh2j6jiJcEHg4XgKIbuca.RRPSi7PG.oyVtpQtzncHs3HYsH8ryaq','Student','2026-10-04 17:38+02');

-- ============================================================
-- Facility Catalog service: Facilities
-- ============================================================
INSERT INTO "Facilities" ("Id","Title","Building","Location","Capacity","Type","Status") VALUES
( 1,'Lecture Hall 1',                      'FCIS Building A','Ground floor',                      300,'Room',     'Available'),
( 2,'Lecture Hall 2',                      'FCIS Building A','Ground floor, east wing',           250,'Room',     'Available'),
( 3,'Seminar Room A-201',                  'FCIS Building A','2nd floor',                          40,'Room',     'Available'),
( 4,'Study Room A-305',                     'FCIS Building A','3rd floor',                          12,'Room',     'Available'),
( 5,'Study Room A-306',                     'FCIS Building A','3rd floor',                           8,'Room',     'Available'),
( 6,'Computer Lab 1 (General Purpose)',     'FCIS Building B','Ground floor',                       40,'Lab',      'Available'),
( 7,'Computer Lab 3 (Networks)',            'FCIS Building B','1st floor',                          30,'Lab',      'Available'),
( 8,'Embedded Systems Lab',                 'FCIS Building B','2nd floor',                          24,'Lab',      'Available'),
( 9,'AI & GPU Lab',                         'FCIS Building B','3rd floor',                          20,'Lab',      'Maintenance'),
(10,'Cybersecurity Lab',                    'FCIS Building B','2nd floor',                          25,'Lab',      'Available'),
(11,'Group Study Pod 2',                    'Central Library','1st floor, quiet zone',               6,'Room',     'Available'),
(12,'Portable Projector (Epson, Full HD)',  'FCIS Building A','Equipment desk, ground floor',        1,'Equipment','Available'),
(13,'Wireless Microphone Kit (2 mics)',     'FCIS Building A','Equipment desk, ground floor',        1,'Equipment','Available'),
(14,'VR Headset Set (5 headsets)',          'FCIS Building B','Computer Lab 3 storage',              5,'Equipment','Available'),
(15,'Raspberry Pi 5 Kit Set (10 kits)',     'FCIS Building B','Embedded Systems Lab cabinet',      10,'Equipment','Maintenance');

-- ============================================================
-- Facility Catalog service: Events (independent of Facilities)
-- ============================================================
INSERT INTO "Events" ("Id","Title","Description","Category","Building","Location","StartTime","EndTime","Capacity","Status") VALUES
( 1,'Welcome Back Orientation',
    'Faculty orientation for new and returning students: academic regulations, the credit-hour system, student activities and campus services.',
    'Social','FCIS Building A','Lecture Hall 1','2026-10-05 10:00+02','2026-10-05 13:00+02',300,'Scheduled'),
( 2,'Linux Command Line Bootcamp',
    'Hands-on session on the shell, file permissions, processes, pipes and basic Bash scripting. Bring nothing; lab machines run Ubuntu.',
    'Workshop','FCIS Building B','Computer Lab 1','2026-11-05 12:00+02','2026-11-05 15:00+02',40,'Scheduled'),
( 3,'Git & GitHub Team Workflow',
    'Branching, pull requests, code review and resolving merge conflicts as a team. Recommended before starting course projects.',
    'Workshop','FCIS Building B','Computer Lab 1','2026-11-17 13:00+02','2026-11-17 15:00+02',40,'Scheduled'),
( 4,'Building REST APIs with ASP.NET Core',
    'From an empty project to a documented Web API: controllers, EF Core, validation and Swagger. Bring a laptop with the .NET SDK installed.',
    'Workshop','FCIS Building B','Computer Lab 3','2026-11-19 12:00+02','2026-11-19 15:00+02',30,'Scheduled'),
( 5,'ICPC Training Contest #4',
    'Five-hour team practice contest in ICPC format (teams of three, one machine per team), followed by problem discussion.',
    'Competition','FCIS Building B','Computer Labs 1 and 3','2026-11-22 10:00+02','2026-11-22 15:00+02',70,'Scheduled'),
( 6,'Careers in Cloud & DevOps',
    'Industry talk on cloud and DevOps career paths, the skills employers test for, and how to build a portfolio before graduation. Q&A included.',
    'Seminar','FCIS Building A','Lecture Hall 2','2026-11-24 12:00+02','2026-11-24 14:00+02',250,'Scheduled'),
( 7,'Bare-Metal Embedded C on the ATmega328P',
    'Register-level programming: GPIO with DDRx/PORTx, timers and interrupts, using the lab development boards. No prior embedded experience needed.',
    'Workshop','FCIS Building B','Embedded Systems Lab','2026-11-26 10:00+02','2026-11-26 13:00+02',24,'Scheduled'),
( 8,'Capture The Flag: Web Security',
    'Jeopardy-style CTF covering SQL injection, XSS, broken authentication and insecure direct object references. Individual participation.',
    'Competition','FCIS Building B','Cybersecurity Lab','2026-12-01 11:00+02','2026-12-01 16:00+02',25,'Scheduled'),
( 9,'ML Paper Reading Club: Attention Is All You Need',
    'Student-led discussion of the Transformer paper: self-attention, positional encoding and why it replaced RNNs. Read the paper beforehand. Moved from Wed 2 Dec.',
    'Seminar','FCIS Building A','Seminar Room A-201','2026-12-03 13:00+02','2026-12-03 14:30+02',40,'Changed'),
(10,'FCIS Winter Career Day',
    'Company booths, CV review corner and short talks on internships and graduate programs. Bring printed CVs.',
    'Career','FCIS Building A','Main courtyard and Lecture Hall 1','2026-12-08 10:00+02','2026-12-08 16:00+02',600,'Scheduled'),
(11,'Movie Night: The Imitation Game',
    'Screening of the film about Alan Turing and the breaking of Enigma, followed by a short discussion. Cancelled due to a hall maintenance conflict.',
    'Social','FCIS Building A','Lecture Hall 2','2026-12-10 16:00+02','2026-12-10 19:00+02',200,'Cancelled'),
(12,'Graduation Projects Mid-Year Showcase',
    'Final-year teams present progress demos to faculty and students. Each team has 10 minutes plus 5 minutes of questions.',
    'Seminar','FCIS Building A','Lecture Hall 1','2026-12-15 10:00+02','2026-12-15 14:00+02',300,'Scheduled');

-- ============================================================
-- Facility Catalog service: Speakers (one row per speaker per event)
-- ============================================================
INSERT INTO "Speakers" ("Id","EventId","Name","Affiliation","Bio") VALUES
( 1, 1,'Dr. Hesham Kamal',   'Head of Student Activities Committee, FCIS',     'Faculty member coordinating student clubs and orientation programs.'),
( 2, 2,'Eng. Nourhan Samir', 'Teaching Assistant, FCIS',                       'Teaches the Operating Systems lab sessions and maintains the faculty''s Linux lab images.'),
( 3, 3,'Eng. Omar Fathy',    'Senior Software Engineer, FCIS alumnus (2019)',  'Works on backend platforms; leads code-review practices in his team.'),
( 4, 4,'Dr. Tarek El-Sayed', 'Associate Professor, Software Engineering, FCIS','Teaches software architecture and web services.'),
( 5, 4,'Eng. Yasmin Adel',   'Backend Engineer, FCIS alumna (2021)',           'Builds .NET microservices; co-runs the hands-on part of the workshop.'),
( 6, 5,'Dr. Hesham Kamal',   'ICPC Coach, FCIS',                               'Coaches the faculty''s competitive programming teams.'),
( 7, 6,'Eng. Ramy Nabil',    'Cloud Solutions Architect',                      'Designs cloud migrations for enterprise clients in the region.'),
( 8, 6,'Eng. Dina Fawzy',    'Site Reliability Engineer',                      'Runs on-call and observability for high-traffic production systems.'),
( 9, 7,'Dr. Mona Abdelaziz', 'Lecturer, Computer Systems, FCIS',               'Teaches real-time and embedded systems.'),
(10, 8,'Eng. Ali Hamdy',     'Penetration Tester, Cybersecurity Club mentor',  'Security consultant who designs the club''s CTF challenges.'),
(11, 9,'Mariam Hassan',      'Student, ML Club organiser',                     'Fourth-year student leading the paper reading series.'),
(12,10,'Eng. Sherif Gamal',  'Talent Acquisition Lead',                        'Hires graduate engineers; runs the CV review corner.'),
(13,12,'Dr. Mona Abdelaziz', 'Graduation Projects Coordinator, FCIS',          'Coordinates final-year project supervision and evaluation.');

-- ============================================================
-- Booking Engine service: Bookings
-- Confirmed bookings never overlap on the same facility.
-- #4/#5 are back-to-back (edge case: touching, not overlapping).
-- #9 is cancelled, so #10 may take an overlapping slot.
-- ============================================================
INSERT INTO "Bookings" ("Id","UserId","FacilityId","StartTime","EndTime","Status","CreatedAt") VALUES
( 1, 7, 4,'2026-11-02 10:00+02','2026-11-02 12:00+02','Confirmed','2026-10-29 21:14+02'),
( 2, 3, 6,'2026-11-04 09:00+02','2026-11-04 11:00+02','Confirmed','2026-10-27 10:02+02'),
( 3, 8,11,'2026-11-09 14:00+02','2026-11-09 16:00+02','Confirmed','2026-11-05 17:40+02'),
( 4, 9, 4,'2026-11-16 10:00+02','2026-11-16 12:00+02','Confirmed','2026-11-08 22:31+02'),
( 5,10, 4,'2026-11-16 12:00+02','2026-11-16 14:00+02','Confirmed','2026-11-09 08:19+02'),
( 6,11, 5,'2026-11-17 11:00+02','2026-11-17 13:00+02','Confirmed','2026-11-09 15:47+02'),
( 7, 4, 8,'2026-11-18 09:00+02','2026-11-18 12:00+02','Confirmed','2026-11-02 12:10+02'),
( 8, 5, 3,'2026-11-23 13:00+02','2026-11-23 15:00+02','Confirmed','2026-11-10 09:33+02'),
( 9,12,11,'2026-11-24 10:00+02','2026-11-24 12:00+02','Cancelled','2026-11-06 20:05+02'),
(10,13,11,'2026-11-24 10:30+02','2026-11-24 12:30+02','Confirmed','2026-11-10 23:12+02'),
(11, 5,12,'2026-11-23 13:00+02','2026-11-23 15:00+02','Confirmed','2026-11-10 09:35+02'),
(12, 6, 7,'2026-11-25 09:00+02','2026-11-25 11:00+02','Confirmed','2026-11-10 11:48+02'),
(13,14,10,'2026-11-30 12:00+02','2026-11-30 14:00+02','Confirmed','2026-11-11 08:02+02'),
(14, 7, 4,'2026-12-02 10:00+02','2026-12-02 12:00+02','Confirmed','2026-11-11 09:26+02'),
(15,15,14,'2026-12-06 13:00+02','2026-12-06 15:00+02','Confirmed','2026-11-11 10:15+02'),
(16, 3,13,'2026-12-08 09:00+02','2026-12-08 17:00+02','Confirmed','2026-11-04 14:00+02');

-- ============================================================
-- Booking Engine service: Registrations
-- ============================================================
INSERT INTO "Registrations" ("Id","UserId","EventId","Status","CreatedAt") VALUES
( 1, 7, 1,'Registered','2026-09-28 12:00+02'),
( 2, 8, 1,'Registered','2026-09-28 13:10+02'),
( 3, 9, 1,'Registered','2026-09-29 09:45+02'),
( 4,10, 1,'Registered','2026-10-01 18:22+02'),
( 5, 7, 2,'Registered','2026-10-30 19:03+02'),
( 6, 9, 2,'Registered','2026-10-31 10:40+02'),
( 7, 7, 3,'Registered','2026-11-08 20:11+02'),
( 8, 8, 3,'Registered','2026-11-09 11:57+02'),
( 9,11, 3,'Registered','2026-11-10 14:29+02'),
(10, 7, 4,'Registered','2026-11-08 20:15+02'),
(11, 9, 4,'Registered','2026-11-09 09:02+02'),
(12,10, 4,'Registered','2026-11-09 13:36+02'),
(13,12, 4,'Registered','2026-11-10 21:48+02'),
(14,13, 4,'Cancelled', '2026-11-07 16:20+02'),
(15, 9, 5,'Registered','2026-11-06 22:05+02'),
(16,15, 5,'Registered','2026-11-07 08:44+02'),
(17, 8, 6,'Registered','2026-11-09 12:12+02'),
(18,10, 6,'Registered','2026-11-09 13:40+02'),
(19,14, 6,'Registered','2026-11-10 10:58+02'),
(20,16, 6,'Registered','2026-11-11 07:31+02'),
(21, 7, 7,'Registered','2026-11-10 17:25+02'),
(22,11, 7,'Registered','2026-11-10 18:09+02'),
(23, 9, 8,'Registered','2026-11-11 09:14+02'),
(24,15, 8,'Registered','2026-11-11 09:20+02'),
(25, 8, 9,'Registered','2026-11-04 15:00+02'),
(26,12, 9,'Registered','2026-11-05 19:33+02'),
(27, 7,10,'Registered','2026-11-10 20:01+02'),
(28,10,10,'Registered','2026-11-10 20:47+02'),
(29,13,10,'Registered','2026-11-11 08:12+02'),
(30,14,10,'Registered','2026-11-11 08:40+02'),
(31,16,10,'Registered','2026-11-11 09:05+02'),
(32, 8,11,'Cancelled', '2026-11-03 18:30+02'),
(33,14,11,'Cancelled', '2026-11-04 21:16+02'),
(34, 7,12,'Registered','2026-11-11 09:30+02');

-- ============================================================
-- Notification service: Notifications
-- ============================================================
INSERT INTO "Notifications" ("Id","UserId","Type","Message","IsRead","CreatedAt") VALUES
( 1, 7,'Reminder',      'Reminder: Study Room A-305 (FCIS Building A) is booked for you tomorrow, Mon 2 Nov, 10:00–12:00.',                        TRUE, '2026-11-01 10:00+02'),
( 2, 3,'Confirmation',  'Your booking for Computer Lab 1 (General Purpose) on Wed 4 Nov, 09:00–11:00 is confirmed.',                               TRUE, '2026-10-27 10:02+02'),
( 3, 9,'Confirmation',  'Your booking for Study Room A-305 on Mon 16 Nov, 10:00–12:00 is confirmed.',                                              TRUE, '2026-11-08 22:31+02'),
( 4,10,'Confirmation',  'Your booking for Study Room A-305 on Mon 16 Nov, 12:00–14:00 is confirmed.',                                              FALSE,'2026-11-09 08:19+02'),
( 5,11,'Confirmation',  'Your booking for Study Room A-306 on Tue 17 Nov, 11:00–13:00 is confirmed.',                                              FALSE,'2026-11-09 15:47+02'),
( 6, 4,'Confirmation',  'Your booking for the Embedded Systems Lab on Wed 18 Nov, 09:00–12:00 is confirmed.',                                     FALSE,'2026-11-02 12:10+02'),
( 7,12,'Cancellation',  'You cancelled your booking for Group Study Pod 2 (Central Library) on Tue 24 Nov, 10:00–12:00.',                         TRUE, '2026-11-09 18:44+02'),
( 8, 7,'Confirmation',  'You are registered for "Git & GitHub Team Workflow" on Tue 17 Nov, 13:00–15:00, Computer Lab 1.',                        FALSE,'2026-11-08 20:11+02'),
( 9,13,'Cancellation',  'Your registration for "Building REST APIs with ASP.NET Core" has been cancelled.',                                         TRUE, '2026-11-08 09:12+02'),
(10, 8,'ScheduleChange','"ML Paper Reading Club: Attention Is All You Need" moved from Wed 2 Dec to Thu 3 Dec, 13:00–14:30, Seminar Room A-201.',  FALSE,'2026-11-10 12:00+02'),
(11,12,'ScheduleChange','"ML Paper Reading Club: Attention Is All You Need" moved from Wed 2 Dec to Thu 3 Dec, 13:00–14:30, Seminar Room A-201.',  FALSE,'2026-11-10 12:00+02'),
(12, 8,'Cancellation',  '"Movie Night: The Imitation Game" on Thu 10 Dec has been cancelled by the organisers. Your registration was cancelled.',  FALSE,'2026-11-10 16:30+02'),
(13,14,'Cancellation',  '"Movie Night: The Imitation Game" on Thu 10 Dec has been cancelled by the organisers. Your registration was cancelled.',  FALSE,'2026-11-10 16:30+02'),
(14,15,'Confirmation',  'Your booking for the VR Headset Set (5 headsets) on Sun 6 Dec, 13:00–15:00 is confirmed.',                              FALSE,'2026-11-11 10:15+02'),
(15, 7,'Confirmation',  'You are registered for "Graduation Projects Mid-Year Showcase" on Tue 15 Dec, 10:00–14:00, Lecture Hall 1.',             FALSE,'2026-11-11 09:30+02');

-- Move identity counters past the seeded IDs so new inserts don't collide
SELECT setval(pg_get_serial_sequence('"Users"','Id'),         (SELECT MAX("Id") FROM "Users"));
SELECT setval(pg_get_serial_sequence('"Facilities"','Id'),    (SELECT MAX("Id") FROM "Facilities"));
SELECT setval(pg_get_serial_sequence('"Events"','Id'),        (SELECT MAX("Id") FROM "Events"));
SELECT setval(pg_get_serial_sequence('"Speakers"','Id'),      (SELECT MAX("Id") FROM "Speakers"));
SELECT setval(pg_get_serial_sequence('"Bookings"','Id'),      (SELECT MAX("Id") FROM "Bookings"));
SELECT setval(pg_get_serial_sequence('"Registrations"','Id'), (SELECT MAX("Id") FROM "Registrations"));
SELECT setval(pg_get_serial_sequence('"Notifications"','Id'), (SELECT MAX("Id") FROM "Notifications"));

COMMIT;
