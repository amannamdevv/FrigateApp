/**
 * Re-export all types from the AIVMS API module.
 * All types are now defined alongside the API functions in frigateApi.ts
 */

export type {
  LoginResponse,
  UserProfile,
  Camera,
  CamerasResponse,
  CallAlert,
  ClipEntry,
DashboardStats,
} from '../api/frigateApi';
