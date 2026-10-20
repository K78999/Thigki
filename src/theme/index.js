// ============================================================
// BIT240120_FoodManager - Theme Configuration
// Sinh viên: Trần Gia Khánh | MSSV: BIT240120
// ============================================================
// Mục đích: Định nghĩa hệ thống design tokens cho toàn ứng dụng
// Bao gồm: colors, typography, spacing, shadows, border radius
// ============================================================

export const COLORS = {
  // Primary palette
  primary: '#FF6B35',        // Cam đậm - màu chính
  primaryLight: '#FF8F5E',   // Cam nhạt
  primaryDark: '#E55A2B',    // Cam tối

  // Secondary
  secondary: '#2EC4B6',      // Xanh ngọc
  secondaryLight: '#5ED4C8',
  secondaryDark: '#1FA99D',

  // Accent
  accent: '#FFD166',         // Vàng nhấn
  accentDark: '#F0C040',

  // Backgrounds
  background: '#F8F9FA',     // Nền chính (xám nhạt)
  surface: '#FFFFFF',        // Nền card/surface
  surfaceVariant: '#F0F2F5', // Nền card variant

  // Text
  textPrimary: '#1A1D29',    // Text chính
  textSecondary: '#6B7280',  // Text phụ
  textLight: '#9CA3AF',      // Text nhạt
  textOnPrimary: '#FFFFFF',  // Text trên nền primary

  // Status
  success: '#10B981',        // Xanh lá - thành công
  successLight: '#D1FAE5',
  warning: '#F59E0B',        // Vàng - cảnh báo
  warningLight: '#FEF3C7',
  error: '#EF4444',          // Đỏ - lỗi
  errorLight: '#FEE2E2',
  info: '#3B82F6',           // Xanh dương - thông tin
  infoLight: '#DBEAFE',

  // Border
  border: '#E5E7EB',         // Viền nhạt
  borderFocus: '#FF6B35',    // Viền khi focus

  // Tags
  quickTag: '#10B981',       // Tag "Quick/Nhanh"
  regularTag: '#6B7280',     // Tag "Regular/Thông thường"
  availableTag: '#10B981',   // Tag "Available"
  unavailableTag: '#EF4444', // Tag "Unavailable"

  // Overlay
  overlay: 'rgba(0,0,0,0.5)',

  // Online/Offline indicator
  online: '#10B981',
  offline: '#EF4444',
};

export const TYPOGRAPHY = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    xxxl: 28,
    title: 32,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BORDER_RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
};
