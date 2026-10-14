import 'package:flutter/material.dart';

class CategoryItem {
  final String id;
  final String name;
  final IconData icon;
  final Color color;

  const CategoryItem({
    required this.id,
    required this.name,
    required this.icon,
    required this.color,
  });
}

class ExpenseCategories {
  static const List<CategoryItem> all = [
    CategoryItem(
      id: 'grocery',
      name: 'Grocery',
      icon: Icons.local_grocery_store_rounded,
      color: Color(0xFF10B981),
    ),
    CategoryItem(
      id: 'milk_dairy',
      name: 'Milk and dairy',
      icon: Icons.egg_outlined,
      color: Color(0xFF0EA5E9),
    ),
    CategoryItem(
      id: 'veg_fruits',
      name: 'Vegetables and fruits',
      icon: Icons.eco_rounded,
      color: Color(0xFF84CC16),
    ),
    CategoryItem(
      id: 'rent',
      name: 'Rent',
      icon: Icons.home_rounded,
      color: Color(0xFF6366F1),
    ),
    CategoryItem(
      id: 'electricity',
      name: 'Electricity',
      icon: Icons.bolt_rounded,
      color: Color(0xFFF59E0B),
    ),
    CategoryItem(
      id: 'water',
      name: 'Water',
      icon: Icons.water_drop_rounded,
      color: Color(0xFF06B6D4),
    ),
    CategoryItem(
      id: 'gas_cylinder',
      name: 'Gas cylinder',
      icon: Icons.propane_tank_rounded,
      color: Color(0xFFEF4444),
    ),
    CategoryItem(
      id: 'internet',
      name: 'Internet',
      icon: Icons.wifi_rounded,
      color: Color(0xFF8B5CF6),
    ),
    CategoryItem(
      id: 'cleaning',
      name: 'Cleaning supplies',
      icon: Icons.cleaning_services_rounded,
      color: Color(0xFF14B8A6),
    ),
    CategoryItem(
      id: 'food_takeaway',
      name: 'Food and takeaway',
      icon: Icons.restaurant_rounded,
      color: Color(0xFFF97316),
    ),
    CategoryItem(
      id: 'household',
      name: 'Household items',
      icon: Icons.chair_rounded,
      color: Color(0xFFD946EF),
    ),
    CategoryItem(
      id: 'other',
      name: 'Other',
      icon: Icons.more_horiz_rounded,
      color: Color(0xFF64748B),
    ),
  ];

  static CategoryItem getById(String id) {
    return all.firstWhere(
      (cat) => cat.id.toLowerCase() == id.toLowerCase() || cat.name.toLowerCase() == id.toLowerCase(),
      orElse: () => const CategoryItem(
        id: 'other',
        name: 'Other',
        icon: Icons.category_rounded,
        color: Color(0xFF64748B),
      ),
    );
  }
}
