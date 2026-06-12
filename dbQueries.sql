create database demo;
use demo;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert demo users (passwords are hashed but for demo purposes, plain text: "password123")
INSERT INTO users (id, name, email, password, created_at) VALUES
(1, 'Test User', 'testuser@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIRSL9fF3y', '2026-01-15T10:30:00'),
(2, 'Bhavik Sorathiya', 'bhavik@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIRSL9fF3y', '2026-01-18T14:20:00'),
(3, 'Heer Patel', 'heer@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIRSL9fF3y', '2026-01-20T09:45:00');

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id INT PRIMARY KEY,
  profile_data JSON NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
               ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_profile
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

INSERT INTO user_profiles (user_id, profile_data) VALUES
(
  1,
  '{
    "target_role": "Associate Professor",
    "experience": { "level": "Experienced", "range_years": "7+" },
    "ats": {
      "score": 88,
      "explanation": "Strong alignment with academic teaching and research roles",
      "evaluated_at": "2026-01-25T10:00:00Z"
    },
    "skills": [
      { "name": "Academic Research", "level": "advanced", "source": "resume", "last_updated": "2026-01-25T10:00:00Z" },
      { "name": "Teaching & Curriculum Design", "level": "advanced", "source": "resume", "last_updated": "2026-01-25T10:00:00Z" },
      { "name": "International Business", "level": "advanced", "source": "resume", "last_updated": "2026-01-25T10:00:00Z" }
    ],
    "resumes": { "uploaded_count": 1, "max_allowed": 3 },
    "ai_metadata": { "last_model_used": "gpt-x", "last_processed_at": "2026-01-25T10:00:00Z" }
  }'
),
(
  2,
  '{
    "target_role": "Senior Graphic Design Specialist",
    "experience": { "level": "Experienced", "range_years": "6+" },
    "ats": {
      "score": 90,
      "explanation": "Excellent match for senior graphic design and creative leadership roles",
      "evaluated_at": "2026-01-25T10:00:00Z"
    },
    "skills": [
      { "name": "Graphic Design", "level": "advanced", "source": "resume", "last_updated": "2026-01-25T10:00:00Z" },
      { "name": "Adobe Creative Suite", "level": "advanced", "source": "resume", "last_updated": "2026-01-25T10:00:00Z" },
      { "name": "Figma", "level": "intermediate", "source": "resume", "last_updated": "2026-01-25T10:00:00Z" },
      { "name": "HTML", "level": "basic", "source": "resume", "last_updated": "2026-01-25T10:00:00Z" }
    ],
    "resumes": { "uploaded_count": 1, "max_allowed": 3 },
    "ai_metadata": { "last_model_used": "gpt-x", "last_processed_at": "2026-01-25T10:00:00Z" }
  }'
),
(
  3,
  '{
    "target_role": "Senior Restaurant Manager",
    "experience": { "level": "Highly Experienced", "range_years": "10+" },
    "ats": {
      "score": 92,
      "explanation": "Very strong alignment with senior hospitality and operations management roles",
      "evaluated_at": "2026-01-25T10:00:00Z"
    },
    "skills": [
      { "name": "Restaurant Operations Management", "level": "advanced", "source": "resume", "last_updated": "2026-01-25T10:00:00Z" },
      { "name": "Staff Leadership & Training", "level": "advanced", "source": "resume", "last_updated": "2026-01-25T10:00:00Z" },
      { "name": "Budgeting & Cost Control", "level": "advanced", "source": "resume", "last_updated": "2026-01-25T10:00:00Z" }
    ],
    "resumes": { "uploaded_count": 1, "max_allowed": 3 },
    "ai_metadata": { "last_model_used": "gpt-x", "last_processed_at": "2026-01-25T10:00:00Z" }
  }'
);

select * from user_profiles;

CREATE TABLE IF NOT EXISTS user_resumes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,

  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,

  file_type VARCHAR(20) DEFAULT 'docx',
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_user_resumes
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

