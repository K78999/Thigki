// ============================================================
// BIT240120_FoodManager - Dish Detail Screen
// Sinh viên: Trần Gia Khánh | MSSV: BIT240120
// ============================================================
// Mục đích: Hiển thị chi tiết một món ăn, bao gồm:
//   - Gallery ảnh (nhiều ảnh, đánh dấu thumbnail)
//   - Thông tin chi tiết: tên, giá, thời gian, mô tả, loại, trạng thái
//   - Badge Quick/Regular dựa trên PreparationTime
//   - Nút sửa và xóa (với xác nhận)
//   - Xử lý lỗi: ID không tồn tại
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useData } from '../context/DataContext';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';

const { width } = Dimensions.get('window');

const DishDetailScreen = ({ route, navigation }) => {
  const { dishId } = route.params;
  const { t } = useTranslation();
  const { dishes, categories, removeDish } = useData();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  // Tìm món ăn theo ID
  const dish = dishes.find(
    (d) => d.BIT240120_Id === dishId || d.id === dishId
  );

  // Tìm loại món
  const category = dish
    ? categories.find(
        (c) =>
          c.BIT240120_Id === dish.BIT240120_DishCategoryId ||
          c.id === dish.BIT240120_DishCategoryId
      )
    : null;

  // Xử lý trường hợp ID không tồn tại
  if (!dish) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
        <Text style={styles.errorText}>{t('common.idNotFound')}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>{t('common.ok')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = Array.isArray(dish.BIT240120_DishImage)
    ? dish.BIT240120_DishImage
    : [];
  const isQuick = (dish.BIT240120_PreparationTime || 0) <= 15;

  /**
   * Xử lý xóa món ăn
   * Hiển thị dialog xác nhận trước khi xóa
   */
  const handleDelete = () => {
    Alert.alert(
      t('dish.delete'),
      t('dish.confirmDelete'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await removeDish(dishId);
              Alert.alert(t('common.success'), t('dish.deleteSuccess'));
              navigation.goBack();
            } catch (error) {
              Alert.alert(t('common.error'), error.message);
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  /**
   * Render ảnh trong gallery
   * Mỗi ảnh chiếm full width, scroll ngang
   */
  const renderImageItem = ({ item, index }) => (
    <View style={styles.imageSlide}>
      <Image
        source={{ uri: item.BIT240120_ImageUrl }}
        style={styles.galleryImage}
        resizeMode="cover"
      />
      {item.BIT240120_IsThumbnail && (
        <View style={styles.thumbnailBadge}>
          <Ionicons name="star" size={12} color="#FFF" />
          <Text style={styles.thumbnailBadgeText}>{t('dish.thumbnail')}</Text>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Image Gallery */}
      <View style={styles.galleryContainer}>
        {images.length > 0 ? (
          <>
            <FlatList
              data={images}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderImageItem}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(
                  e.nativeEvent.contentOffset.x / width
                );
                setCurrentImageIndex(index);
              }}
            />
            {/* Dots indicator */}
            {images.length > 1 && (
              <View style={styles.dotsContainer}>
                {images.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      index === currentImageIndex && styles.dotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.noImageContainer}>
            <Ionicons name="image-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.noImageText}>{t('dish.noImage')}</Text>
          </View>
        )}

        {/* Back button */}
        <TouchableOpacity
          style={styles.galleryBackButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {/* Tên và badges */}
        <View style={styles.titleRow}>
          <Text style={styles.dishName}>{dish.BIT240120_Name}</Text>
          <View style={styles.badges}>
            {/* Badge Quick/Regular */}
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: isQuick
                    ? COLORS.successLight
                    : COLORS.surfaceVariant,
                },
              ]}
            >
              <Ionicons
                name="time-outline"
                size={14}
                color={isQuick ? COLORS.quickTag : COLORS.regularTag}
              />
              <Text
                style={[
                  styles.badgeText,
                  {
                    color: isQuick ? COLORS.quickTag : COLORS.regularTag,
                  },
                ]}
              >
                {isQuick ? t('dish.quick') : t('dish.regular')}
              </Text>
            </View>
            {/* Badge Available/Unavailable */}
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: dish.BIT240120_IsAvailable
                    ? COLORS.successLight
                    : COLORS.errorLight,
                },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: dish.BIT240120_IsAvailable
                      ? COLORS.availableTag
                      : COLORS.unavailableTag,
                  },
                ]}
              />
              <Text
                style={[
                  styles.badgeText,
                  {
                    color: dish.BIT240120_IsAvailable
                      ? COLORS.availableTag
                      : COLORS.unavailableTag,
                  },
                ]}
              >
                {dish.BIT240120_IsAvailable
                  ? t('dish.available')
                  : t('dish.unavailable')}
              </Text>
            </View>
          </View>
        </View>

        {/* Giá */}
        <Text style={styles.price}>
          ${(dish.BIT240120_Price || 0).toFixed(2)}
        </Text>

        {/* Thông tin chi tiết */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="time" size={20} color={COLORS.primary} />
              <View>
                <Text style={styles.infoLabel}>{t('dish.prepTime')}</Text>
                <Text style={styles.infoValue}>
                  {dish.BIT240120_PreparationTime} {t('dish.minutes')}
                </Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="pricetag" size={20} color={COLORS.secondary} />
              <View>
                <Text style={styles.infoLabel}>{t('dish.category')}</Text>
                <Text style={styles.infoValue}>
                  {category ? category.BIT240120_Name : t('common.noData')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Mô tả */}
        {dish.BIT240120_Description ? (
          <View style={styles.descriptionCard}>
            <Text style={styles.sectionTitle}>{t('dish.description')}</Text>
            <Text style={styles.description}>
              {dish.BIT240120_Description}
            </Text>
          </View>
        ) : null}

        {/* Danh sách ảnh (thumbnails) */}
        {images.length > 0 && (
          <View style={styles.thumbnailsSection}>
            <Text style={styles.sectionTitle}>
              {t('dish.images')} ({images.length})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {images.map((img, index) => (
                <View key={index} style={styles.thumbnailItem}>
                  <Image
                    source={{ uri: img.BIT240120_ImageUrl }}
                    style={styles.thumbnailImage}
                    resizeMode="cover"
                  />
                  {img.BIT240120_IsThumbnail && (
                    <View style={styles.thumbnailStar}>
                      <Ionicons name="star" size={10} color="#FFF" />
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() =>
              navigation.navigate('DishForm', {
                dishId: dish.BIT240120_Id || dish.id,
              })
            }
          >
            <Ionicons name="create-outline" size={20} color={COLORS.textOnPrimary} />
            <Text style={styles.editButtonText}>{t('common.edit')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator size="small" color={COLORS.error} />
            ) : (
              <>
                <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                <Text style={styles.deleteButtonText}>{t('common.delete')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // Error state
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.xxl,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.textSecondary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xxxl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  backButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  // Gallery
  galleryContainer: {
    position: 'relative',
    height: 300,
    backgroundColor: COLORS.surfaceVariant,
  },
  imageSlide: {
    width,
    height: 300,
    position: 'relative',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailBadge: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  thumbnailBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: '#FFF',
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  galleryBackButton: {
    position: 'absolute',
    top: 50,
    left: SPACING.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: SPACING.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: '#FFF',
    width: 20,
  },
  noImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textLight,
    marginTop: SPACING.sm,
  },
  // Content
  contentContainer: {
    padding: SPACING.xl,
    marginTop: -SPACING.xl,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.background,
  },
  titleRow: {
    marginBottom: SPACING.sm,
  },
  dishName: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  badges: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  price: {
    fontSize: TYPOGRAPHY.fontSize.title,
    fontWeight: TYPOGRAPHY.fontWeight.extraBold,
    color: COLORS.primary,
    marginVertical: SPACING.md,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
  },
  descriptionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
    ...SHADOWS.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  thumbnailsSection: {
    marginTop: SPACING.lg,
  },
  thumbnailItem: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailStar: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xxl,
    marginBottom: SPACING.xxxl,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.md,
  },
  editButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.error,
    ...SHADOWS.sm,
  },
  deleteButtonText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
});

export default DishDetailScreen;
