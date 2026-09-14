export type UserRole = "CUSTOMER" | "STAFF" | "ADMIN";

export type UserRecord = {
  id: string;
  email: string;
  password: string | null;
  fullName: string | null;
  role: UserRole;
  createdAt: string;
  refreshTokenHash: string | null;
  googleId?: string | null;
  avatarUrl?: string | null;
  emailVerifiedAt?: string | null;
  emailVerifyTokenHash?: string | null;
  emailVerifyExpiresAt?: string | null;
};

export type PublicUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  emailVerified: boolean;
};

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    emailVerified: Boolean(user.emailVerifiedAt) || Boolean(user.googleId),
  };
}
