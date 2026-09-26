import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/gps_service.dart';
import '../services/socket_service.dart';
import '../services/announcement_service.dart';
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

  Future<void> _init() async {
    final auth = Provider.of<AuthService>(context, listen: false);
    final socket = Provider.of<SocketService>(context, listen: false);
    final ann = Provider.of<AnnouncementService>(context, listen: false);
    
    await ann.init();
    
    if (auth.busId != null && auth.clientId != null) {
      socket.connect(auth.serverUrl, auth.busId!, auth.clientId!);
      // Load stops for this bus's route
      await ann.loadStops(auth.serverUrl, auth.busId!, auth.token ?? '');
    }
  }

  Future<void> _startTracking() async {
    final auth = Provider.of<AuthService>(context, listen: false);
    final gps = Provider.of<GpsService>(context, listen: false);
    final socket = Provider.of<SocketService>(context, listen: false);
    final ann = Provider.of<AnnouncementService>(context, listen: false);

    if (auth.busId == null) { _showBusIdDialog(auth); return; }

    final ok = await gps.startTracking((pos) async {
      // Send location to server
      socket.sendLocation(auth.busId!, auth.clientId!, pos.latitude, pos.longitude, pos.speed, pos.heading);
      
      // Check for stop announcements
      await ann.checkAndAnnounce(
        busLat: pos.latitude,
        busLng: pos.longitude,
        speedKmh: pos.speed * 3.6, // m/s to km/h
        serverUrl: auth.serverUrl,
        token: auth.token ?? '',
        announcementSeconds: 15,
      );
    });
    
    if (ok) {
      ann.start();
      setState(() { _tracking = true; _status = 'चालू'; });
    }
  }

  void _stopTracking() {
    Provider.of<GpsService>(context, listen: false).stopTracking();
    Provider.of<AnnouncementService>(context, listen: false).stop();
    setState(() { _tracking = false; _status = 'बंद'; });
  }

  void _showBusIdDialog(AuthService auth) {
    final ctrl = TextEditingController();
    showDialog(context: context, builder: (_) => AlertDialog(
      title: const Text('Bus ID टाका'),
      content: TextField(controller: ctrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Bus ID')),
      actions: [TextButton(onPressed: () {
        final id = int.tryParse(ctrl.text);
        if (id != null) { 
          auth.setBusId(id); 
          Navigator.pop(context); 
          _init();
          setState(() {}); 
        }
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
    Provider.of<AnnouncementService>(context, listen: false).stop();
    auth.logout();
    Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthService>(context);
    final gps = Provider.of<GpsService>(context);
    final socket = Provider.of<SocketService>(context);
    final ann = Provider.of<AnnouncementService>(context);

    return Scaffold(
      appBar: AppBar(title: const Text('GM Bus - Driver'), actions: [
        IconButton(icon: const Icon(Icons.logout), onPressed: _logout),
      ]),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(children: [
          Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(children: [
            Text('Bus: ${auth.busId ?? "Not set"}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            Text('Driver: ${auth.user?['name'] ?? "Unknown"}'),
            Text(socket.isConnected ? '✅ Server जोडलेला' : '⚠️ जोडणी होत आहे...',
              style: TextStyle(color: socket.isConnected ? Colors.green : Colors.orange)),
          ]))),
          
          const SizedBox(height: 16),
          
          // Current Stop Card
          if (ann.currentStop != null)
            Card(color: Colors.blue.shade50, child: Padding(padding: const EdgeInsets.all(16), child: Column(children: [
              Row(children: [
                const Icon(Icons.location_on, color: Colors.blue, size: 32),
                const SizedBox(width: 12),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('पुढील थांबा / Next Stop', style: TextStyle(fontSize: 12, color: Colors.grey)),
                  Text(ann.currentStop!['stop_name'] ?? 'Unknown', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  if (ann.currentStop!['stop_name_mr'] != null)
                    Text('मराठी: ${ann.currentStop!['stop_name_mr']}', style: const TextStyle(fontSize: 14)),
                  if (ann.currentStop!['stop_name_gu'] != null)
                    Text('ગુજરાતી: ${ann.currentStop!['stop_name_gu']}', style: const TextStyle(fontSize: 14)),
                ])),
              ]),
              const Divider(),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('Stop ${ann.currentStopIndex + 1} of ${ann.stops.length}'),
                Text('✅ ${ann.currentStopIndex} announced'),
              ]),
            ]))),
          
          const SizedBox(height: 16),
          
          // Tracking Status
          Icon(_tracking ? Icons.gps_fixed : Icons.gps_off, size: 80, color: _tracking ? Colors.green : Colors.grey),
          Text('स्थिती: $_status', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          
          if (gps.currentPosition != null) ...[
            const SizedBox(height: 8),
            Text('Lat: ${gps.currentPosition!.latitude.toStringAsFixed(6)}', style: const TextStyle(fontSize: 12)),
            Text('Lng: ${gps.currentPosition!.longitude.toStringAsFixed(6)}', style: const TextStyle(fontSize: 12)),
            Text('Speed: ${(gps.currentPosition!.speed * 3.6).toStringAsFixed(1)} km/h', style: const TextStyle(fontSize: 12)),
          ],
          
          const SizedBox(height: 16),
          
          // Main Button
          SizedBox(width: double.infinity, child: ElevatedButton(
            onPressed: _tracking ? _stopTracking : _startTracking,
            style: ElevatedButton.styleFrom(
              backgroundColor: _tracking ? Colors.red : Colors.green,
              padding: const EdgeInsets.symmetric(vertical: 20),
            ),
            child: Text(_tracking ? 'थांबवा' : 'सुरू करा (Auto Announcement)',
              style: const TextStyle(fontSize: 16, color: Colors.white)),
          )),
          
          const SizedBox(height: 12),
          
          // Manual Announcement Button
          if (ann.currentStop != null && _tracking)
            SizedBox(width: double.infinity, child: OutlinedButton.icon(
              onPressed: () {
                final stop = ann.currentStop!;
                final mr = stop['stop_name_mr'] ?? stop['stop_name'];
                final gu = stop['stop_name_gu'] ?? stop['stop_name'];
                final en = stop['stop_name'];
                ann.speakText('पुढील थांबा $mr. कृपया तयार राहा.', 'mr-IN');
                Future.delayed(const Duration(seconds: 3), () {
                  ann.speakText('આગળનું સ્ટોપ $gu. કૃપા કરીને તૈયાર રહો.', 'gu-IN');
                });
                Future.delayed(const Duration(seconds: 6), () {
                  ann.speakText('Next stop $en. Please be ready.', 'en-IN');
                });
              },
              icon: const Icon(Icons.volume_up),
              label: const Text('🔊 आत्ता Announce करा'),
              style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
            )),
          
          const SizedBox(height: 12),
          
          // SOS Button
          SizedBox(width: double.infinity, child: ElevatedButton.icon(
            onPressed: _sendSOS, icon: const Icon(Icons.warning), label: const Text('🚨 SOS'),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 16)),
          )),
        ]),
      ),
    );
  }
}
