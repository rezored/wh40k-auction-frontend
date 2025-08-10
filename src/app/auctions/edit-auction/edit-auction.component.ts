import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuctionService, Auction, UpdateAuctionRequest } from '../../services/auction.service';
import { CategoryService } from '../../services/category.service';
import { ToastService } from '../../services/toast.service';

interface AuctionImage {
    id: string;
    url: string;
    file?: File;
    isUploading: boolean;
    isMain: boolean;
}

@Component({
    selector: 'app-edit-auction',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './edit-auction.component.html',
    styleUrls: ['./edit-auction.component.scss']
})
export class EditAuctionComponent implements OnInit, OnDestroy {
    auction: UpdateAuctionRequest = {};
    originalAuction: Auction | null = null;
    images: AuctionImage[] = [];
    categories: any[] = [];
    categoryGroups: any[] = [];
    scales: any[] = [];
    eras: string[] = [];
    conditions: any[] = [];
    loading = false;
    dragOver = false;
    newTag = '';
    private destroy$ = new Subject<void>();

    constructor(
        private auctionService: AuctionService,
        private categoryService: CategoryService,
        private toastService: ToastService,
        private router: Router,
        private route: ActivatedRoute,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.loadCategories();
        this.loadAuction();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private loadAuction(): void {
        const auctionId = this.route.snapshot.paramMap.get('id');
        if (!auctionId) {
            this.toastService.show('Auction ID not found', 'error');
            this.router.navigate(['/auctions']);
            return;
        }

        this.loading = true;
        this.auctionService.getAuctionById(auctionId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (auction) => {
                    this.originalAuction = auction;
                    this.auction = {
                        title: auction.title,
                        description: auction.description,
                        startingPrice: auction.startingPrice,
                        endTime: auction.endTime,
                        category: auction.category,
                        categoryGroup: auction.categoryGroup,
                        scale: auction.scale,
                        era: auction.era,
                        tags: auction.tags,
                        condition: auction.condition,
                        saleType: auction.saleType,
                        minOffer: auction.minOffer,
                        offerExpiryDays: auction.offerExpiryDays,
                        imageUrl: auction.imageUrl
                    };

                    // Initialize images array
                    if (auction.imageUrl) {
                        this.images = [{
                            id: this.generateId(),
                            url: auction.imageUrl,
                            isUploading: false,
                            isMain: true
                        }];
                    }

                    this.loading = false;
                    this.cdr.detectChanges();
                },
                error: (error) => {
                    console.error('Error loading auction:', error);
                    this.toastService.show('Failed to load auction', 'error');
                    this.loading = false;
                    this.router.navigate(['/auctions']);
                }
            });
    }

    private loadCategories(): void {
        this.categories = this.categoryService.getCategories();
        this.categoryGroups = this.categoryService.getCategoryGroups();
        this.scales = this.categoryService.getScales();
        this.eras = this.categoryService.getFilterOptions().eras;
        this.conditions = this.categoryService.getConditions();
    }

    onFileSelected(event: any): void {
        const files = event.target.files;
        if (files) {
            Array.from(files).forEach((file: any) => {
                this.addImage(file as File);
            });
        }
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        this.dragOver = true;
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        this.dragOver = false;
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        this.dragOver = false;

        const files = event.dataTransfer?.files;
        if (files) {
            Array.from(files).forEach(file => {
                this.addImage(file);
            });
        }
    }

    private addImage(file: File): void {
        if (!file.type.startsWith('image/')) {
            this.toastService.show('Please select only image files', 'error');
            return;
        }

        const imageId = this.generateId();
        const image: AuctionImage = {
            id: imageId,
            url: '',
            file: file,
            isUploading: true,
            isMain: this.images.length === 0
        };

        this.images.push(image);

        // Simulate file upload (replace with actual upload logic)
        const reader = new FileReader();
        reader.onload = (e: any) => {
            image.url = e.target.result;
            image.isUploading = false;
            this.cdr.detectChanges();
        };
        reader.readAsDataURL(file);
    }

    removeImage(imageId: string): void {
        const index = this.images.findIndex(img => img.id === imageId);
        if (index !== -1) {
            const wasMain = this.images[index].isMain;
            this.images.splice(index, 1);

            // If we removed the main image and there are other images, set the first one as main
            if (wasMain && this.images.length > 0) {
                this.images[0].isMain = true;
            }

            this.cdr.detectChanges();
        }
    }

