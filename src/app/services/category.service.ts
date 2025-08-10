import { Injectable } from '@angular/core';

export interface CategoryGroup {
    id: string;
    name: string;
    description: string;
    icon: string;
    categories: Category[];
}

export interface Category {
    id: string;
    name: string;
    description: string;
    icon: string;
    parentGroup: string;
    tags: string[];
    examples: string[];
}

export interface FilterOptions {
    categoryGroups: string[];
    categories: string[];
    genres: string[];
    scales: string[];
    eras: string[];
    conditions: string[];
    priceRanges: PriceRange[];
}

export interface PriceRange {
    id: string;
    label: string;
    min: number;
    max: number | null;
}

@Injectable({
    providedIn: 'root'
})
export class CategoryService {

    private categoryGroups: CategoryGroup[] = [
        {
            id: 'fantasy-sci-fi',
            name: 'Fantasy & Sci-fi',
            description: 'Epic battles in fantastical realms and futuristic worlds',
            icon: 'fas fa-dragon',
            categories: [
                {
                    id: 'warhammer-40k',
                    name: 'Warhammer 40,000',
                    description: 'The grim darkness of the far future',
                    icon: 'fas fa-skull',
                    parentGroup: 'fantasy-sci-fi',
                    tags: ['40k', 'space-marines', 'chaos', 'imperium', 'xenos'],
                    examples: ['Space Marines', 'Chaos Space Marines', 'Orks', 'Eldar', 'Tyranids']
                },
                {
                    id: 'warhammer-aos',
                    name: 'Warhammer Age of Sigmar',
                    description: 'Epic fantasy battles in the Mortal Realms',
                    icon: 'fas fa-crown',
                    parentGroup: 'fantasy-sci-fi',
                    tags: ['aos', 'stormcast', 'chaos', 'death', 'destruction'],
                    examples: ['Stormcast Eternals', 'Nighthaunt', 'Orruk Warclans', 'Soulblight Gravelords']
                },
                {
                    id: 'dungeons-dragons',
                    name: 'Dungeons & Dragons',
                    description: 'Classic fantasy roleplaying miniatures',
                    icon: 'fas fa-dice-d20',
                    parentGroup: 'fantasy-sci-fi',
                    tags: ['dnd', 'd&d', 'fantasy', 'adventure'],
                    examples: ['Heroes', 'Monsters', 'Dragons', 'Adventurers']
                },
                {
                    id: 'star-wars',
                    name: 'Star Wars',
                    description: 'Galaxy far, far away miniatures',
                    icon: 'fas fa-jedi',
                    parentGroup: 'fantasy-sci-fi',
                    tags: ['star-wars', 'jedi', 'sith', 'republic', 'empire'],
                    examples: ['Jedi Knights', 'Stormtroopers', 'Droids', 'Bounty Hunters']
                },
                {
                    id: 'lotr',
                    name: 'Lord of the Rings',
                    description: 'Middle-earth battles and adventures',
                    icon: 'fas fa-ring',
                    parentGroup: 'fantasy-sci-fi',
                    tags: ['lotr', 'middle-earth', 'fellowship', 'mordor'],
                    examples: ['Fellowship', 'Rohan', 'Gondor', 'Mordor']
                },
                {
                    id: 'other-fantasy',
                    name: 'Other Fantasy',
                    description: 'Various fantasy miniatures and creatures',
                    icon: 'fas fa-magic',
                    parentGroup: 'fantasy-sci-fi',
                    tags: ['fantasy', 'creatures', 'magic'],
                    examples: ['Dragons', 'Elves', 'Dwarves', 'Fantasy Creatures']
                }
            ]
        },
        {
            id: 'historical',
            name: 'Historical',
            description: 'Recreate battles from throughout history',
            icon: 'fas fa-landmark',
            categories: [
                {
                    id: 'ancient',
                    name: 'Ancient',
                    description: 'Rome, Greece, Egypt, and other ancient civilizations',
                    icon: 'fas fa-columns',
                    parentGroup: 'historical',
                    tags: ['ancient', 'rome', 'greece', 'egypt', 'persia'],
                    examples: ['Roman Legionaries', 'Greek Hoplites', 'Egyptian Warriors', 'Persian Immortals']
                },
                {
                    id: 'medieval',
                    name: 'Medieval',
                    description: 'Knights, castles, and medieval warfare',
                    icon: 'fas fa-chess-knight',
                    parentGroup: 'historical',
                    tags: ['medieval', 'knights', 'castles', 'crusades'],
                    examples: ['Knights', 'Archers', 'Men-at-Arms', 'Crusaders']
                },
                {
                    id: 'napoleonic',
                    name: 'Napoleonic',
                    description: '18th-19th century warfare',
                    icon: 'fas fa-hat-cowboy',
                    parentGroup: 'historical',
                    tags: ['napoleonic', '18th-century', '19th-century', 'line-infantry'],
                    examples: ['Line Infantry', 'Cavalry', 'Artillery', 'Grenadiers']
                },
                {
                    id: 'world-wars',
                    name: 'World Wars',
                    description: '20th century conflicts',
                    icon: 'fas fa-plane',
                    parentGroup: 'historical',
                    tags: ['ww1', 'ww2', '20th-century', 'modern-warfare'],
                    examples: ['Infantry', 'Tanks', 'Artillery', 'Aircraft']
                },
                {
                    id: 'modern',
                    name: 'Modern',
                    description: 'Contemporary military forces',
                    icon: 'fas fa-shield-alt',
                    parentGroup: 'historical',
                    tags: ['modern', 'contemporary', 'military'],
                    examples: ['Modern Infantry', 'Armored Vehicles', 'Special Forces']
                }
            ]
        },
        {
            id: 'sci-fi',
            name: 'Sci-fi',
            description: 'Futuristic technology and space warfare',
            icon: 'fas fa-rocket',
            categories: [
                {
                    id: 'star-trek',
                    name: 'Star Trek',
                    description: 'Boldly go where no one has gone before',
                    icon: 'fas fa-star',
                    parentGroup: 'sci-fi',
                    tags: ['star-trek', 'federation', 'klingons', 'romulans'],
                    examples: ['Starfleet Officers', 'Klingon Warriors', 'Romulan Commanders', 'Borg']
                },
                {
                    id: 'battletech',
                    name: 'Battletech',
                    description: 'Giant robot warfare in the 31st century',
                    icon: 'fas fa-robot',
                    parentGroup: 'sci-fi',
                    tags: ['battletech', 'mechs', 'giant-robots', '31st-century'],
                    examples: ['BattleMechs', 'Battle Armor', 'Vehicles', 'Infantry']
                },
                {
                    id: 'infinity',
                    name: 'Infinity',
                    description: 'Near-future sci-fi skirmish game',
                    icon: 'fas fa-infinity',
                    parentGroup: 'sci-fi',
                    tags: ['infinity', 'near-future', 'skirmish', 'cyberpunk'],
                    examples: ['Nomads', 'PanOceania', 'Yu Jing', 'Ariadna']
                },
                {
                    id: 'other-sci-fi',
                    name: 'Other Sci-fi',
                    description: 'Various futuristic and space-themed miniatures',
                    icon: 'fas fa-satellite',
                    parentGroup: 'sci-fi',
                    tags: ['sci-fi', 'futuristic', 'space', 'aliens'],
                    examples: ['Space Marines', 'Alien Races', 'Robots', 'Spaceships']
                }
            ]
        },
        {
            id: 'generic',
            name: 'Generic & Custom',
            description: 'Versatile miniatures for any setting',
            icon: 'fas fa-palette',
            categories: [
                {
                    id: 'fantasy-generic',
                    name: 'Fantasy Generic',
                    description: 'Universal fantasy miniatures',
                    icon: 'fas fa-magic',
                    parentGroup: 'generic',
                    tags: ['fantasy', 'generic', 'universal'],
                    examples: ['Fantasy Warriors', 'Magic Users', 'Fantasy Creatures', 'Adventurers']
                },
                {
                    id: 'sci-fi-generic',
                    name: 'Sci-fi Generic',
                    description: 'Universal sci-fi miniatures',
                    icon: 'fas fa-rocket',
                    parentGroup: 'generic',
                    tags: ['sci-fi', 'generic', 'universal'],
                    examples: ['Space Soldiers', 'Alien Races', 'Robots', 'Spaceships']
                },
                {
                    id: 'custom-3d',
                    name: 'Custom & 3D Printed',
                    description: 'Unique and custom miniatures',
                    icon: 'fas fa-print',
                    parentGroup: 'generic',
                    tags: ['custom', '3d-printed', 'unique', 'handmade'],
                    examples: ['Custom Characters', '3D Printed Models', 'Handmade Miniatures']
                }
            ]
        },
        {
            id: 'accessories',
            name: 'Accessories & Supplies',
            description: 'Everything you need for your hobby',
            icon: 'fas fa-tools',
            categories: [
                {
                    id: 'paints',
                    name: 'Paints & Supplies',
                    description: 'Colors, brushes, and painting tools',
                    icon: 'fas fa-paint-brush',
                    parentGroup: 'accessories',
                    tags: ['paints', 'brushes', 'tools', 'supplies'],
                    examples: ['Acrylic Paints', 'Brushes', 'Primers', 'Varnishes']
                },
                {
                    id: 'terrain',
                    name: 'Terrain',
                    description: 'Battlefield scenery and structures',
                    icon: 'fas fa-mountain',
                    parentGroup: 'accessories',
                    tags: ['terrain', 'scenery', 'buildings', 'ruins'],
                    examples: ['Buildings', 'Ruins', 'Forests', 'Hills', 'Roads']
                },
                {
                    id: 'books',
                    name: 'Books & Rules',
                    description: 'Rulebooks, codexes, and guides',
                    icon: 'fas fa-book',
                    parentGroup: 'accessories',
                    tags: ['books', 'rules', 'codexes', 'guides'],
                    examples: ['Rulebooks', 'Codexes', 'Campaign Books', 'Painting Guides']
                },
                {
                    id: 'collectibles',
                    name: 'Collectibles',
                    description: 'Rare and special items',
                    icon: 'fas fa-gem',
                    parentGroup: 'accessories',
                    tags: ['collectibles', 'rare', 'limited-edition', 'special'],
                    examples: ['Limited Editions', 'Rare Models', 'Special Releases', 'Collector Items']
                }
            ]
        }
    ];

