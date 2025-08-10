import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService, UserProfile, UserAddress, UpdateProfileRequest, ChangePasswordRequest, AddAddressRequest, UpdateAddressRequest } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  userProfile: UserProfile | null = null;
  addresses: UserAddress[] = [];
  loading = false;
  error = '';

  // Form groups
  profileForm: FormGroup;
  passwordForm: FormGroup;
  addressForm: FormGroup;

  // UI state
  activeTab = 'profile';
  editingAddress: UserAddress | null = null;
  showAddressForm = false;

  constructor(
    public authService: AuthService,
    private formBuilder: FormBuilder,
    private toastService: ToastService
  ) {
    this.profileForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      firstName: [''],
      lastName: [''],
      phone: [''],
      emailNotifications: [true],
      smsNotifications: [false],
      currency: ['EUR']
    });

    this.passwordForm = this.formBuilder.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    this.addressForm = this.formBuilder.group({
      street: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      postalCode: ['', [Validators.required]],
      country: ['', [Validators.required]],
      isDefault: [false]
    });
  }

  ngOnInit() {
    this.loadProfile();
    this.loadAddresses();
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  loadProfile() {
    this.loading = true;
    this.error = '';

    this.authService.getProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.populateProfileForm(profile);
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load profile';
        this.loading = false;
        this.toastService.error('Failed to load profile');
      }
    });
  }

  loadAddresses() {
    this.authService.getAddresses().subscribe({
      next: (addresses) => {
        this.addresses = addresses;
      },
      error: (error) => {
        this.toastService.error('Failed to load addresses');
      }
    });
  }

  populateProfileForm(profile: UserProfile) {
    this.profileForm.patchValue({
      username: profile.username,
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      phone: profile.phone || '',
      emailNotifications: profile.preferences?.emailNotifications ?? true,
      smsNotifications: profile.preferences?.smsNotifications ?? false,
      currency: profile.preferences?.currency || 'EUR'
    });
  }

  updateProfile() {
    if (this.profileForm.valid) {
      this.loading = true;
      const formValue = this.profileForm.value;

      const updateData: UpdateProfileRequest = {
        username: formValue.username,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        phone: formValue.phone,
        preferences: {
          emailNotifications: formValue.emailNotifications,
          smsNotifications: formValue.smsNotifications,
          currency: formValue.currency
        }
      };

      this.authService.updateProfile(updateData).subscribe({
        next: (updatedProfile) => {
          this.userProfile = updatedProfile;
          this.loading = false;
          this.toastService.success('Profile updated successfully');
        },
        error: (error) => {
          this.loading = false;
          this.toastService.error('Failed to update profile');
        }
      });
    }
  }

  changePassword() {
    if (this.passwordForm.valid) {
      this.loading = true;
      const passwordData: ChangePasswordRequest = this.passwordForm.value;

      this.authService.changePassword(passwordData).subscribe({
        next: () => {
          this.loading = false;
          this.passwordForm.reset();
          this.toastService.success('Password changed successfully');
        },
        error: (error) => {
          this.loading = false;
          this.toastService.error('Failed to change password');
        }
      });
    }
  }

  addAddress() {
    if (this.addressForm.valid) {
      this.loading = true;
      const addressData: AddAddressRequest = this.addressForm.value;

      this.authService.addAddress(addressData).subscribe({
        next: (newAddress) => {
          this.addresses.push(newAddress);
          this.loading = false;
          this.showAddressForm = false;
          this.addressForm.reset();
          this.toastService.success('Address added successfully');
        },
        error: (error) => {
          this.loading = false;
          this.toastService.error('Failed to add address');
        }
      });
    }
  }

  editAddress(address: UserAddress) {
    this.editingAddress = address;
    this.addressForm.patchValue({
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault
    });
    this.showAddressForm = true;
  }

  updateAddress() {
    if (this.addressForm.valid && this.editingAddress) {
      this.loading = true;
      const addressData: UpdateAddressRequest = {
        id: this.editingAddress.id!,
        ...this.addressForm.value
      };

      this.authService.updateAddress(addressData).subscribe({
        next: (updatedAddress) => {
          const index = this.addresses.findIndex(addr => addr.id === updatedAddress.id);
          if (index !== -1) {
            this.addresses[index] = updatedAddress;
          }
          this.loading = false;
          this.showAddressForm = false;
          this.editingAddress = null;
          this.addressForm.reset();
          this.toastService.success('Address updated successfully');
        },
        error: (error) => {
          this.loading = false;
          this.toastService.error('Failed to update address');
        }
      });
    }
  }

  deleteAddress(addressId: string) {
    if (confirm('Are you sure you want to delete this address?')) {
      this.authService.deleteAddress(addressId).subscribe({
        next: () => {
          this.addresses = this.addresses.filter(addr => addr.id !== addressId);
          this.toastService.success('Address deleted successfully');
        },
        error: (error) => {
          this.toastService.error('Failed to delete address');
        }
      });
    }
  }

  setDefaultAddress(addressId: string) {
    this.authService.setDefaultAddress(addressId).subscribe({
      next: () => {
        // Update local addresses to reflect the change
        this.addresses.forEach(addr => {
          addr.isDefault = addr.id === addressId;
        });
        this.toastService.success('Default address updated');
      },
      error: (error) => {
        this.toastService.error('Failed to set default address');
      }
    });
  }

  cancelAddressEdit() {
    this.showAddressForm = false;
    this.editingAddress = null;
    this.addressForm.reset();
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  private passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  getDefaultAddress(): UserAddress | undefined {
    return this.addresses.find(addr => addr.isDefault);
  }
} 