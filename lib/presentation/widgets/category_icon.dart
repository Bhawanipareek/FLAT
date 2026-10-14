import 'package:flutter/material.dart';
import '../../core/constants/expense_categories.dart';

class CategoryIcon extends StatelessWidget {
  final String categoryId;
  final double size;

  const CategoryIcon({
    super.key,
    required this.categoryId,
    this.size = 40,
  });

  @override
  Widget build(BuildContext context) {
    final category = ExpenseCategories.getById(categoryId);

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: category.color.withOpacity(0.12),
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Icon(
          category.icon,
          color: category.color,
          size: size * 0.55,
        ),
      ),
    );
  }
}
