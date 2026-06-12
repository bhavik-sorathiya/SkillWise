CREATE DATABASE skillwise_dev;
USE skillwise_dev;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,

    full_name VARCHAR(255) NOT NULL,

    email VARCHAR(255) UNIQUE NOT NULL,

    password_hash TEXT NOT NULL,

    is_verified BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT NOW(),

    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_profiles (
    user_id BIGINT UNSIGNED PRIMARY KEY,

    gender ENUM(
        'male',
        'female',
        'non_binary',
        'prefer_not_to_say'
    ),

    preferred_roles JSON,

    experience_level VARCHAR(50),

    years_of_experience INT,

    education TEXT,

    bio TEXT,

    profile_completed BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_profiles_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE user_resumes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    user_id BIGINT UNSIGNED NOT NULL,

    title VARCHAR(255) NOT NULL,

    target_role VARCHAR(255),

    file_name VARCHAR(255) NOT NULL,

    file_path TEXT NOT NULL,

    file_size BIGINT,

    status ENUM('active','deleted') DEFAULT 'active',

    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_user_resumes_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE resume_analysis (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    resume_id BIGINT UNSIGNED NOT NULL,

    user_id BIGINT UNSIGNED NOT NULL,

    analysis_data JSON NOT NULL,

    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_resume_analysis_resume
        FOREIGN KEY (resume_id)
        REFERENCES user_resumes(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_resume_analysis_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE interview_sessions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    user_id BIGINT UNSIGNED NOT NULL,

    resume_id BIGINT UNSIGNED DEFAULT NULL,

    role VARCHAR(100) NOT NULL,

    total_questions INT DEFAULT 0,

    max_questions INT DEFAULT 15,

    weak_answer_count INT DEFAULT 0,

    status ENUM('active','completed') DEFAULT 'active',

    started_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

    ended_at TIMESTAMP NULL DEFAULT NULL,

    PRIMARY KEY (id),

    KEY idx_user_id (user_id),

    KEY idx_resume_id (resume_id),

    CONSTRAINT fk_interview_sessions_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_interview_sessions_resume
        FOREIGN KEY (resume_id)
        REFERENCES user_resumes(id)
);

CREATE TABLE interview_messages (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    session_id BIGINT UNSIGNED NOT NULL,

    sender ENUM('ai','user') NOT NULL,

    message TEXT NOT NULL,

    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    KEY idx_session_id (session_id),

    CONSTRAINT fk_interview_messages_session
        FOREIGN KEY (session_id)
        REFERENCES interview_sessions(id)
);

CREATE TABLE interview_question_evaluations (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    session_id BIGINT UNSIGNED NOT NULL,

    question TEXT NOT NULL,

    answer TEXT NOT NULL,

    question_type ENUM(
        'technical',
        'hr',
        'resume',
        'scenario',
        'follow_up'
    ) NOT NULL,

    difficulty ENUM(
        'easy',
        'medium',
        'hard'
    ) NOT NULL,

    score INT NOT NULL,

    rating ENUM(
        'good',
        'average',
        'weak'
    ) NOT NULL,

    confidence INT NOT NULL,

    technical_score INT DEFAULT NULL,

    communication_score INT DEFAULT NULL,

    problem_solving_score INT DEFAULT NULL,

    feedback TEXT,

    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    KEY idx_session_id (session_id),

    CONSTRAINT fk_interview_evaluations_session
        FOREIGN KEY (session_id)
        REFERENCES interview_sessions(id)
);

CREATE TABLE interview_results (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  session_id BIGINT UNSIGNED NOT NULL,
  overall_score INT NOT NULL,
  verdict ENUM(
    'STRONG_HIRE',
    'HIRE',
    'LEANING_NO',
    'NO_HIRE'
  ) NOT NULL,
  result_data JSON NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  KEY session_id (session_id),

  CONSTRAINT interview_results_ibfk_1
    FOREIGN KEY (session_id)
    REFERENCES interview_sessions(id)
);

INSERT INTO users (
    id,
    full_name,
    email,
    password_hash,
    is_verified,
    created_at,
    updated_at
)
VALUES
(
    1,
    'Test User',
    'test@example.com',
    '$2a$12$LwWeDizrnG2tsOyTw4afiOtCzR2f1l3faEYA2p5vJC1moc/Kzg0CC',
    FALSE,
    '2026-01-19 23:54:16',
    '2026-01-19 23:54:16'
),
(
    2,
    'Bhavik',
    'bhaviktest@example.com',
    '$2a$12$ly1dlBZXmkbo9Bzz/ttsMOT4eJQhnKhJB7dmMad3oVoZ7RxCIZ6AK',
    FALSE,
    '2026-02-03 12:31:46',
    '2026-02-03 12:31:46'
),
(
    3,
    'Heer',
    'heertest@example.com',
    '$2a$12$X4.T1G7UnR1Tye2UPt7n.eM2K9KTgjE2b7Cpx1geAUjpOqp227ij.',
    FALSE,
    '2026-02-03 12:36:52',
    '2026-02-03 12:36:52'
),
(
    4,
    'abc',
    'abc@gmail.com',
    '$2a$12$63dZD8zIoKmnlIzDljMsHO7eMdYsJDvvTDaTc7oP69pe7WT9zYsKS',
    FALSE,
    '2026-02-16 11:50:26',
    '2026-02-16 11:50:26'
);

INSERT INTO user_profiles (
    user_id,
    gender,
    preferred_roles,
    experience_level,
    years_of_experience,
    education,
    bio,
    profile_completed,
    created_at,
    updated_at
)
VALUES

(
    1,
    'male',
    JSON_ARRAY(
        'Associate Professor',
        'Digital Marketing Director'
    ),
    'Experienced',
    8,
    'PhD (Business Administration)',
    NULL,
    TRUE,
    NOW(),
    '2026-02-10 02:29:22'
),

(
    2,
    'male',
    JSON_ARRAY(
        'Senior Graphic Design',
        'Senior Digital Marketing Director'
    ),
    'Experienced',
    8,
    'Bachelor of Arts (Communications)',
    NULL,
    TRUE,
    NOW(),
    '2026-02-08 01:09:12'
),

(
    3,
    'female',
    JSON_ARRAY(
        'Restaurant Manager'
    ),
    'Entry Level',
    0,
    'Bachelor of Science (Hospitality Management)',
    NULL,
    TRUE,
    NOW(),
    '2026-02-08 01:09:12'
);

INSERT INTO user_resumes (
    id,
    user_id,
    title,
    target_role,
    file_name,
    file_path,
    file_size,
    status,
    uploaded_at
)
VALUES
(
    1,
    1,
    'Test User Resume 1',
    'Assistant Professor',
    '1_testuser_resume_1.docx',
    '/uploads/resumes/1_testuser_resume_1.docx',
    284672,
    'active',
    '2026-02-16 12:55:52'
),
(
    2,
    2,
    'Bhavik Resume 1',
    'Senior Graphic Designer',
    '2_bhavik_resume_1.docx',
    '/uploads/resumes/2_bhavik_resume_1.docx',
    315904,
    'active',
    '2026-02-16 12:55:52'
),
(
    3,
    3,
    'Heer Resume 1',
    'Restaurant Manager',
    '3_heer_resume_1.docx',
    '/uploads/resumes/3_heer_resume_1.docx',
    298496,
    'active',
    '2026-02-16 12:55:52'
),
(
    4,
    1,
    'Test User Resume 2',
    'Digital Marketing Director',
    '1_Test_User_resume_2.docx',
    '/uploads/resumes/1_Test_User_resume_2.docx',
    342016,
    'active',
    '2026-02-16 14:06:25'
),
(
    5,
    2,
    'Bhavik Resume 2',
    'Digital Marketing Director',
    '2_Bhavik_resume_2.docx',
    '/uploads/resumes/2_Bhavik_resume_2.docx',
    367104,
    'active',
    '2026-05-01 09:00:05'
);

INSERT INTO skillwise_dev.resume_analysis (
    resume_id,
    user_id,
    analysis_data,
    analyzed_at
)
SELECT
    resume_id,
    user_id,
    analysis_data,
    analyzed_at
FROM demo.resume_analysis;

INSERT INTO skillwise_dev.interview_sessions
SELECT *
FROM demo.interview_sessions;

INSERT INTO skillwise_dev.interview_messages
SELECT *
FROM demo.interview_messages;

INSERT INTO skillwise_dev.interview_question_evaluations
SELECT *
FROM demo.interview_question_evaluations;

INSERT INTO skillwise_dev.interview_results
SELECT *
FROM demo.interview_results;

select * FROM resume_analysis;

SHOW TABLE STATUS LIKE 'AAA';

SHOW CREATE TABLE users;