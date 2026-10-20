// ============================================================
// BIT240120_FoodManager - Settings Screen
// Sinh viên: Trần Gia Khánh | MSSV: BIT240120
// ============================================================
// Mục đích: Màn hình cài đặt ứng dụng
// Chức năng:
//   - Chuyển đổi ngôn ngữ English ↔ Tiếng Việt
//   - Giữ ngôn ngữ đã chọn (lưu AsyncStorage)
//   - Đồng bộ dữ liệu thủ công (nút Sync Now)
//   - Hiển thị thời gian đồng bộ cuối
//   - Hiển thị trạng thái mạng
//   - Thông tin sinh viên và MSSV
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useData } from '../context/DataContext';
import { showAlert } from '../utils/alertService';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';

const SettingsScreen = () => {
  const { t, i18n } = useTranslation();
  const { isOnline, isSyncing, lastSyncTime, performSync } = useData();
  const [syncing, setSyncing] = useState(false);

  /**
   * Chuyển đổi ngôn ngữ
   * Giải thích: i18n.changeLanguage() thay đổi ngôn ngữ toàn cục
   * Language detector tùy chỉnh sẽ tự động lưu vào AsyncStorage
   * => Giữ ngôn ngữ khi chuyển màn hình và khởi động lại app
   */
  const handleChangeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  /**
   * Đồng bộ dữ liệu thủ công
   */
  const handleSync = async () => {
    if (!isOnline) {
      showAlert(t('common.warning'), t('common.offline'));
      return;
    }

    setSyncing(true);
    try {
      const result = await performSync();
      if (!result.success) {
        throw new Error(result.message || t('common.syncFailed'));
      }
      showAlert(t('common.success'), t('common.syncSuccess'));
    } catch (error) {
      showAlert(t('common.error'), error.message);
    } finally {
      setSyncing(false);
    }
  };

  /**
   * Format timestamp thành readable date
   */
  const formatSyncTime = (timestamp) => {
    if (!timestamp) return t('settings.never');
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const currentLang = i18n.language;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <Text style={styles.headerSubtitle}>BIT240120 - Trần Gia Khánh</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Language Section */}
        <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={[
              styles.languageOption,
              currentLang === 'en' && styles.languageOptionActive,
            ]}
            onPress={() => handleChangeLanguage('en')}
          >
            <View style={styles.languageInfo}>
              <Text style={styles.flagEmoji}>🇺🇸</Text>
              <View>
                <Text
                  style={[
                    styles.languageName,
                    currentLang === 'en' && styles.languageNameActive,
                  ]}
                >
                  {t('settings.english')}
                </Text>
                <Text style={styles.languageCode}>English</Text>
              </View>
            </View>
            {currentLang === 'en' && (
              <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
            )}
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={[
              styles.languageOption,
              currentLang === 'vi' && styles.languageOptionActive,
            ]}
            onPress={() => handleChangeLanguage('vi')}
          >
            <View style={styles.languageInfo}>
              <Text style={styles.flagEmoji}>🇻🇳</Text>
              <View>
                <Text
                  style={[
                    styles.languageName,
                    currentLang === 'vi' && styles.languageNameActive,
                  ]}
                >
                  {t('settings.vietnamese')}
                </Text>
                <Text style={styles.languageCode}>Tiếng Việt</Text>
              </View>
            </View>
            {currentLang === 'vi' && (
              <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Sync Section */}
        <Text style={styles.sectionTitle}>{t('settings.sync')}</Text>
        <View style={styles.card}>
          {/* Network Status */}
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Ionicons
                name={isOnline ? 'wifi' : 'wifi-outline'}
                size={22}
                color={isOnline ? COLORS.success : COLORS.error}
              />
              <Text style={styles.infoLabel}>{t('dish.status')}</Text>
            </View>
            <View
              style={[
                styles.statusTag,
                {
                  backgroundColor: isOnline
                    ? COLORS.successLight
                    : COLORS.errorLight,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusTagText,
                  { color: isOnline ? COLORS.success : COLORS.error },
                ]}
              >
                {isOnline ? t('common.online') : t('common.offline')}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Last Sync */}
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="time-outline" size={22} color={COLORS.textSecondary} />
              <Text style={styles.infoLabel}>{t('settings.lastSync')}</Text>
            </View>
            <Text style={styles.infoValue}>
              {formatSyncTime(lastSyncTime)}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Sync Button */}
          <TouchableOpacity
            style={[
              styles.syncButton,
              (!isOnline || syncing || isSyncing) && styles.syncButtonDisabled,
            ]}
            onPress={handleSync}
            disabled={!isOnline || syncing || isSyncing}
          >
            {syncing || isSyncing ? (
              <ActivityIndicator color={COLORS.textOnPrimary} size="small" />
            ) : (
              <Ionicons name="sync" size={20} color={COLORS.textOnPrimary} />
            )}
            <Text style={styles.syncButtonText}>
              {syncing || isSyncing
                ? t('common.syncing')
                : t('settings.syncNow')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
        <View style={styles.card}>
          <View style={styles.aboutRow}>
            <Ionicons name="person-outline" size={22} color={COLORS.primary} />
            <Text style={styles.aboutText}>{t('settings.student')}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.aboutRow}>
            <Ionicons name="id-card-outline" size={22} color={COLORS.secondary} />
            <Text style={styles.aboutText}>{t('settings.mssv')}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.aboutRow}>
            <Ionicons name="school-outline" size={22} color={COLORS.accent} />
            <Text style={styles.aboutText}>{t('settings.course')}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>BIT240120_FoodManager v1.0.0</Text>
          <Text style={styles.footerText}>React Native + Expo</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: 50,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.surface,
    ...SHADOWS.sm,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  content: {
    padding: SPACING.xl,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  // Language
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  languageOptionActive: {
    backgroundColor: COLORS.primaryLight + '10',
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  flagEmoji: {
    fontSize: 28,
  },
  languageName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
  },
  languageNameActive: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  languageCode: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  // Sync info
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  statusTag: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  statusTagText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  syncButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.secondary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
  },
  syncButtonDisabled: {
    opacity: 0.5,
  },
  syncButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  // About
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  aboutText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
  },
  // Footer
  footer: {
    alignItems: 'center',
    marginTop: SPACING.xxxl,
    paddingBottom: SPACING.xxl,
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
    marginBottom: 2,
  },
});

export default SettingsScreen;
