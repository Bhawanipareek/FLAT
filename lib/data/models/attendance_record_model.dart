class AttendanceRecordModel {
  final String id;
  final String dateString; // YYYY-MM-DD
  final String status; // 'full_day', 'half_day', 'paid_leave', 'unpaid_leave', 'holiday', 'weekly_off'
  final String? notes;
  final DateTime updatedAt;

  AttendanceRecordModel({
    required this.id,
    required this.dateString,
    this.status = 'full_day',
    this.notes,
    required this.updatedAt,
  });

  DateTime get date => DateTime.parse(dateString);

  AttendanceRecordModel copyWith({
    String? id,
    String? dateString,
    String? status,
    String? notes,
    DateTime? updatedAt,
  }) {
    return AttendanceRecordModel(
      id: id ?? this.id,
      dateString: dateString ?? this.dateString,
      status: status ?? this.status,
      notes: notes ?? this.notes,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'date': dateString,
      'status': status,
      'notes': notes,
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  factory AttendanceRecordModel.fromMap(Map<String, dynamic> map) {
    return AttendanceRecordModel(
      id: map['id'] as String,
      dateString: map['date'] as String,
      status: map['status'] as String? ?? 'full_day',
      notes: map['notes'] as String?,
      updatedAt: map['updated_at'] != null
          ? DateTime.parse(map['updated_at'] as String)
          : DateTime.now(),
    );
  }
}
