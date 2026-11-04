import { Component, signal, inject } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/auth.service';

function passwordsMatch(
  control: AbstractControl
): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  return password === confirmPassword
    ? null
    : { passwordMismatch: true };
}
@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {
  readonly showPassword = signal(false);
  readonly message = signal('');
private readonly auth = inject(AuthService);
private readonly router = inject(Router);
readonly isLoading = signal(false);
readonly errorMessage = signal('');
  readonly registerForm = new FormGroup(
    {
      name: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.pattern(/\S/)
        ]
      }),
      email: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.email
        ]
      }),
      password: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(8)
        ]
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required]
      })
    },
    { validators: passwordsMatch }
  );

  async submit(): Promise<void> {
  if (this.isLoading()) {
    return;
  }

  this.message.set('');
  this.errorMessage.set('');

  if (this.registerForm.invalid) {
    this.registerForm.markAllAsTouched();
    return;
  }

  this.isLoading.set(true);

  try {
   const { name, email, password } =
  this.registerForm.getRawValue();

await this.auth.register(name, email, password);

this.registerForm.reset();

await this.router.navigate(
  ['/dashboard'],
  { replaceUrl: true }
);
  } catch (error: unknown) {
    this.errorMessage.set(this.auth.errorMessage(error));
  } finally {
    this.isLoading.set(false);
  }
}
}