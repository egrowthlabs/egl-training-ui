export interface User {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  roles: string[];
  permissions: string[];
  isActive?: boolean;
}

export interface CreateUserDto {
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roles: string[];
}

export interface UpdateUserDto {
  id: string;
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
