

-- =====================
-- LEADERBOARD
-- =====================
CREATE TABLE Leaderboard (
    leaderboard_id INT AUTO_INCREMENT PRIMARY KEY,
    period_type VARCHAR(20),
    `rank` INT,
    badge_type VARCHAR(50)
);

INSERT INTO Leaderboard (period_type, `rank`, badge_type) VALUES
('Daily',1,'Gold'),
('Daily',2,'Silver'),
('Daily',3,'Bronze'),
('Monthly',1,'Platinum'),
('Monthly',2,'Gold');

-- =====================
-- USERS
-- =====================
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    user_name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    pass VARCHAR(255),
    preferred_brand VARCHAR(100),
    preferred_vape_flavor VARCHAR(100),
    preferred_vape_liquid_amount DECIMAL(5,2),
    registration_date DATE DEFAULT (CURRENT_DATE),
    leaderboard_id INT,
    FOREIGN KEY (leaderboard_id) REFERENCES Leaderboard(leaderboard_id)
);

-- =====================
-- CIGARETTE BRAND
-- =====================
CREATE TABLE Cigarette_Brand (
    brand_id INT AUTO_INCREMENT PRIMARY KEY,
    brand_name VARCHAR(100),
    variant VARCHAR(100),
    category VARCHAR(50),
    nicotine_per_cigarette DECIMAL(5,2),
    tar_per_cigarette DECIMAL(6,2)
);

-- =====================
-- INSERT CIGARETTE BRANDS
-- =====================
INSERT INTO Cigarette_Brand VALUES
(1,'Benson & Hedges','Special Filter','Full Flavor',1.00,12),
(2,'Benson & Hedges','Blue Gold','Light / Blue',0.65,8),
(3,'Benson & Hedges','Switch / Platinum','Switch / Capsule',0.80,10),
(4,'Gold Leaf','JP Gold Leaf','Full Flavor',1.00,12),
(5,'John Player','Special','Light / Blue',0.65,8),
(6,'John Player','Switch','Switch / Capsule',0.80,10),
(7,'Lucky Strike','Original / Red','Full Flavor',1.00,12),
(8,'Lucky Strike','Cool Crunch / Fresh Twist','Switch / Capsule',0.80,10),
(9,'Marlboro','Red','Full Flavor',1.00,12),
(10,'Marlboro','Gold / Advance','Light / Blue',0.65,8),
(11,'Winston','Red','Full Flavor',1.00,12),
(12,'Winston','Blue','Light / Blue',0.65,8),
(13,'Camel','Filter','Full Flavor',1.00,12),
(14,'Camel','Blue','Light / Blue',0.65,8),
(15,'Pall Mall','Full Flavor','Full Flavor',1.00,12),
(16,'Pall Mall','Smooth / Blue','Light / Blue',0.65,8),
(17,'Star','Star Filter','Full Flavor',1.00,12),
(18,'Derby','Full Flavor','Full Flavor',1.00,12),
(19,'Derby','Style','Light / Blue',0.65,8),
(20,'Royals','Gold / Next','Full Flavor',1.00,12),
(21,'Sheikh','Sheikh Filter','Full Flavor',1.00,12),
(22,'Navy','Navy Regular','Full Flavor',1.00,12),
(23,'Hollywood','Blue / Red','Full Flavor',1.00,12),
(24,'Pilot','Pilot Filter','Full Flavor',1.00,12),
(25,'Marise','Special Blend','Full Flavor',1.00,12);


-- =====================
-- HEALTH IMPACT
-- =====================
CREATE TABLE Health_Impact (
    impact_id INT AUTO_INCREMENT PRIMARY KEY,
    tar_min INT,
    tar_max INT,
    nicotine_min INT,
    nicotine_max INT,
    risk_percentage INT,
    risk_tier VARCHAR(20)
);

INSERT INTO Health_Impact (impact_id, tar_min, tar_max, nicotine_min, nicotine_max, risk_percentage, risk_tier) VALUES
(1, 0, 1500, 0, 120, 10, 'Safe / Monitoring'),
(2, 1501, 3000, 121, 250, 25, 'Monitoring'),
(3, 3001, 4500, 251, 380, 40, 'Elevated'),
(4, 4501, 6000, 381, 500, 60, 'High'),
(5, 6001, 8000, 501, 650, 80, 'Critical'),
(6, 8001, 999999, 651, 999999, 95, 'Emergency');

