export type UserRole = "CUSTOMER" | "STAFF" | "ADMIN";

export type UserRecord = {
  id: string;
  email: string;
  password: string;
  fullName: string | null;
  role: UserRole;
  createdAt: string;
  refreshTokenHash: string | null;
};

export type PublicUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
};

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  };
}
