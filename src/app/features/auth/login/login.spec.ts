import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { Login } from './login';
import { AuthService } from '../../../core/auth.service';
import { provideZonelessChangeDetection } from '@angular/core';
describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let router: Router;

  let authMock: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authMock = jasmine.createSpyObj<AuthService>(
      'AuthService',
      ['login', 'loginSocial', 'errorMessage']
    );

    authMock.login.and.resolveTo();
    authMock.loginSocial.and.resolveTo();
    authMock.errorMessage.and.returnValue('Authentication failed');

    await TestBed.configureTestingModule({
  imports: [Login],
  providers: [
    provideZonelessChangeDetection(),
    provideRouter([]),
    { provide: AuthService, useValue: authMock }
  ]
}).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should mark invalid fields as touched without logging in', async () => {
    await component.submit();

    expect(component.loginForm.controls.email.touched).toBe(true);
    expect(component.loginForm.controls.password.touched).toBe(true);
    expect(authMock.login).not.toHaveBeenCalled();
  });

  it('should log in, clear the password, and open the dashboard', async () => {
    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'Password123'
    });

    await component.submit();

    expect(authMock.login).toHaveBeenCalledWith(
      'test@example.com',
      'Password123'
    );

    expect(component.loginForm.controls.password.value).toBe('');

    expect(router.navigate).toHaveBeenCalledWith(
      ['/dashboard'],
      { replaceUrl: true }
    );

    expect(component.isLoading()).toBe(false);
  });

  it('should display an error when login fails', async () => {
    const error = new Error('Invalid credentials');
    authMock.login.and.rejectWith(error);

    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'wrong-password'
    });

    await component.submit();

    expect(authMock.errorMessage).toHaveBeenCalledWith(error);
    expect(component.errorMessage()).toBe('Authentication failed');
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.isLoading()).toBe(false);
  });

  it('should ignore submission while loading', async () => {
    component.isLoading.set(true);

    await component.submit();

    expect(authMock.login).not.toHaveBeenCalled();
  });

  (['google', 'facebook'] as const).forEach((provider) => {
    it(`should log in using ${provider}`, async () => {
      await component.socialLogin(provider);

      expect(authMock.loginSocial).toHaveBeenCalledWith(provider);

      expect(router.navigate).toHaveBeenCalledWith(
        ['/dashboard'],
        { replaceUrl: true }
      );

      expect(component.isLoading()).toBe(false);
    });
  });

  it('should display an error when social login fails', async () => {
    const error = new Error('Social login failed');
    authMock.loginSocial.and.rejectWith(error);

    await component.socialLogin('google');

    expect(authMock.errorMessage).toHaveBeenCalledWith(error);
    expect(component.errorMessage()).toBe('Authentication failed');
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.isLoading()).toBe(false);
  });

  it('should ignore social login while loading', async () => {
    component.isLoading.set(true);

    await component.socialLogin('google');

    expect(authMock.loginSocial).not.toHaveBeenCalled();
  });
});