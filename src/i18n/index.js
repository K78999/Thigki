// ============================================================
// BIT240120_FoodManager - i18n Configuration
// Sinh viên: Trần Gia Khánh | MSSV: BIT240120
// ============================================================
// Mục đích: Cấu hình đa ngôn ngữ (English ↔ Tiếng Việt)
// Sử dụng thư viện i18next + react-i18next
// Ngôn ngữ mặc định: English
// Lưu ngôn ngữ đã chọn vào AsyncStorage để giữ khi chuyển màn hình
// ============================================================

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en.json';
import vi from './vi.json';

// Key lưu trữ ngôn ngữ trong AsyncStorage
const LANGUAGE_KEY = 'BIT240120_Language';

// Tạo language detector tùy chỉnh để đọc/ghi ngôn ngữ từ AsyncStorage
const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      callback(savedLanguage || 'en'); // Mặc định English
    } catch (error) {
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, language);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  },
};

// Khởi tạo i18n với cấu hình
i18n
  .use(languageDetector)      // Sử dụng language detector tùy chỉnh
  .use(initReactI18next)      // Kết nối với React
  .init({
    resources: {
      en: { translation: en },  // Bản dịch tiếng Anh
      vi: { translation: vi },  // Bản dịch tiếng Việt
    },
    fallbackLng: 'en',          // Ngôn ngữ dự phòng
    interpolation: {
      escapeValue: false,       // React Native đã tự escape
    },
    react: {
      useSuspense: false,       // Tắt Suspense để tránh lỗi với React Native
    },
  });

export default i18n;
