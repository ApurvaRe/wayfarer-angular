import { Component, signal, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  readonly showPassword = signal(false);
  readonly message = signal('');
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
readonly isLoading = signal(false);
readonly errorMessage = signal('');
  readonly loginForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.email
      ]
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    })
  });

  async submit(): Promise<void> {
  if (this.isLoading()) {
    return;
  }

  this.message.set('');
  this.errorMessage.set('');

  if (this.loginForm.invalid) {
    this.loginForm.markAllAsTouched();
    return;
  }

  this.isLoading.set(true);

  try {
   const { email, password } = this.loginForm.getRawValue();

await this.auth.login(email, password);

this.loginForm.controls.password.reset();

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
async socialLogin(
  provider: 'google' | 'facebook'
): Promise<void> {
  if (this.isLoading()) {
    return;
  }

  this.isLoading.set(true);
  this.errorMessage.set('');
  this.message.set('');

  try {
  await this.auth.loginSocial(provider);

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