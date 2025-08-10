import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuctionService, Auction, AuctionFilters, PaginatedAuctionsResponse } from '../services/auction.service';
import { CategoryService, CategoryGroup, Category, FilterOptions } from '../services/category.service';
import { AuthService } from '../services/auth.service';
import { CurrencyService } from '../services/currency.service';
import { environment } from '../../environments/environment';

@Component({
    selector: 'app-auctions',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './auctions.component.html',
    styleUrls: ['./auctions.component.scss']
})
export class AuctionsComponent implements OnInit, OnDestroy {
    auctions: Auction[] = [];
    filteredAuctions: Auction[] = [];
    loading = true;
    error = false;
    errorMessage = '';
    environment = environment;

    // Pagination properties
    currentPage = 1;
    totalPages = 1;
    totalAuctions = 0;
    itemsPerPage = 12;

    // Filter properties
    showOwn = false;
    currentFilters: AuctionFilters = {};

    // Enhanced filter properties
    selectedCategoryGroup = '';
    selectedCategory = '';
    selectedScale = '';
    selectedEra = '';
    selectedCondition = '';
    selectedStatus = '';
    selectedPriceRange = '';
    sortBy = 'newest'; // Changed from 'ending-soon' to 'newest' to avoid filtering issues

    // Category data
    categoryGroups: CategoryGroup[] = [];
    categories: Category[] = [];
    filterOptions!: FilterOptions;

    private filterTimeout: any;
    private loadingTimeout: any;

