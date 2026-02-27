import {
  Component,
  Input,
  forwardRef,
  signal,
  computed,
  HostListener,
  ElementRef,
  inject,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-autocomplete-select',
  standalone: true,
  imports: [],
  templateUrl: './autocomplete-select.component.html',
  styleUrl: './autocomplete-select.component.scss',
  host: { style: 'display: block; width: 100%;' },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AutocompleteSelectComponent),
      multi: true,
    },
  ],
})
export class AutocompleteSelectComponent implements ControlValueAccessor {
  @Input() options: string[] = [];
  @Input() placeholder = 'Seleccioná una opción';
  @Input() inputId = '';

  @ViewChild('inputEl') inputEl!: ElementRef<HTMLInputElement>;

  private readonly elementRef = inject(ElementRef);

  readonly inputValue = signal('');
  readonly isOpen = signal(false);
  readonly activeIndex = signal(-1);

  private selectedValue = '';
  private _disabled = false;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  get isDisabled(): boolean {
    return this._disabled;
  }

  readonly filteredOptions = computed(() => {
    const query = this.inputValue().toLowerCase().trim();
    if (!query) return this.options;
    return this.options.filter((opt) => opt.toLowerCase().includes(query));
  });

  /** Close when clicking outside the component */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeAndRestore();
    }
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.isOpen()) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.openDropdown();
        this.activeIndex.set(0);
      }
      return;
    }

    const options = this.filteredOptions();
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex.update((i) => Math.min(i + 1, options.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex.update((i) => Math.max(i - 1, -1));
        break;
      case 'Enter':
        event.preventDefault();
        if (this.activeIndex() >= 0 && options[this.activeIndex()]) {
          this.selectOption(options[this.activeIndex()]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.closeAndRestore();
        break;
    }
  }

  onInputFocus(): void {
    this.openDropdown();
  }

  onInputBlur(): void {
    // Delay to allow mousedown on option to fire first
    setTimeout(() => {
      if (!this.elementRef.nativeElement.contains(document.activeElement)) {
        this.closeAndRestore();
        this.onTouched();
      }
    }, 150);
  }

  onInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.inputValue.set(value);
    this.isOpen.set(true);
    this.activeIndex.set(-1);
    // Clear the form value while typing until a valid option is selected
    if (!this.options.includes(value)) {
      this.onChange('');
    }
  }

  selectOption(option: string): void {
    this.selectedValue = option;
    this.inputValue.set(option);
    this.onChange(option);
    this.isOpen.set(false);
    this.activeIndex.set(-1);
    this.inputEl?.nativeElement.focus();
  }

  toggleDropdown(): void {
    if (this._disabled) return;
    if (this.isOpen()) {
      this.closeAndRestore();
    } else {
      this.openDropdown();
      setTimeout(() => this.inputEl?.nativeElement.focus());
    }
  }

  private openDropdown(): void {
    this.isOpen.set(true);
    this.activeIndex.set(-1);
  }

  private closeAndRestore(): void {
    this.isOpen.set(false);
    this.activeIndex.set(-1);
    // If what the user typed is not a valid option, restore the last selected value
    if (!this.options.includes(this.inputValue())) {
      this.inputValue.set(this.selectedValue);
    }
  }

  // --- ControlValueAccessor ---

  writeValue(value: string): void {
    this.selectedValue = value ?? '';
    this.inputValue.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._disabled = isDisabled;
  }
}