    private scales: { id: string; name: string; description: string }[] = [
        { id: '6mm', name: '6mm (Micro)', description: 'Tiny scale for mass battles' },
        { id: '10mm', name: '10mm', description: 'Small scale for large engagements' },
        { id: '15mm', name: '15mm', description: 'Popular historical scale' },
        { id: '20mm', name: '20mm', description: 'Classic wargaming scale' },
        { id: '25mm', name: '25mm', description: 'Traditional fantasy scale' },
        { id: '28mm', name: '28mm (Heroic)', description: 'Standard tabletop scale' },
        { id: '32mm', name: '32mm', description: 'Larger heroic scale' },
        { id: '54mm', name: '54mm (Display)', description: 'Display and collector scale' },
        { id: '75mm', name: '75mm', description: 'Large display scale' },
        { id: '120mm', name: '120mm', description: 'Very large display scale' }
    ];

    private conditions: { id: string; name: string; description: string }[] = [
        { id: 'new', name: 'New', description: 'Unopened, mint condition' },
        { id: 'excellent', name: 'Excellent', description: 'Like new, minimal wear' },
        { id: 'good', name: 'Good', description: 'Some wear, still very usable' },
        { id: 'fair', name: 'Fair', description: 'Visible wear, functional' },
        { id: 'poor', name: 'Poor', description: 'Heavy wear, may need repair' }
    ];

