// ============================================================
// BIT240120_FoodManager - API Configuration
// Sinh viên: Trần Gia Khánh | MSSV: BIT240120
// ============================================================
// Mục đích: Cấu hình kết nối MockAPI
// MockAPI cung cấp REST API miễn phí cho việc prototype
// Tất cả tên bảng (endpoint) đều có tiền tố BIT240120_
// ============================================================

// Base URL của MockAPI project
// HƯỚNG DẪN: Thay thế URL này bằng URL MockAPI của bạn
// 1. Truy cập https://mockapi.io
// 2. Tạo project mới
// 3. Tạo 2 resources: BIT240120_DishCategory và BIT240120_Dish
// 4. Copy project URL và paste vào đây
export const MOCKAPI_BASE_URL = 'https://6716c3c33fcb11b265d2473c.mockapi.io/api/v1';

// Endpoints cho từng bảng dữ liệu - có tiền tố MSSV
export const ENDPOINTS = {
  // Endpoint quản lý loại món ăn
  CATEGORIES: '/BIT240120_DishCategory',
  // Endpoint quản lý món ăn
  DISHES: '/BIT240120_Dish',
};

// Timeout cho API requests (ms)
export const API_TIMEOUT = 10000;