    constructor(
        private auctionService: AuctionService,
        private categoryService: CategoryService,
        public authService: AuthService,
        public currencyService: CurrencyService,
        private cdr: ChangeDetectorRef,
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit() {
        this.loadCategoryData();
        this.setupQueryParams();
        this.loadAuctions();
        this.cdr.detectChanges();

        // Set a timeout to prevent infinite loading
        this.loadingTimeout = setTimeout(() => {
            if (this.loading) {
                this.loading = false;
                this.error = true;
                this.errorMessage = 'Loading timeout. Please refresh the page.';
                this.cdr.detectChanges();
            }
        }, 30000); // 30 seconds timeout
    }

    setupQueryParams() {
        this.route.queryParams.subscribe(params => {
            const newPage = parseInt(params['page']) || 1;

            // Check if page parameter changed
            const pageChanged = this.currentPage !== newPage;

            this.currentPage = newPage;
            this.updateFilters();

            // If page changed, reload auctions
            if (pageChanged) {
                this.loadAuctions();
            }
        });
    }

    onShowOwnChange() {
        // Check if user is logged in when trying to view "My Auctions"
        if (this.showOwn && !this.authService.isUserLoggedIn()) {
            this.error = true;
            this.errorMessage = 'Please log in to view your own auctions.';
            this.loading = false;
            this.cdr.detectChanges();
            return;
        }

        // Reset to first page when toggling showOwn
        this.currentPage = 1;
        this.updateFilters();
        this.loadAuctions();
    }

    updateFilters() {
        // Always include showOwn if requested - let the backend handle authentication
        this.currentFilters = {
            categoryGroup: this.selectedCategoryGroup || undefined,
            category: this.selectedCategory || undefined,
            scale: this.selectedScale || undefined,
            era: this.selectedEra || undefined,
            condition: this.selectedCondition || undefined,
            status: this.selectedStatus || undefined,
            priceRange: this.selectedPriceRange || undefined,
            showOwn: this.showOwn,
            sortBy: this.sortBy,
            page: this.currentPage,
            limit: this.itemsPerPage
        };
    }

    loadCategoryData() {
        try {
            this.categoryGroups = this.categoryService.getCategoryGroups();
            this.categories = this.categoryService.getCategories();
            this.filterOptions = this.categoryService.getFilterOptions();
        } catch (error) {
            this.error = true;
            this.errorMessage = 'Failed to load category data';
            // Set default empty values to prevent crashes
            this.categoryGroups = [];
            this.categories = [];
            this.filterOptions = {
                categoryGroups: [],
                categories: [],
                genres: [],
                scales: [],
                eras: [],
                conditions: [],
                priceRanges: []
            };
        }
    }

    loadAuctions() {
        this.loading = true;
        this.error = false;
        this.errorMessage = '';

        // Clear any existing timeout
        if (this.loadingTimeout) {
            clearTimeout(this.loadingTimeout);
        }

        this.updateFilters();

        this.auctionService.getAuctions(this.currentFilters).subscribe({
            next: (response: PaginatedAuctionsResponse) => {
                this.auctions = response.auctions;
                this.totalAuctions = response.total;
                this.totalPages = response.totalPages;
                this.currentPage = response.page;
                this.loading = false;

                // Handle case where no auctions are returned from API
                if (!this.auctions || this.auctions.length === 0) {
                    this.filteredAuctions = [];
                    this.cdr.detectChanges();
                    return;
                }

                // Initially show all auctions without filtering
                this.filteredAuctions = [...this.auctions];
                this.cdr.detectChanges();
            },
            error: (error) => {
                this.loading = false;
                this.error = true;

                // Handle specific error for "My Auctions" when not authenticated
                if (error.status === 401 && this.showOwn) {
                    this.errorMessage = 'Please log in to view your own auctions.';
                    // Don't clear auctions array, just show the error message
                } else if (error.status === 0) {
                    this.errorMessage = 'Unable to connect to the server. Please check your internet connection.';
                    this.auctions = [];
                    this.filteredAuctions = [];
                } else if (error.status === 404) {
                    this.errorMessage = 'Auction service not found. Please contact support.';
                    this.auctions = [];
                    this.filteredAuctions = [];
                } else if (error.status === 500) {
                    this.errorMessage = 'Server error. Please try again later.';
                    this.auctions = [];
                    this.filteredAuctions = [];
                } else if (error.status >= 400) {
                    this.errorMessage = 'Request failed. Please try again.';
                    this.auctions = [];
                    this.filteredAuctions = [];
                } else {
                    this.errorMessage = 'Failed to load auctions. Please try again.';
                    this.auctions = [];
                    this.filteredAuctions = [];
                }

                this.cdr.detectChanges();
            }
        });
    }

    // Debounced filter method to prevent excessive calls
    debouncedFilter() {
        if (this.filterTimeout) {
            clearTimeout(this.filterTimeout);
        }
        this.filterTimeout = setTimeout(() => {
            this.filterAuctions(); // Apply filters to existing data instead of reloading
        }, 300);
    }

    // Pagination methods
    goToPage(page: number) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.updateQueryParams();
            this.loadAuctions();
        }
    }

    updateQueryParams() {
        const queryParams: any = {};
        if (this.currentPage > 1) queryParams.page = this.currentPage.toString();

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: queryParams,
            queryParamsHandling: 'merge'
        });
    }

    getPageNumbers(): number[] {
        const pages: number[] = [];
        const maxVisiblePages = 5;

        if (this.totalPages <= maxVisiblePages) {
            // Show all pages if total is small
            for (let i = 1; i <= this.totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Show a window of pages around current page
            let start = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
            let end = Math.min(this.totalPages, start + maxVisiblePages - 1);

            // Adjust start if we're near the end
            if (end - start + 1 < maxVisiblePages) {
                start = Math.max(1, end - maxVisiblePages + 1);
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
        }

        return pages;
    }

    // Make Math available in template
    Math = Math;

    filterAuctions() {
        // Prevent filtering if auctions array is not loaded yet
        if (!this.auctions || this.auctions.length === 0) {
            this.filteredAuctions = [];
            return;
        }

        // Start with all auctions
        let filtered = [...this.auctions];
        let filterCount = 0;

        // Category Group filter
        if (this.selectedCategoryGroup && this.selectedCategoryGroup.trim() !== '') {
            filtered = filtered.filter(auction => auction.categoryGroup === this.selectedCategoryGroup);
            filterCount++;
        }

        // Category filter
        if (this.selectedCategory && this.selectedCategory.trim() !== '') {
            filtered = filtered.filter(auction => auction.category === this.selectedCategory);
            filterCount++;
        }

        // Scale filter
        if (this.selectedScale && this.selectedScale.trim() !== '') {
            filtered = filtered.filter(auction => auction.scale === this.selectedScale);
            filterCount++;
        }

        // Era filter
        if (this.selectedEra && this.selectedEra.trim() !== '') {
            filtered = filtered.filter(auction => auction.era === this.selectedEra);
            filterCount++;
        }

        // Condition filter
        if (this.selectedCondition && this.selectedCondition.trim() !== '') {
            filtered = filtered.filter(auction => auction.condition === this.selectedCondition);
            filterCount++;
        }

        // Status filter
        if (this.selectedStatus && this.selectedStatus.trim() !== '') {
            if (this.selectedStatus === 'ending-soon') {
                const now = new Date();
                const oneDay = 24 * 60 * 60 * 1000;
                filtered = filtered.filter(auction => {
                    // Skip auctions without endTime for ending-soon filter
                    if (!auction.endTime) return false;

                    try {
                        const endTime = new Date(auction.endTime);
                        // Check if the date is valid
                        if (isNaN(endTime.getTime())) return false;

                        return endTime.getTime() - now.getTime() <= oneDay && auction.status === 'active';
                    } catch (error) {
                        return false;
                    }
                });
            } else {
                filtered = filtered.filter(auction => auction.status === this.selectedStatus);
            }
            filterCount++;
        }

        // Price range filter
        if (this.selectedPriceRange && this.selectedPriceRange.trim() !== '') {
            const priceRange = this.filterOptions?.priceRanges?.find(pr => pr.id === this.selectedPriceRange);
            if (priceRange) {
                filtered = filtered.filter(auction => {
                    if (priceRange.max === null) {
                        return auction.currentPrice >= priceRange.min;
                    }
                    return auction.currentPrice >= priceRange.min && auction.currentPrice <= priceRange.max;
                });
                filterCount++;
            }
        }

        // If no filters were applied and we have auctions, show all auctions
        if (filterCount === 0 && this.auctions.length > 0) {
            filtered = [...this.auctions];
        }

        // Sort filtered results
        this.sortAuctions(filtered);

        this.filteredAuctions = filtered;
        this.cdr.detectChanges();
    }

    sortAuctions(auctions: Auction[]) {
        try {
            switch (this.sortBy) {
                case 'ending-soon':
                    auctions.sort((a, b) => {
                        if (!a.endTime && !b.endTime) return 0;
                        if (!a.endTime) return 1;
                        if (!b.endTime) return -1;

                        const aTime = new Date(a.endTime);
                        const bTime = new Date(b.endTime);

                        if (isNaN(aTime.getTime()) || isNaN(bTime.getTime())) return 0;

                        return aTime.getTime() - bTime.getTime();
                    });
                    break;
                case 'price-low-high':
                    auctions.sort((a, b) => a.currentPrice - b.currentPrice);
                    break;
                case 'price-high-low':
                    auctions.sort((a, b) => b.currentPrice - a.currentPrice);
                    break;
                case 'newest':
                    auctions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    break;
                case 'oldest':
                    auctions.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                    break;
                default:
                    break;
            }
        } catch (error) {
            // Silently handle sorting errors
        }
    }

    onCategoryGroupChange() {
        // Reset category selection when group changes
        this.selectedCategory = '';
        this.debouncedFilter();
    }

    getCategoriesForGroup(groupId: string): Category[] {
        return this.categoryService.getCategoriesByGroup(groupId);
    }

    getCategoryDisplayName(categoryId: string): string {
        const category = this.categoryService.getCategoryById(categoryId);
        return category ? category.name : categoryId;
    }

    getCategoryGroupDisplayName(groupId: string): string {
        const group = this.categoryService.getCategoryGroupById(groupId);
        return group ? group.name : groupId;
    }

    getCategoryById(categoryId: string): Category | undefined {
        return this.categoryService.getCategoryById(categoryId);
    }

    getStatusClass(auction: Auction): string {
        try {
            if (!auction || !auction.status) return 'badge-secondary';

            switch (auction.status) {
                case 'active':
                    if (auction.endTime) {
                        const now = new Date();
                        const endTime = new Date(auction.endTime);
                        if (isNaN(endTime.getTime())) return 'badge-secondary';

                        const oneDay = 24 * 60 * 60 * 1000;
                        if (endTime.getTime() - now.getTime() <= oneDay) {
                            return 'badge-warning';
                        }
                    }
                    return 'badge-success';
                case 'ended':
                    return 'badge-danger';
                case 'cancelled':
                    return 'badge-secondary';
                case 'sold':
                    return 'badge-info';
                default:
                    return 'badge-secondary';
            }
        } catch (error) {
            return 'badge-secondary';
        }
    }

    getStatusText(auction: Auction): string {
        try {
            if (!auction || !auction.status) return 'Unknown';

            switch (auction.status) {
                case 'active':
                    if (auction.endTime) {
                        const now = new Date();
                        const endTime = new Date(auction.endTime);
                        if (isNaN(endTime.getTime())) return 'Active';

                        const oneDay = 24 * 60 * 60 * 1000;
                        if (endTime.getTime() - now.getTime() <= oneDay) {
                            return 'Ending Soon';
                        }
                    }
                    return 'Active';
                case 'ended':
                    return 'Ended';
                case 'cancelled':
                    return 'Cancelled';
                case 'sold':
                    return 'Sold';
                default:
                    return 'Unknown';
            }
        } catch (error) {
            return 'Unknown';
        }
    }

    clearFilters() {
        this.selectedCategoryGroup = '';
        this.selectedCategory = '';
        this.selectedScale = '';
        this.selectedEra = '';
        this.selectedCondition = '';
        this.selectedStatus = '';
        this.selectedPriceRange = '';
        this.sortBy = 'newest';
        this.showOwn = false;
        this.currentPage = 1;

        // Reload auctions with cleared filters
        this.updateFilters();
        this.loadAuctions();
        this.updateQueryParams();
    }

    refreshData() {
        this.loading = true;
        this.error = false;
        this.errorMessage = '';
        this.loadAuctions();
        this.cdr.detectChanges();
    }



    formatPrice(amountEUR: number): string {
        if (amountEUR === null || amountEUR === undefined || isNaN(amountEUR)) {
            return this.currencyService.formatPriceRange(0);
        }
        return this.currencyService.formatPriceRange(amountEUR);
    }

    ngOnDestroy(): void {
        if (this.filterTimeout) {
            clearTimeout(this.filterTimeout);
        }
        if (this.loadingTimeout) {
            clearTimeout(this.loadingTimeout);
        }
    }
} 