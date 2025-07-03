declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      password: string | null;
      name: string;
      picture: string | null;
      googleId: string | null;
      role: UserRole;
      createdAt: Date;
      updatedAt: Date;
    }
  }
}

export {};
