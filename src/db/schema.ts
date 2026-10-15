export const DATABASE_VERSION = 2

export const DATABASE_SCHEMA_V1 = {
  healthRecords: '&id,&dateKey,updatedAt',
  mealPhotos: '&id,recordId,&[recordId+type],createdAt',
} as const

// 保存形式だけを変更し、index構成は維持する。
export const DATABASE_SCHEMA = DATABASE_SCHEMA_V1