-- =====================
-- HEALTH IMPACT DETAIL
-- =====================
CREATE TABLE Health_Impact_Detail (
    impact_detail_id INT AUTO_INCREMENT PRIMARY KEY,
    impact_id INT,
    impact_description TEXT,
    impact_type VARCHAR(50), -- Behavioral, Addiction
    FOREIGN KEY (impact_id) REFERENCES Health_Impact(impact_id)
);

INSERT INTO Health_Impact_Detail (impact_id, impact_type, impact_description) VALUES
(1, 'Behavioral', 'Statistical likelihood of lung stress is minimal; natural clearing processes remain highly active.'),
(1, 'Addiction', 'Low impact on brain chemistry; behavioral pattern is likely situational rather than a physical requirement.'),
(2, 'Behavioral', 'Possible early probability of minor airway irritation or statistical decrease in peak athletic stamina.'),
(2, 'Addiction', 'Moderate behavioral impact; daily routines begin to statistically align with specific smoking times.'),
(3, 'Behavioral', 'Increased statistical probability of cardiovascular strain; potential for heart rate to remain elevated post-activity.'),
(3, 'Addiction', 'High addiction potential; statistical likelihood of withdrawal-related irritability or restlessness if intake is delayed.'),
(4, 'Behavioral', 'Significant statistical probability of persistent lung stress; the body\'s self-cleaning efficiency is likely hampered.'),
(4, 'Addiction', 'Very high addiction impact; behavioral patterns are frequently dictated by the brain\'s chemical requirement for nicotine.'),
(5, 'Behavioral', 'High statistical likelihood of chronic respiratory strain and consistent stress on the heart and blood vessels.'),
(5, 'Addiction', 'Extreme addiction impact; statistical data suggests smoking likely occurs within 30 minutes of waking; high behavioral dependency.'),
(6, 'Behavioral', 'Severe statistical probability of long-term lung and heart fatigue; physical capacity is likely consistently compromised.'),
(6, 'Addiction', 'Maximum addiction impact; daily behavior is almost entirely focused on maintaining nicotine levels; highest probability of severe withdrawal.');


-- =====================
-- SMOKING LOG
-- =====================
CREATE TABLE Smoking_Log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    log_date DATE,
    cigarette_count INT,
    cost DECIMAL(10,2),
    user_id INT,
    brand_id INT,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (brand_id) REFERENCES Cigarette_Brand(brand_id)
);

-- =====================
-- VAPE LOG
-- =====================
CREATE TABLE Vape_Log (
    vape_log_id INT AUTO_INCREMENT PRIMARY KEY,
    log_date DATE,
    puffs INT,
    liquid_amount DECIMAL(6,2),
    nicotine_amount DECIMAL(8,2),
    flavor VARCHAR(50),
    pg_percentage INT,
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

-- =====================
-- MOOD
-- =====================
CREATE TABLE Mood (
    mood_id INT AUTO_INCREMENT PRIMARY KEY,
    mood_type VARCHAR(50)
);

INSERT INTO Mood VALUES
(NULL,'Happy'),
(NULL,'Stressed'),
(NULL,'Anxious'),
(NULL,'Relaxed'),
(NULL,'Depressed'),
(NULL,'Angry'),
(NULL,'Tired'),
(NULL,'Focused'),
(NULL,'Lonely');

-- =====================
-- MOOD LOG ASSOCIATION
-- =====================
CREATE TABLE Mood_Log_Associated (
    mood_id INT,
    log_id INT,
    PRIMARY KEY (mood_id, log_id),
    FOREIGN KEY (mood_id) REFERENCES Mood(mood_id),
    FOREIGN KEY (log_id) REFERENCES Smoking_Log(log_id)
);

-- =====================
-- MOOD VAPE ASSOCIATION
-- =====================
CREATE TABLE Mood_Vape_Associated (
    mood_id INT,
    vape_log_id INT,
    PRIMARY KEY (mood_id, vape_log_id),
    FOREIGN KEY (mood_id) REFERENCES Mood(mood_id),
    FOREIGN KEY (vape_log_id) REFERENCES Vape_Log(vape_log_id)
);

-- =====================
-- RESULT
-- =====================
CREATE TABLE Result (
    result_id INT AUTO_INCREMENT PRIMARY KEY,
    period_type VARCHAR(20),
    total_cigarettes INT,
    user_id INT,
    impact_id INT,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (impact_id) REFERENCES Health_Impact(impact_id)
);

-- =====================
-- QUIT PLAN
-- =====================
CREATE TABLE Quit_Plan (
    plan_id INT AUTO_INCREMENT PRIMARY KEY,
    target_nicotine_amount DECIMAL(8,2),
    starting_date DATE,
    end_date DATE,
    alert BOOLEAN,
    current_status VARCHAR(30),
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);
