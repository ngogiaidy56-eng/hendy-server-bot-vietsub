-- seed_vip_levels.sql
-- Default VIP Levels & Initial Shop Code Items

INSERT OR REPLACE INTO vip_levels (tier_code, display_name, discount_percent, max_video_resolution, r2_retention_days, annual_price_vnd)
VALUES
  ('STANDARD', 'Thành Viên Tiêu Chuẩn', 0.0, '1080p', 14, 0),
  ('VIP_SILVER', 'Thành Viên Bạc (Subteam Starter)', 4.0, '1080p60', 30, 250000),
  ('VIP_GOLD', 'Thành Viên Vàng (Subteam Pro)', 8.0, '2K', 90, 500000),
  ('VIP_DIAMOND', 'Thành Viên Kim Cương (Studio Enterprise)', 15.0, '4K_NVENC', 365, 1200000);

INSERT OR REPLACE INTO users (id, telegram_id, username, full_name, role, vip_tier, balance_vnd, total_spent_vnd, status)
VALUES
  ('usr_901', '684920112', 'minh_kaito', 'Trần Minh Quân', 'SUPER_ADMIN', 'VIP_DIAMOND', 18500000, 42000000, 'Active'),
  ('usr_902', '719283401', 'linh_subteam', 'Nguyễn Phương Linh', 'EDITOR_PRO', 'VIP_GOLD', 4250000, 12800000, 'Active');
