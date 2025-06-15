import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface UserDTO {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  gender?: string;
  birthdate?: string;
  role: string;
  registrationDate?: string;
  doctor?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  smokingStatus?: string | null;
  bloodPressure?: string | null;
  medicalHistory?: string[] | null;
}

export interface CreateUserRequest {
  name: string;
  username: string;
  email: string;
  password: string;
  phone?: string;
  gender?: string;
  birthdate?: string;
  role: string;
}

export interface UpdateUserRequest {
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  gender?: string;
  birthdate?: string;
  role?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);

  // Configuration
  private readonly API_BASE = 'http://localhost:8080/api/users';

  // State management
  private usersSubject = new BehaviorSubject<UserDTO[]>([]);
  public users$ = this.usersSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  /**
   * Get authorization headers with JWT token
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Handle HTTP errors
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);

      // Extract meaningful error message
      let errorMessage = 'An unexpected error occurred';
      if (error?.error?.message) {
        errorMessage = error.error.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.status === 0) {
        errorMessage = 'Unable to connect to server';
      } else if (error?.status === 401) {
        errorMessage = 'Unauthorized. Please log in again.';
      } else if (error?.status === 403) {
        errorMessage = 'Access denied. Insufficient permissions.';
      } else if (error?.status === 404) {
        errorMessage = 'Resource not found';
      } else if (error?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }

      throw new Error(errorMessage);
    };
  }

  /**
   * Load all users from the API
   */
  loadUsers(): Observable<UserDTO[]> {
    this.loadingSubject.next(true);

    return this.http.get<any[]>(this.API_BASE, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(rawUsers => {
        const users: UserDTO[] = rawUsers.map(user => ({
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
          birthdate: user.birthdate,
          role: user.role,
          registrationDate: user.registrationDate,
          doctor: user.doctor
            ? { id: user.doctor.id, name: user.doctor.name, email: user.doctor.email, role: user.doctor.role }
            : null,
          smokingStatus: user.smokingStatus,
          bloodPressure: user.bloodPressure,
          medicalHistory: user.medicalHistory
        }));

        this.usersSubject.next(users);
        this.loadingSubject.next(false);
      }),
      catchError(this.handleError<UserDTO[]>('loadUsers', []))
    );
  }

  /**
   * Get a specific user by ID
   */
  getUserById(id: string): Observable<UserDTO> {
    return this.http.get<UserDTO>(`${this.API_BASE}/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError<UserDTO>('getUserById'))
    );
  }

  /**
   * Create a new user
   */
  createUser(userData: CreateUserRequest): Observable<UserDTO> {
    this.loadingSubject.next(true);

    return this.http.post<UserDTO>(this.API_BASE, userData, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(newUser => {
        const currentUsers = this.usersSubject.value;
        this.usersSubject.next([...currentUsers, newUser]);
        this.loadingSubject.next(false);
      }),
      catchError(this.handleError<UserDTO>('createUser'))
    );
  }


  updateUser(id: string, userData: UpdateUserRequest): Observable<UserDTO> {
    this.loadingSubject.next(true);

    return this.http.put<UserDTO>(`${this.API_BASE}/by-id/${id}`, userData,
      { headers: this.getAuthHeaders() })
      .pipe(
      tap(updatedUser => {
        const currentUsers = this.usersSubject.value;
        const index = currentUsers.findIndex(user => user.id === id);
        if (index !== -1) {
          currentUsers[index] = updatedUser;
          this.usersSubject.next([...currentUsers]);
        }
        this.loadingSubject.next(false);
      }),
      catchError(this.handleError<UserDTO>('updateUser'))
    );
  }

  /**
   * Delete a user
   */
  deleteUser(id: string): Observable<void> {
    this.loadingSubject.next(true);

    return this.http.delete<void>(`${this.API_BASE}/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => {
        const currentUsers = this.usersSubject.value;
        this.usersSubject.next(currentUsers.filter(user => user.id !== id));
        this.loadingSubject.next(false);
      }),
      catchError(this.handleError<void>('deleteUser'))
    );
  }

  /**
   * Search users by various criteria
   */
  searchUsers(searchTerm: string, role?: string): UserDTO[] {
    const users = this.usersSubject.value;
    let filtered = users;

    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(term) ||
        user.username.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        (user.phone && user.phone.toLowerCase().includes(term))
      );
    }

    // Apply role filter
    if (role && role.trim()) {
      filtered = filtered.filter(user => user.role === role);
    }

    return filtered;
  }

  /**
   * Get users by role
   */
  getUsersByRole(role: string): UserDTO[] {
    return this.usersSubject.value.filter(user => user.role === role);
  }

  /**
   * Get user statistics
   */
  getUserStats(): { total: number; admins: number; doctors: number; patients: number } {
    const users = this.usersSubject.value;
    return {
      total: users.length,
      admins: users.filter(u => u.role === 'ADMIN').length,
      doctors: users.filter(u => u.role === 'DOCTOR').length,
      patients: users.filter(u => u.role === 'PATIENT').length
    };
  }

  /**
   * Check if current user can delete a specific user
   */
  canDeleteUser(user: UserDTO): boolean {
    // Prevent deletion of admin users for safety
    // You can modify this logic based on your business rules
    return user.role !== 'ADMIN';
  }

  /**
   * Refresh users data
   */
  refreshUsers(): Observable<UserDTO[]> {
    return this.loadUsers();
  }

  /**
   * Clear users cache
   */
  clearUsersCache(): void {
    this.usersSubject.next([]);
  }
}
