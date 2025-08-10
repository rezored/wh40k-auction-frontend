import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuctionService, CreateAuctionRequest } from '../../services/auction.service';
import { CategoryService, CategoryGroup, Category } from '../../services/category.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

interface AuctionImage {
  id: string;
  url: string;
  file?: File;
  isUploading?: boolean;
  isMain?: boolean;
}

@Component({
  selector: 'app-create-auction',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './create-auction.component.html',
  styleUrls: ['./create-auction.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateAuctionComponent implements OnInit {
  auction: CreateAuctionRequest = {
    title: '',
    description: '',
    startingPrice: 0,
    endTime: null,
    category: '',
    categoryGroup: '',
    scale: '',
    era: '',
    tags: [],
    condition: 'new',
    saleType: 'auction',
    minOffer: undefined,
    offerExpiryDays: undefined,
    imageUrl: ''
  };

  // Category data
  categoryGroups: CategoryGroup[] = [];
  categories: Category[] = [];
  availableScales: { id: string; name: string; description: string }[] = [];
  availableConditions: { id: string; name: string; description: string }[] = [];
  availableEras: string[] = [];

  // Form state
  loading = false;
  submitted = false;
  showHelp = false;

  // Tag input
  newTag = '';

  // Image management
  images: AuctionImage[] = [];
  dragOver = false;

  constructor(
    private auctionService: AuctionService,
    private categoryService: CategoryService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadCategoryData();
    this.setupKeyboardShortcuts();
    this.cdr.detectChanges();
  }

  private setupKeyboardShortcuts() {
    // Add keyboard shortcuts for better UX
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to submit form
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (!this.loading) {
          this.onSubmit();
        }
      }

      // Ctrl/Cmd + S to save draft (future feature)
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        // TODO: Implement save draft functionality
      }
    });
  }

  loadCategoryData() {
    this.categoryGroups = this.categoryService.getCategoryGroups();
    this.categories = this.categoryService.getCategories();
    this.availableScales = this.categoryService.getScales();
    this.availableConditions = this.categoryService.getConditions();
    this.availableEras = this.categoryService.getFilterOptions().eras;
    this.cdr.detectChanges();
  }

  onCategoryGroupChange() {
    // Reset category selection when group changes
    this.auction.category = '';
    this.auction.scale = '';
    this.auction.era = '';
    this.auction.tags = [];
    this.cdr.detectChanges();
  }

  getCategoriesForGroup(groupId: string): Category[] {
    return this.categoryService.getCategoriesByGroup(groupId);
  }

  addTag() {
    const trimmedTag = this.newTag.trim();
    if (trimmedTag && !this.auction.tags?.includes(trimmedTag)) {
      if (!this.auction.tags) {
        this.auction.tags = [];
      }

      // Limit tag length and remove special characters
      const cleanTag = trimmedTag.replace(/[^\w\s-]/g, '').substring(0, 20);
      if (cleanTag.length >= 3) {
        this.auction.tags.push(cleanTag);
        this.newTag = '';
        this.cdr.detectChanges();
      } else {
        this.toastService.show('Tags must be at least 3 characters long', 'error');
      }
    } else if (this.auction.tags?.includes(trimmedTag)) {
      this.toastService.show('This tag already exists', 'warning');
    }
  }

  removeTag(tag: string) {
    if (this.auction.tags) {
      this.auction.tags = this.auction.tags.filter(t => t !== tag);
      this.cdr.detectChanges();
    }
  }

  // Image handling methods
  onFileSelected(event: any) {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach((file: any) => {
        this.addImage(file as File);
      });
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.dragOver = true;
    this.cdr.detectChanges();
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.dragOver = false;
    this.cdr.detectChanges();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragOver = false;

    const files = event.dataTransfer?.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        this.addImage(file);
      });
    }
    this.cdr.detectChanges();
  }

  addImage(file: File) {
    if (file.type.startsWith('image/')) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.toastService.show('Image file size must be less than 5MB', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        const image: AuctionImage = {
          id: this.generateId(),
          url: e.target.result,
          file: file,
          isMain: this.images.length === 0
        };
        this.images.push(image);
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    } else {
      this.toastService.show('Please select only image files', 'error');
    }
  }

  removeImage(imageId: string) {
    const imageIndex = this.images.findIndex(img => img.id === imageId);
    if (imageIndex !== -1) {
      const wasMain = this.images[imageIndex].isMain;
      this.images.splice(imageIndex, 1);

      // If we removed the main image and there are other images, make the first one main
      if (wasMain && this.images.length > 0) {
        this.images[0].isMain = true;
      }
      this.cdr.detectChanges();
    }
  }

  setMainImage(imageId: string) {
    this.images.forEach(img => {
      img.isMain = img.id === imageId;
    });
    this.cdr.detectChanges();
  }

  getMainImageUrl(): string {
    const mainImage = this.images.find(img => img.isMain);
    if (mainImage) {
      return mainImage.url;
    }
    if (this.images.length > 0) {
      return this.images[0].url;
    }
    return '';
  }

  generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  onSubmit() {
    this.submitted = true;

    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    // Set the main image URL if available
    const mainImage = this.images.find(img => img.isMain);
    if (mainImage) {
      this.auction.imageUrl = mainImage.url;
    }

    // Create auction
    this.auctionService.createAuction(this.auction).subscribe({
      next: (auction) => {
        this.toastService.show('Auction created successfully!', 'success');
        this.router.navigate(['/auctions', auction.id]);
      },
      error: (error) => {
        console.error('Error creating auction:', error);
        this.toastService.show('Failed to create auction. Please try again.', 'error');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private validateForm(): boolean {
    // Title validation
    if (!this.auction.title.trim()) {
      this.toastService.show('Please enter a title', 'error');
      return false;
    }

    if (this.auction.title.trim().length < 10) {
      this.toastService.show('Title must be at least 10 characters long', 'error');
      return false;
    }

    // Description validation
    if (!this.auction.description.trim()) {
      this.toastService.show('Please enter a description', 'error');
      return false;
    }

    if (this.auction.description.trim().length < 50) {
      this.toastService.show('Description must be at least 50 characters long', 'error');
      return false;
    }

    // Price validation
    if (this.auction.startingPrice <= 0) {
      this.toastService.show('Please enter a valid starting price', 'error');
      return false;
    }

    if (this.auction.startingPrice > 10000) {
      this.toastService.show('Starting price cannot exceed €10,000', 'error');
      return false;
    }

    // Category validation
    if (!this.auction.category) {
      this.toastService.show('Please select a category', 'error');
      return false;
    }

    // Auction-specific validation
    if (this.auction.saleType === 'auction') {
      if (!this.auction.endTime) {
        this.toastService.show('Please set an end date for auctions', 'error');
        return false;
      }

      const endDate = new Date(this.auction.endTime);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

      if (endDate < today) {
        this.toastService.show('End date cannot be in the past', 'error');
        return false;
      }

      // Check if end date is too far in the future (max 90 days)
      const maxEndDate = new Date();
      maxEndDate.setDate(maxEndDate.getDate() + 90);
      if (endDate > maxEndDate) {
        this.toastService.show('End date cannot be more than 90 days in the future', 'error');
        return false;
      }
    }

    // Direct sale validation
    if (this.auction.saleType === 'direct') {
      if (!this.auction.minOffer || this.auction.minOffer <= 0) {
        this.toastService.show('Please set a minimum offer amount for direct sales', 'error');
        return false;
      }

      if (this.auction.minOffer < this.auction.startingPrice) {
        this.toastService.show('Minimum offer cannot be less than starting price', 'error');
        return false;
      }
    }

    // Image validation
    if (this.images.length === 0 && !this.auction.imageUrl) {
      this.toastService.show('Please upload at least one image or provide an image URL', 'error');
      return false;
    }

    return true;
  }

  onSaleTypeChange() {
    if (this.auction.saleType === 'direct') {
      this.auction.endTime = null;
    } else {
      this.auction.minOffer = undefined;
      this.auction.offerExpiryDays = undefined;
    }
    this.cdr.detectChanges();
  }

  getCategoryDisplayName(categoryId: string): string {
    const category = this.categoryService.getCategoryById(categoryId);
    return category ? category.name : categoryId;
  }

  getCategoryGroupDisplayName(groupId: string): string {
    const group = this.categoryService.getCategoryGroupById(groupId);
    return group ? group.name : groupId;
  }

  getMinDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
  }

  formatEndDate(endTime: Date | string): string {
    if (!endTime) return '';

    const date = new Date(endTime);
    if (isNaN(date.getTime())) return '';

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  resetForm() {
    this.auction = {
      title: '',
      description: '',
      startingPrice: 0,
      endTime: null,
      category: '',
      categoryGroup: '',
      scale: '',
      era: '',
      tags: [],
      condition: 'new',
      saleType: 'auction',
      minOffer: undefined,
      offerExpiryDays: undefined,
      imageUrl: ''
    };
    this.images = [];
    this.newTag = '';
    this.submitted = false;
    this.loading = false;
    this.cdr.detectChanges();
    this.toastService.show('Form has been reset', 'info');
  }

  getFormProgress(): number {
    let completedFields = 0;
    const totalFields = 8; // Basic fields to check

    if (this.auction.title.trim()) completedFields++;
    if (this.auction.description.trim()) completedFields++;
    if (this.auction.startingPrice > 0) completedFields++;
    if (this.auction.category) completedFields++;
    if (this.auction.categoryGroup) completedFields++;
    if (this.auction.condition) completedFields++;
    if (this.auction.saleType) completedFields++;
    if (this.images.length > 0 || this.auction.imageUrl) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
  }

  toggleHelp() {
    this.showHelp = !this.showHelp;
    this.cdr.detectChanges();
  }
} 