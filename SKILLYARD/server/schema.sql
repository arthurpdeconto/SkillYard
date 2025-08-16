
CREATE DATABASE IF NOT EXISTS skillyard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE skillyard;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  bio VARCHAR(255) DEFAULT NULL,
  location VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabela de habilidades
CREATE TABLE IF NOT EXISTS skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(80) NOT NULL,
  description TEXT,
  tags VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_skills_user (user_id)
) ENGINE=InnoDB;

-- Tabela de pedidos (requisições) de troca
CREATE TABLE IF NOT EXISTS requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  requester_id INT NOT NULL,
  receiver_id INT NOT NULL,
  skill_id INT NOT NULL,
  message TEXT,
  status ENUM('pending','accepted','declined','completed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
  INDEX idx_requests_users (requester_id, receiver_id)
) ENGINE=InnoDB;

-- Tabela de avaliações
CREATE TABLE IF NOT EXISTS ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rater_id INT NOT NULL,
  ratee_id INT NOT NULL,
  stars INT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rater_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (ratee_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_one_rating_per_pair (rater_id, ratee_id)
) ENGINE=InnoDB;

-- View para média de avaliações por usuário
DROP VIEW IF EXISTS user_avg_rating;
CREATE VIEW user_avg_rating AS
SELECT ratee_id AS user_id, ROUND(AVG(stars), 2) AS avg_stars, COUNT(*) AS ratings_count
FROM ratings
GROUP BY ratee_id;

-- Tabela de mensagens privadas
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_thread (sender_id, receiver_id, created_at)
) ENGINE=InnoDB;
