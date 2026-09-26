import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'screens/live_map_screen.dart';

void main() => runApp(const GMUserApp());

class GMUserApp extends StatelessWidget {
  const GMUserApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'GM Bus Tracking',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(primarySwatch: Colors.green, useMaterial3: true),
      home: const LiveMapScreen(),
    );
  }
}
