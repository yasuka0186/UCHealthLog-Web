export const DATABASE_VERSION = 1

export const DATABASE_SCHEMA = {
  healthRecords: '&id,&dateKey,updatedAt',
  mealPhotos: '&id,recordId,&[recordId+type],createdAt',
} as const