    setMainImage(imageId: string): void {
        this.images.forEach(img => {
            img.isMain = img.id === imageId;
        });
        this.cdr.detectChanges();
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }

    getCategoriesForGroup(groupId: string): any[] {
        return this.categoryService.getCategoriesByGroup(groupId);
    }

    getCategoryDisplayName(categoryId: string): string {
        const category = this.categories.find(cat => cat.id === categoryId);
        return category ? category.name : categoryId;
    }

    getCategoryGroupDisplayName(groupId: string): string {
        const group = this.categoryGroups.find(g => g.id === groupId);
        return group ? group.name : groupId;
    }

    getConditionDisplayName(conditionId: string): string {
        const condition = this.conditions.find(c => c.id === conditionId);
        return condition ? condition.name : conditionId;
    }

    onCategoryGroupChange() {
        // Reset category selection when group changes
        this.auction.category = '';
        this.auction.scale = '';
        this.auction.era = '';
        this.cdr.detectChanges();
    }

    addTag() {
        if (this.newTag.trim()) {
            if (!this.auction.tags) {
                this.auction.tags = [];
            }
            if (!this.auction.tags.includes(this.newTag.trim())) {
                this.auction.tags.push(this.newTag.trim());
            }
            this.newTag = '';
            this.cdr.detectChanges();
        }
    }

    removeTag(tag: string) {
        if (this.auction.tags) {
            const index = this.auction.tags.indexOf(tag);
            if (index > -1) {
                this.auction.tags.splice(index, 1);
                this.cdr.detectChanges();
            }
        }
    }

    getMainImageUrl(): string {
        const mainImage = this.images.find(img => img.isMain);
        return mainImage?.url || this.images[0]?.url || '';
    }

    getMinDate(): string {
        const today = new Date();
        return today.toISOString().split('T')[0];
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

    onSubmit(): void {
        if (!this.originalAuction?.id) {
            this.toastService.show('Auction ID not found', 'error');
            return;
        }

        if (!this.auction.title?.trim()) {
            this.toastService.show('Please enter a title for the auction', 'error');
            return;
        }

        if (!this.auction.description?.trim()) {
            this.toastService.show('Please enter a description for the auction', 'error');
            return;
        }

        if (!this.auction.startingPrice || this.auction.startingPrice <= 0) {
            this.toastService.show('Please enter a valid starting price', 'error');
            return;
        }

        if (!this.auction.category) {
            this.toastService.show('Please select a category', 'error');
            return;
        }

        if (this.auction.saleType === 'auction' && !this.auction.endTime) {
            this.toastService.show('Please set an end date for auctions', 'error');
            return;
        }

        if (this.auction.saleType === 'auction' && this.auction.endTime) {
            const endDate = new Date(this.auction.endTime);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (endDate < today) {
                this.toastService.show('End date cannot be in the past', 'error');
                return;
            }
        }

        if (!this.auction.condition) {
            this.toastService.show('Please select a condition', 'error');
            return;
        }

        // Set image URL from main image
        const mainImage = this.images.find(img => img.isMain);
        if (mainImage) {
            this.auction.imageUrl = mainImage.url;
        }

        this.loading = true;
        this.auctionService.updateAuction(this.originalAuction.id, this.auction)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (updatedAuction) => {
                    this.toastService.show('Auction updated successfully', 'success');
                    this.router.navigate(['/auctions', updatedAuction.id]);
                },
                error: (error) => {
                    console.error('Error updating auction:', error);
                    this.toastService.show('Failed to update auction', 'error');
                    this.loading = false;
                    this.cdr.detectChanges();
                }
            });
    }

    onCancel(): void {
        if (this.originalAuction?.id) {
            this.router.navigate(['/auctions', this.originalAuction.id]);
        } else {
            this.router.navigate(['/auctions']);
        }
    }

    onDelete(): void {
        if (!this.originalAuction?.id) {
            this.toastService.show('Auction ID not found', 'error');
            return;
        }

        if (confirm('Are you sure you want to delete this auction? This action cannot be undone.')) {
            this.loading = true;
            this.auctionService.deleteAuction(this.originalAuction.id)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: () => {
                        this.toastService.show('Auction deleted successfully', 'success');
                        this.router.navigate(['/auctions']);
                    },
                    error: (error) => {
                        console.error('Error deleting auction:', error);
                        this.toastService.show('Failed to delete auction', 'error');
                        this.loading = false;
                        this.cdr.detectChanges();
                    }
                });
        }
    }
}
