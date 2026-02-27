import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, timeout } from 'rxjs';
import { Retiro } from '../models/retiro.model';
import { environment } from '../../environments/environment';

export interface SheetResponse {
  status: 'ok' | 'error';
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SheetsService {
  private readonly http = inject(HttpClient);
  private readonly scriptUrl = environment.googleScriptUrl;

  enviarRetiro(retiro: Retiro): Observable<SheetResponse> {
    const payload = {
      socio: retiro.socio,
      variedad: retiro.variedad,
      pagador: retiro.pagador,
      gramos: retiro.gramos,
      precio: retiro.precio ?? 0,
    };

    // Google Apps Script web app devuelve un redirect (302), por eso usamos
    // fetch nativo con redirect: 'follow' en lugar de HttpClient directamente.
    // HttpClient no maneja bien el redirect cross-origin de Apps Script.
    return new Observable<SheetResponse>((observer) => {
      fetch(this.scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain', // Apps Script requiere text/plain para evitar CORS preflight
        },
        body: JSON.stringify(payload),
        redirect: 'follow',
      })
        .then((response) => response.json())
        .then((data: SheetResponse) => {
          observer.next(data);
          observer.complete();
        })
        .catch((error) => {
          observer.error(error);
        });
    }).pipe(
      timeout(15000),
      catchError((err) => {
        console.error('Error al enviar retiro:', err);
        return of({ status: 'error' as const, message: 'No se pudo conectar con la planilla. Intentá de nuevo.' });
      })
    );
  }
}
