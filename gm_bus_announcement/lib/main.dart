import 'package:flutter/material.dart';
import 'screens/announcement_settings.dart';

void main() => runApp(const GMApp());

class GMApp extends StatelessWidget {
  const GMApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
        title: 'GM Bus Announcement',
        theme: ThemeData(primarySwatch: Colors.green, useMaterial3: true),
        home: const AnnouncementSettingsScreen(),
      );
}
