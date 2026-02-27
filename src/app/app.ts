import { Component, computed, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SheetsService, SheetResponse } from './services/sheets.service';
import { SOCIOS, VARIEDADES, PAGADORES, SOCIOS_PRECIO_ESPECIAL } from './data/opciones.data';
import { AutocompleteSelectComponent } from './components/autocomplete-select/autocomplete-select.component';

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule, AutocompleteSelectComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly sheetsService = inject(SheetsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly socios = SOCIOS;
  readonly variedades = VARIEDADES;
  readonly pagadores = PAGADORES;

  /** Precio por gramo para socios comunes */
  readonly PRECIO_COMUN_GR = 175;
  /** Precio por gramo para socios con precio especial */
  readonly PRECIO_ESPECIAL_GR = 87.5;

  readonly selectedSocio = signal<string>('');
  readonly selectedGramos = signal<number | null>(null);

  readonly precioCalculado = computed(() => {
    const gramos = this.selectedGramos();
    const socio = this.selectedSocio();
    if (!gramos || gramos <= 0 || !socio) return null;
    const precioPorGr = SOCIOS_PRECIO_ESPECIAL.includes(socio)
      ? this.PRECIO_ESPECIAL_GR
      : this.PRECIO_COMUN_GR;
    return Math.ceil(gramos * precioPorGr);
  });

  readonly isLoading = signal(false);
  readonly feedbackMessage = signal<string | null>(null);
  readonly feedbackType = signal<'success' | 'error' | null>(null);
  readonly showFeedback = signal(false);

  readonly form: FormGroup = this.fb.group({
    socio: ['', Validators.required],
    variedad: ['', Validators.required],
    pagador: ['', Validators.required],
    gramos: [null, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
  });

  ngOnInit(): void {
    this.form.get('socio')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value: string) => this.selectedSocio.set(value ?? ''));

    this.form.get('gramos')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value: number | null) => this.selectedGramos.set(value));
  }

  /** Block decimal keys (. and ,) on gramos input */
  onGramosKeydown(event: KeyboardEvent): void {
    if (event.key === '.' || event.key === ',') {
      event.preventDefault();
    }
  }

  /** Strip non-integer characters from pasted text */
  onGramosPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') ?? '';
    const intOnly = text.replace(/[^\d]/g, '');
    if (intOnly) {
      this.form.get('gramos')!.setValue(parseInt(intOnly, 10));
    }
  }

  /** Ensure gramos stays as integer on input */
  onGramosInput(): void {
    const ctrl = this.form.get('gramos')!;
    const val = ctrl.value;
    if (val !== null && val !== '' && !Number.isInteger(+val)) {
      ctrl.setValue(Math.floor(+val));
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.showFeedback.set(false);

    const payload = { ...this.form.value, precio: this.precioCalculado() ?? 0 };

    this.sheetsService.enviarRetiro(payload).subscribe({
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