    constructor() { }

    getCategoryGroups(): CategoryGroup[] {
        return this.categoryGroups;
    }

    getCategories(): Category[] {
        return this.categoryGroups.flatMap(group => group.categories);
    }

    getCategoryById(id: string): Category | undefined {
        return this.getCategories().find(cat => cat.id === id);
    }

    getCategoryGroupById(id: string): CategoryGroup | undefined {
        return this.categoryGroups.find(group => group.id === id);
    }

    getCategoriesByGroup(groupId: string): Category[] {
        const group = this.getCategoryGroupById(groupId);
        return group ? group.categories : [];
    }

    getScales() {
        return this.scales;
    }

    getConditions() {
        return this.conditions;
    }

    getFilterOptions(): FilterOptions {
        return {
            categoryGroups: this.categoryGroups.map(g => g.id),
            categories: this.getCategories().map(c => c.id),
            genres: ['fantasy', 'sci-fi', 'historical', 'generic'],
            scales: this.scales.map(s => s.id),
            eras: ['ancient', 'medieval', 'renaissance', 'napoleonic', 'victorian', 'ww1', 'ww2', 'modern', 'futuristic'],
            conditions: this.conditions.map(c => c.id),
            priceRanges: [
                { id: '0-25', label: 'Under €25', min: 0, max: 25 },
                { id: '25-50', label: '€25 - €50', min: 25, max: 50 },
                { id: '50-100', label: '€50 - €100', min: 50, max: 100 },
                { id: '100-250', label: '€100 - €250', min: 100, max: 250 },
                { id: '250-500', label: '€250 - €500', min: 250, max: 500 },
                { id: '500+', label: '€500+', min: 500, max: null }
            ]
        };
    }

    searchCategories(query: string): Category[] {
        const searchTerm = query.toLowerCase();
        return this.getCategories().filter(cat =>
            cat.name.toLowerCase().includes(searchTerm) ||
            cat.description.toLowerCase().includes(searchTerm) ||
            cat.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
            cat.examples.some(example => example.toLowerCase().includes(searchTerm))
        );
    }

    getCategoryPath(categoryId: string): string[] {
        const category = this.getCategoryById(categoryId);
        if (!category) return [];

        const group = this.getCategoryGroupById(category.parentGroup);
        if (!group) return [category.name];

        return [group.name, category.name];
    }
}
