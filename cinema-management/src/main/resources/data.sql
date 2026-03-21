-- Insert default genres for testing
INSERT INTO genres (name, description, slug) VALUES
('Hành động', 'Phim hành động gay cấn, mạo hiểm', 'hanh-dong'),
('Tình cảm', 'Phim lãng mạn, tình yêu', 'tinh-cam'),
('Kinh dị', 'Phim kinh dị, ma quỷ', 'kinh-di'),
('Hài', 'Phim hài hước, giải trí', 'hai'),
('Phiêu lưu', 'Phim phiêu lưu, khám phá', 'phieu-luu'),
('Khoa học viễn tưởng', 'Phim khoa học viễn tưởng, công nghệ', 'khoa-hoc-vien-tuong'),
('Hoạt hình', 'Phim hoạt hình, animation', 'hoat-hinh'),
('Hình sự', 'Phim hình sự, trinh thám', 'hinh-su'),
('Chiến tranh', 'Phim chiến tranh, quân sự', 'chien-tranh'),
('Gia đình', 'Phim gia đình, phù hợp mọi lứa tuổi', 'gia-dinh'),
('Thần thoại', 'Phim thần thoại, huyền thoại', 'than-thoai'),
('Tài liệu', 'Phim tài liệu, documentary', 'tai-lieu'),
('Nhạc kịch', 'Phim nhạc kịch, musical', 'nhac-kich'),
('Thể thao', 'Phim về thể thao', 'the-thao'),
('Lịch sử', 'Phim lịch sử, cổ trang', 'lich-su');

-- Sample movies (optional - for testing)
INSERT INTO movies (title, description, director, cast, duration, language, country, release_date, rating, age_rating, status, poster_url, trailer_url, created_at, updated_at) VALUES
('Avatar: The Way of Water', 'Jake Sully sống cùng gia đình mới của mình trên hành tinh Pandora. Khi một mối đe dọa cũ trở lại, Jake phải làm việc với Neytiri và quân đội của tộc Na vi để bảo vệ hành tinh của họ.', 'James Cameron', 'Sam Worthington, Zoe Saldana, Sigourney Weaver', 192, 'Tiếng Anh', 'Mỹ', '2022-12-16', 8.5, 'T13', 'NOW_SHOWING', NULL, 'https://www.youtube.com/watch?v=d9MyW72ELq0', NOW(), NOW()),
('Spider-Man: No Way Home', 'Peter Parker bị lộ danh tính và nhờ Doctor Strange giúp đỡ. Phép thuật đã sai lầm khiến các phản diện từ đa vũ trụ xuất hiện.', 'Jon Watts', 'Tom Holland, Zendaya, Benedict Cumberbatch', 148, 'Tiếng Anh', 'Mỹ', '2021-12-17', 9.0, 'T13', 'ENDED', NULL, 'https://www.youtube.com/watch?v=JfVOs4VSpmA', NOW(), NOW()),
('Oppenheimer', 'Câu chuyện về J. Robert Oppenheimer, nhà vật lý học được coi là cha đẻ của bom nguyên tử.', 'Christopher Nolan', 'Cillian Murphy, Emily Blunt, Robert Downey Jr.', 180, 'Tiếng Anh', 'Mỹ', '2023-07-21', 9.2, 'T16', 'ENDED', NULL, NULL, NOW(), NOW()),
('Mai', 'Câu chuyện về Mai, một phụ nữ trầm lặng có cuộc sống bình thường nhưng ẩn chứa nhiều bí mật.', 'Trấn Thành', 'Phương Anh Đào, Tuấn Trần, Hồng Đào', 131, 'Tiếng Việt', 'Việt Nam', '2024-02-10', 7.5, 'T16', 'NOW_SHOWING', NULL, NULL, NOW(), NOW()),
('Deadpool 3', 'Wade Wilson trở lại với những màn hành động hài hước và bạo lực. Lần này có sự góp mặt của Wolverine.', 'Shawn Levy', 'Ryan Reynolds, Hugh Jackman', 120, 'Tiếng Anh', 'Mỹ', '2024-07-26', NULL, 'T18', 'COMING_SOON', NULL, NULL, NOW(), NOW());

-- Link movies with genres (sample)
-- Avatar: Hành động, Phiêu lưu, Khoa học viễn tưởng
INSERT INTO movie_genres (movie_id, genre_id) VALUES (1, 1), (1, 5), (1, 6);

-- Spider-Man: Hành động, Phiêu lưu, Khoa học viễn tưởng
INSERT INTO movie_genres (movie_id, genre_id) VALUES (2, 1), (2, 5), (2, 6);

-- Oppenheimer: Lịch sử, Hình sự
INSERT INTO movie_genres (movie_id, genre_id) VALUES (3, 15), (3, 8);

-- Mai: Tình cảm, Hài
INSERT INTO movie_genres (movie_id, genre_id) VALUES (4, 2), (4, 4);

-- Deadpool 3: Hành động, Hài
INSERT INTO movie_genres (movie_id, genre_id) VALUES (5, 1), (5, 4);

-- Sample combos
INSERT INTO combos (name, description, price, image_url, available) VALUES
('Combo Bắp + Nước', 'TIẾT KIỆM 28K!!! Gồm: 1 Bắp (69oz) + 1 Nước có gas (22oz)', 79000, NULL, true),
('Combo 2 Bắp + 2 Nước', 'TIẾT KIỆM 56K!!! Sở hữu ngay: 2 Bắp (69oz) + 2 Nước có gas (22oz)', 149000, NULL, true),
('Combo Gia Đình', 'SIÊU TIẾT KIỆM!!! Gồm: 2 Bắp (L) + 2 Nước có gas + 1 Snack', 219000, NULL, true),
('Combo Đôi Lãng Mạn', 'Dành cho 2 người: 2 Bắp bơ (M) + 2 Nước ép trái cây', 179000, NULL, true);

