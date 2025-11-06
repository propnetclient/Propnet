// Stub auth hook - authentication removed
type User = {
  id: number;
  [key: string]: any;
} | null;

export function useAuth() {
  return {
    user: null as User,
    isLoading: false,
    login: () => {},
    logout: () => {},
    updateUser: () => {},
  };
}

// Empty auth provider since auth is removed
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
