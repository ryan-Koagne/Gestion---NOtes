import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Interfaces
export interface Subject {
  id: number;
  name: string;
  code: string;
  coefficient: number;
  description?: string;
  teacher_count: number;
  teachers?: Teacher[];
}

export interface CreateSubjectRequest {
  name: string;
  code: string;
  coefficient: number;
  description?: string;
}

export interface UpdateSubjectRequest {
  name?: string;
  code?: string;
  coefficient?: number;
  description?: string;
}

interface Teacher {
  id: number;
  full_name: string;
}

@Injectable({
  providedIn: 'root'
})
export class SubjectService {
  private apiUrl = `${environment.apiUrl}/subjects`;
  private readonly TOKEN_KEY = 'school_auth_token';

  constructor(private http: HttpClient) {}

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Crée les en-têtes d'authentification avec le token JWT
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Récupère toutes les matières
   */
  getAllSubjects(): Observable<Subject[]> {
    return this.http.get<Subject[]>(this.apiUrl, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Récupère une matière par son ID
   */
  getSubject(subjectId: number): Observable<Subject> {
    return this.http.get<Subject>(`${this.apiUrl}/${subjectId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Crée une nouvelle matière
   */
  createSubject(subjectData: CreateSubjectRequest): Observable<Subject> {
    return this.http.post<Subject>(this.apiUrl, subjectData, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Met à jour une matière
   */
  updateSubject(subjectId: number, subjectData: UpdateSubjectRequest): Observable<Subject> {
    return this.http.put<Subject>(`${this.apiUrl}/${subjectId}`, subjectData, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Supprime une matière
   */
  deleteSubject(subjectId: number): Observable<{message: string}> {
    return this.http.delete<{message: string}>(`${this.apiUrl}/${subjectId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Recherche des matières par nom ou code
   */
  searchSubjects(searchTerm: string): Observable<Subject[]> {
    return this.getAllSubjects().pipe(
      map(subjects => subjects.filter(subject => 
        subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.code.toLowerCase().includes(searchTerm.toLowerCase())
      )),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les enseignants d'une matière
   */
  getSubjectTeachers(subjectId: number): Observable<Teacher[]> {
    return this.http.get<Teacher[]>(`${this.apiUrl}/${subjectId}/teachers`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Assigne des enseignants à une matière
   */
  assignTeachersToSubject(subjectId: number, teacherIds: number[]): Observable<Subject> {
    return this.http.post<Subject>(`${this.apiUrl}/${subjectId}/teachers`, 
      { teacher_ids: teacherIds }, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Valide les données d'une matière
   */
  validateSubjectData(subjectData: CreateSubjectRequest | UpdateSubjectRequest): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if ('name' in subjectData && (!subjectData.name || subjectData.name.trim().length === 0)) {
      errors.push('Le nom de la matière est obligatoire');
    }

    if ('code' in subjectData && (!subjectData.code || subjectData.code.trim().length === 0)) {
      errors.push('Le code de la matière est obligatoire');
    }

    if ('coefficient' in subjectData && (!subjectData.coefficient || subjectData.coefficient <= 0)) {
      errors.push('Le coefficient doit être supérieur à 0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Gestion centralisée des erreurs
   */
  private handleError = (error: any): Observable<never> => {
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error?.error) {
      errorMessage = error.error.error;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error('Erreur SubjectService:', error);
    return throwError(() => new Error(errorMessage));
  };
}