INSERT INTO user_resumes (
  user_id,
  file_name,
  file_path,
  file_type
)
VALUES
(
  1,
  '1_testuser_resume_1.docx',
  '/uploads/resumes/1_testuser_resume_1.docx',
  'docx'
),
(
  2,
  '2_bhavik_resume_1.docx',
  '/uploads/resumes/2_bhavik_resume_1.docx',
  'docx'
),
(
  3,
  '3_heer_resume_1.docx',
  '/uploads/resumes/3_heer_resume_1.docx',
  'docx'
);

select * from users;
select * from user_resumes;
delete from user_resumes where id = 6;
ALTER TABLE user_resumes AUTO_INCREMENT = 6;

CREATE TABLE IF NOT EXISTS resume_analysis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  resume_id INT NOT NULL,
  user_id INT NOT NULL,
  analysis_data JSON NOT NULL,
  analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (resume_id) REFERENCES user_resumes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO resume_analysis (resume_id, user_id, analysis_data)
VALUES
(
  1,
  1,
  '{
    "resume_context": {
      "target_role": "Associate Professor",
      "experience_level": "Experienced",
      "experience_range_years": "7+"
    },
    "ats_analysis": {
      "score": 88,
      "verdict": "Very Good",
      "explanation": "Resume strongly aligns with academic teaching and research roles"
    },
    "skills_analysis": {
      "identified": [
        { "name": "Academic Research", "level": "advanced" },
        { "name": "Teaching & Curriculum Design", "level": "advanced" },
        { "name": "International Business", "level": "advanced" }
      ],
      "additional_user_skills": [
        { "name": "Spanish", "level": "intermediate" }
      ]
    },
    "experience_analysis": {
      "total_estimated_years": 8,
      "role_based_experience": [
        { "area": "Teaching / Academia", "experience_years": 5, "experience_score": 90 },
        { "area": "Research", "experience_years": 3, "experience_score": 85 },
        { "area": "Leadership / Management", "experience_years": 1, "experience_score": 70 }
      ],
      "project_count": 6,
      "internship_experience": false
    },
    "education_analysis": {
      "educations": [
        {
          "degree": "Ph.D.",
          "field_of_study": "Business Administration",
          "institution": "Harvard Business School",
          "institution_type": "University",
          "start_year": 2018,
          "end_year": 2021,
          "status": "Completed"
        },
        {
          "degree": "MBA",
          "field_of_study": "Business Administration",
          "institution": "Cornell SC Johnson School of Business",
          "institution_type": "University",
          "start_year": 2016,
          "end_year": 2018,
          "status": "Completed"
        },
        {
          "degree": "BBA",
          "field_of_study": "Business Administration",
          "institution": "West Chester University of Pennsylvania",
          "institution_type": "University",
          "start_year": 2010,
          "end_year": 2014,
          "status": "Completed"
        }
      ]
    },
    "resume_sections": {
      "summary": true,
      "education": true,
      "projects": false,
      "experience": true,
      "skills": true,
      "certifications": false
    },
    "swot_analysis": {
      "strengths": [
        "Strong academic research background",
        "Extensive teaching experience"
      ],
      "weaknesses": [
        "Limited industry exposure",
        "Highly specialized academic focus"
      ],
      "opportunities": [
        "Interdisciplinary research collaborations",
        "Policy and consulting applications"
      ],
      "threats": [
        "Competitive academic job market",
        "High publication expectations"
      ]
    },
    "resume_improvements": {
      "high_priority": [
        {
          "area": "Research Impact",
          "suggestion": "Highlight citation counts and real-world research impact",
          "impact": "High"
        }
      ],
      "medium_priority": [
        {
          "area": "Skills Section",
          "suggestion": "Add research methodologies and tools",
          "impact": "Medium"
        }
      ],
      "low_priority": [
        {
          "area": "Formatting",
          "suggestion": "Condense conference descriptions",
          "impact": "Low"
        }
      ]
    },
    "recommendations": {
      "career_growth": [
        "Pursue interdisciplinary research",
        "Engage in global academic collaborations"
      ],
      "learning_focus": [
        "Advanced quantitative methods",
        "International business policy trends"
      ]
    },
    "analysis_metadata": {
      "model": "gpt-x",
      "prompt_version": "resume-analysis-v2.1",
      "analyzed_at": "2026-01-25T10:00:00Z"
    }
  }'
),
(
  2,
  2,
  '{
    "resume_context": {
      "target_role": "Senior Graphic Design Specialist",
      "experience_level": "Experienced",
      "experience_range_years": "6+"
    },
    "ats_analysis": {
      "score": 90,
      "verdict": "Excellent",
      "explanation": "Resume strongly aligns with senior graphic design roles"
    },
    "skills_analysis": {
      "identified": [
        { "name": "Graphic Design", "level": "advanced" },
        { "name": "Adobe Creative Suite", "level": "advanced" },
        { "name": "Branding & Visual Identity", "level": "advanced" },
        { "name": "UI / Digital Design", "level": "intermediate" }
      ],
      "additional_user_skills": [
        { "name": "Team Leadership", "level": "intermediate" }
      ]
    },
    "experience_analysis": {
      "total_estimated_years": 6,
      "role_based_experience": [
        { "area": "Graphic Design", "experience_years": 6, "experience_score": 92 },
        { "area": "Creative Leadership", "experience_years": 3, "experience_score": 80 },
        { "area": "Project Management", "experience_years": 2, "experience_score": 70 }
      ],
      "project_count": 10,
      "internship_experience": false
    },
    "education_analysis": {
      "educations": [
        {
          "degree": "Bachelor of Fine Arts",
          "field_of_study": "Graphic Design",
          "institution": "Rochester Technology",
          "institution_type": "University",
          "start_year": null,
          "end_year": null,
          "status": "Completed"
        }
      ]
    },
    "resume_sections": {
      "summary": true,
      "education": true,
      "projects": true,
      "experience": true,
      "skills": true,
      "certifications": false
    },
    "swot_analysis": {
      "strengths": [
        "Strong visual design expertise",
        "Creative leadership experience"
      ],
      "weaknesses": [
        "Limited non-design technical exposure"
      ],
      "opportunities": [
        "Transition into creative director roles",
        "Expand UX design portfolio"
      ],
      "threats": [
        "High competition in senior creative roles"
      ]
    },
    "resume_improvements": {
      "high_priority": [
        {
          "area": "Portfolio Impact",
          "suggestion": "Add measurable business impact metrics",
          "impact": "High"
        }
      ],
      "medium_priority": [
        {
          "area": "Skills Section",
          "suggestion": "Group tools by category",
          "impact": "Medium"
        }
      ],
      "low_priority": [
        {
          "area": "Formatting",
          "suggestion": "Reduce repetition in role descriptions",
          "impact": "Low"
        }
      ]
    },
    "recommendations": {
      "career_growth": [
        "Move toward creative director roles",
        "Develop advanced UX strategy skills"
      ],
      "learning_focus": [
        "Design systems",
        "Accessibility standards"
      ]
    },
    "analysis_metadata": {
      "model": "gpt-x",
      "prompt_version": "resume-analysis-v2.1",
      "analyzed_at": "2026-01-25T10:00:00Z"
    }
  }'
),
(
  3,
  3,
  '{
    "resume_context": {
      "target_role": "Senior Restaurant Manager",
      "experience_level": "Highly Experienced",
      "experience_range_years": "10+"
    },
    "ats_analysis": {
      "score": 92,
      "verdict": "Excellent",
      "explanation": "Resume strongly aligns with senior hospitality management roles"
    },
    "skills_analysis": {
      "identified": [
        { "name": "Restaurant Operations Management", "level": "advanced" },
        { "name": "Staff Leadership & Training", "level": "advanced" },
        { "name": "Customer Service & Guest Relations", "level": "advanced" },
        { "name": "Cost Control & Budgeting", "level": "advanced" }
      ],
      "additional_user_skills": [
        { "name": "Regulatory & Health Compliance", "level": "advanced" }
      ]
    },
    "experience_analysis": {
      "total_estimated_years": 10,
      "role_based_experience": [
        { "area": "Restaurant Management", "experience_years": 10, "experience_score": 95 },
        { "area": "Team Leadership", "experience_years": 8, "experience_score": 90 },
        { "area": "Operations & Cost Optimization", "experience_years": 6, "experience_score": 85 }
      ],
      "project_count": 0,
      "internship_experience": false
    },
    "education_analysis": {
      "educations": [
        {
          "degree": "Bachelor of Science",
          "field_of_study": "Hospitality Management",
          "institution": "California State University Long Beach",
          "institution_type": "University",
          "start_year": null,
          "end_year": null,
          "status": "Completed"
        }
      ]
    },
    "resume_sections": {
      "summary": true,
      "education": true,
      "projects": false,
      "experience": true,
      "skills": true,
      "certifications": true
    },
    "swot_analysis": {
      "strengths": [
        "Extensive high-volume restaurant management experience",
        "Strong operational leadership"
      ],
      "weaknesses": [
        "Industry-specific experience"
      ],
      "opportunities": [
        "Regional or multi-unit management roles",
        "Hospitality consulting"
      ],
      "threats": [
        "Economic fluctuations impacting hospitality industry"
      ]
    },
    "resume_improvements": {
      "high_priority": [
        {
          "area": "Quantified Impact",
          "suggestion": "Highlight revenue growth and profitability metrics",
          "impact": "High"
        }
      ],
      "medium_priority": [
        {
          "area": "Certifications",
          "suggestion": "Group certifications for better visibility",
          "impact": "Medium"
        }
      ],
      "low_priority": [
        {
          "area": "Formatting",
          "suggestion": "Tighten bullet points for ATS readability",
          "impact": "Low"
        }
      ]
    },
    "recommendations": {
      "career_growth": [
        "Move into regional management",
        "Develop business expansion strategies"
      ],
      "learning_focus": [
        "Advanced financial forecasting",
        "Hospitality analytics"
      ]
    },
    "analysis_metadata": {
      "model": "gpt-x",
      "prompt_version": "resume-analysis-v2.1",
      "analyzed_at": "2026-01-25T10:00:00Z"
    }
  }'
);

