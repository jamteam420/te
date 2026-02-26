import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SheetsService, SheetResponse } from './services/sheets.service';
import { SOCIOS, VARIEDADES, PAGADORES } from './data/opciones.data';

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly fb = inject(FormBuilder);
  private readonly sheetsService = inject(SheetsService);

  readonly socios = SOCIOS;
  readonly variedades = VARIEDADES;
  readonly pagadores = PAGADORES;

  readonly isLoading = signal(false);
  readonly feedbackMessage = signal<string | null>(null);
  readonly feedbackType = signal<'success' | 'error' | null>(null);
  readonly showFeedback = signal(false);

  readonly form: FormGroup = this.fb.group({
    socio: ['', Validators.required],
    variedad: ['', Validators.required],
    pagador: ['', Validators.required],
    gramos: [null, [Validators.required, Validators.min(1)]],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.showFeedback.set(false);

    this.sheetsService.enviarRetiro(this.form.value).subscribe({
      next: (response: SheetResponse) => {
        this.isLoading.set(false);
        if (response.status === 'ok') {
          this.feedbackMessage.set('Retiro registrado correctamente');
          this.feedbackType.set('success');
          this.form.reset();
        } else {
          this.feedbackMessage.set(response.message || 'Ocurrió un error inesperado');
          this.feedbackType.set('error');
        }
        this.showFeedback.set(true);

        // Ocultar feedback después de 4 segundos
        setTimeout(() => this.showFeedback.set(false), 4000);
      },
      error: () => {
        this.isLoading.set(false);
        this.feedbackMessage.set('Error de conexión. Intentá de nuevo.');
        this.feedbackType.set('error');
        this.showFeedback.set(true);
        setTimeout(() => this.showFeedback.set(false), 4000);
      },
    });
  }

  isInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && control.touched);
  }
}
