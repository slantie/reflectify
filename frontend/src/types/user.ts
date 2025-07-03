export interface User {
    id: string;
    name: string;
    email: string;
    designation: string;
    isSuper: boolean;
  }
  
  export interface UserState {
    currentUser: User | null;
    loading: boolean;
    error: string | null;
  }
  