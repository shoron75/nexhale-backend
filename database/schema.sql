

-- =====================
-- LEADERBOARD
-- =====================
CREATE TABLE IF NOT EXISTS Leaderboard (
    leaderboard_id INT AUTO_INCREMENT PRIMARY KEY,
    period_type VARCHAR(20),
    `rank` INT,
    badge_type VARCHAR(50)
);

-- =====================
-- USERS
-- =====================
CREATE TABLE IF NOT EXISTS Users (
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
CREATE TABLE IF NOT EXISTS Cigarette_Brand (
    brand_id INT AUTO_INCREMENT PRIMARY KEY,
    brand_name VARCHAR(100),
    variant VARCHAR(100),
    category VARCHAR(50),
    nicotine_per_cigarette DECIMAL(5,2),
    tar_per_cigarette DECIMAL(6,2)
);

-- =====================
-- HEALTH IMPACT
-- =====================
CREATE TABLE IF NOT EXISTS Health_Impact (
    impact_id INT AUTO_INCREMENT PRIMARY KEY,
    tar_min INT,
    tar_max INT,
    nicotine_min INT,
    nicotine_max INT,
    risk_percentage INT,
    risk_tier VARCHAR(20)
);

-- =====================
-- HEALTH IMPACT DETAIL
-- =====================
CREATE TABLE IF NOT EXISTS Health_Impact_Detail (
    impact_detail_id INT AUTO_INCREMENT PRIMARY KEY,
    impact_id INT,
    impact_description TEXT,
    impact_type VARCHAR(50), -- Behavioral, Addiction
    FOREIGN KEY (impact_id) REFERENCES Health_Impact(impact_id)
);

-- =====================
-- SMOKING LOG
-- =====================
CREATE TABLE IF NOT EXISTS Smoking_Log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    log_date DATETIME,
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
CREATE TABLE IF NOT EXISTS Vape_Log (
    vape_log_id INT AUTO_INCREMENT PRIMARY KEY,
    log_date DATETIME,
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
CREATE TABLE IF NOT EXISTS Mood (
    mood_id INT AUTO_INCREMENT PRIMARY KEY,
    mood_type VARCHAR(50)
);

-- =====================
-- MOOD LOG ASSOCIATION
-- =====================
CREATE TABLE IF NOT EXISTS Mood_Log_Associated (
    mood_id INT,
    log_id INT,
    PRIMARY KEY (mood_id, log_id),
    FOREIGN KEY (mood_id) REFERENCES Mood(mood_id),
    FOREIGN KEY (log_id) REFERENCES Smoking_Log(log_id)
);

-- =====================
-- MOOD VAPE ASSOCIATION
-- =====================
CREATE TABLE IF NOT EXISTS Mood_Vape_Associated (
    mood_id INT,
    vape_log_id INT,
    PRIMARY KEY (mood_id, vape_log_id),
    FOREIGN KEY (mood_id) REFERENCES Mood(mood_id),
    FOREIGN KEY (vape_log_id) REFERENCES Vape_Log(vape_log_id)
);

-- =====================
-- RESULT
-- =====================
CREATE TABLE IF NOT EXISTS Result (
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
CREATE TABLE IF NOT EXISTS Quit_Plan (
    plan_id INT AUTO_INCREMENT PRIMARY KEY,
    target_nicotine_amount DECIMAL(8,2),
    starting_date DATE,
    end_date DATE,
    alert BOOLEAN,
    current_status VARCHAR(30),
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);
