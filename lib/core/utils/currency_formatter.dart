import 'package:intl/intl.dart';

class CurrencyFormatter {
  static final NumberFormat _inrFormatter = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '₹ ',
    decimalDigits: 2,
  );

  static final NumberFormat _compactInrFormatter = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '₹ ',
    decimalDigits: 0,
  );

  static String format(double amount, {String symbol = '₹', bool showDecimals = true}) {
    if (symbol == '₹') {
      if (!showDecimals && amount == amount.truncateToDouble()) {
        return _compactInrFormatter.format(amount);
      }
      return _inrFormatter.format(amount);
    } else {
      final formatter = NumberFormat.currency(
        symbol: '$symbol ',
        decimalDigits: showDecimals ? 2 : 0,
      );
      return formatter.format(amount);
    }
  }

  static String formatCompact(double amount, {String symbol = '₹'}) {
    if (amount >= 10000000) {
      return '$symbol ${(amount / 10000000).toStringAsFixed(2)} Cr';
    } else if (amount >= 100000) {
      return '$symbol ${(amount / 100000).toStringAsFixed(2)} L';
    } else if (amount >= 1000) {
      return '$symbol ${(amount / 1000).toStringAsFixed(1)} k';
    }
    return format(amount, symbol: symbol, showDecimals: false);
  }
}
