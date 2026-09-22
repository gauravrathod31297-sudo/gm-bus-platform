import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/gps_service.dart';
import '../services/socket_service.dart';
import 'login_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  String _status = 'बंद';
  bool _tracking = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _init());
  }

  void _init() {
    final auth = Provider.of<AuthService>(context, listen: false);
    final socket = Provider.of<SocketService>(context, listen: false);
    if (auth.busId != null && auth.clientId != null) {
      socket.connect(auth.serverUrl, auth.busId!, auth.clientId!);
    }
  }

  Future<void> _startTracking() async {
    final auth = Provider.of<AuthService>(context, listen: false);
    final gps = Provider.of<GpsService>(context, listen: false);
    final socket = Provider.of<SocketService>(context, listen: false);

    if (auth.busId == null) { _showBusIdDialog(auth); return; }

    final ok = await gps.startTracking((pos) {
      socket.sendLocation(auth.busId!, auth.clientId!, pos.latitude, pos.longitude, pos.speed, pos.heading);
    });
    if (ok) setState(() { _tracking = true; _status = 'चालू'; });
  }

  void _stopTracking() {
    Provider.of<GpsService>(context, listen: false).stopTracking();
    setState(() { _tracking = false; _status = 'बंद'; });
  }

  void _showBusIdDialog(AuthService auth) {
    final ctrl = TextEditingController();
    showDialog(context: context, builder: (_) => AlertDialog(
      title: const Text('Bus ID टाका'),
      content: TextField(controller: ctrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Bus ID')),
      actions: [TextButton(onPressed: () {
        final id = int.tryParse(ctrl.text);
        if (id != null) { auth.setBusId(id); Navigator.pop(context); setState(() {}); }
      }, child: const Text('Save'))],
    ));
  }

  void _sendSOS() {
    final auth = Provider.of<AuthService>(context, listen: false);
    final gps = Provider.of<GpsService>(context, listen: false);
    final socket = Provider.of<SocketService>(context, listen: false);
    final pos = gps.currentPosition;
    if (pos != null && auth.busId != null) {
      socket.sendSOS(auth.busId!, auth.clientId!, pos.latitude, pos.longitude, 'Emergency!');
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('🚨 SOS पाठवला!')));
    }
  }

  void _logout() {
    final auth = Provider.of<AuthService>(context, listen: false);
    Provider.of<GpsService>(context, listen: false).stopTracking();
    Provider.of<SocketService>(context, listen: false).disconnect();
    auth.logout();
    Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthService>(context);
    final gps = Provider.of<GpsService>(context);
    final socket = Provider.of<SocketService>(context);

    return Scaffold(
      appBar: AppBar(title: const Text('GM Bus - Driver'), actions: [
        IconButton(icon: const Icon(Icons.logout), onPressed: _logout),
      ]),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(children: [
          Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(children: [
            Text('Bus: ${auth.busId ?? "Not set"}', style: const TextStyle(fontSize: 18)),
            Text('Driver: ${auth.user?['name'] ?? "Unknown"}'),
            Text(socket.isConnected ? '✅ Server जोडलेला' : '⚠️ जोडणी होत आहे...'),
          ]))),
          const SizedBox(height: 24),
          Icon(_tracking ? Icons.gps_fixed : Icons.gps_off, size: 100, color: _tracking ? Colors.green : Colors.grey),
          const SizedBox(height: 16),
          Text('स्थिती: $_status', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          if (gps.currentPosition != null) ...[
            const SizedBox(height: 16),
            Text('Lat: ${gps.currentPosition!.latitude.toStringAsFixed(6)}'),
            Text('Lng: ${gps.currentPosition!.longitude.toStringAsFixed(6)}'),
            Text('Speed: ${gps.currentPosition!.speed.toStringAsFixed(1)} km/h'),
          ],
          const SizedBox(height: 32),
          SizedBox(width: double.infinity, child: ElevatedButton(
            onPressed: _tracking ? _stopTracking : _startTracking,
            style: ElevatedButton.styleFrom(
              backgroundColor: _tracking ? Colors.red : Colors.green,
              padding: const EdgeInsets.symmetric(vertical: 20),
            ),
            child: Text(_tracking ? 'थांबवा' : 'सुरू करा', style: const TextStyle(fontSize: 20, color: Colors.white)),
          )),
          const SizedBox(height: 16),
          SizedBox(width: double.infinity, child: ElevatedButton.icon(
            onPressed: _sendSOS, icon: const Icon(Icons.warning), label: const Text('🚨 SOS'),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 16)),
          )),
        ]),
      ),
    );
  }
}