SELECT *
FROM user_resumes;

ALTER TABLE user_resumes AUTO_INCREMENT = 1;

select * from resume_analysis;

select * from interview_sessions;
delete from interview_sessions where id = 3;
ALTER TABLE interview_sessions AUTO_INCREMENT = 1;

select * from interview_messages;
delete from interview_messages where session_id = 2 or session_id = 3;
ALTER TABLE interview_messages AUTO_INCREMENT = 1;


select * from interview_question_evaluations;

CREATE TABLE interview_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,

  user_id INT NOT NULL,
  resume_id INT,
  role VARCHAR(100) NOT NULL,

  total_questions INT DEFAULT 0,
  max_questions INT DEFAULT 15,

  weak_answer_count INT DEFAULT 0,

  status ENUM('active', 'completed') DEFAULT 'active',

  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (resume_id) REFERENCES user_resumes(id)
);

CREATE TABLE interview_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,

  session_id INT NOT NULL,

  sender ENUM('ai', 'user') NOT NULL,
  message TEXT NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (session_id) REFERENCES interview_sessions(id)
);

CREATE TABLE interview_question_evaluations (
  id INT AUTO_INCREMENT PRIMARY KEY,

  session_id INT NOT NULL,

  question TEXT NOT NULL,
  answer TEXT NOT NULL,

  question_type ENUM('technical','hr','resume','scenario','follow_up') NOT NULL,
  difficulty ENUM('easy','medium','hard') NOT NULL,

  score INT NOT NULL,
  rating ENUM('good','average','weak') NOT NULL,
  confidence INT NOT NULL,

  technical_score INT,
  communication_score INT,
  problem_solving_score INT,

  feedback TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (session_id) REFERENCES interview_sessions(id)
);

CREATE TABLE interview_results (
  id INT AUTO_INCREMENT PRIMARY KEY,

  session_id INT NOT NULL,

  overall_score INT NOT NULL,
  verdict ENUM('STRONG_HIRE','HIRE','LEANING_NO','NO_HIRE') NOT NULL,

  result_data JSON NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (session_id) REFERENCES interview_sessions(id)
);