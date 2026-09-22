import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'screens/login_screen.dart';
import 'services/auth_service.dart';
import 'services/socket_service.dart';
import 'services/gps_service.dart';
import 'services/announcement_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(MultiProvider(providers: [
    ChangeNotifierProvider(create: (_) => AuthService()),
    ChangeNotifierProvider(create: (_) => SocketService()),
    ChangeNotifierProvider(create: (_) => GpsService()),
    ChangeNotifierProvider(create: (_) => AnnouncementService()),
  ], child: const GMBusDeviceApp()));
}

class GMBusDeviceApp extends StatelessWidget {
  const GMBusDeviceApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'GM Bus Device',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(primarySwatch: Colors.blue, useMaterial3: true),
      home: const LoginScreen(),
    );
  }
}
