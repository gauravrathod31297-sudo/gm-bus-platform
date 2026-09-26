import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

class LiveMapScreen extends StatefulWidget {
  const LiveMapScreen({super.key});
  @override
  State<LiveMapScreen> createState() => _LiveMapScreenState();
}

class _LiveMapScreenState extends State<LiveMapScreen> {
  late IO.Socket socket;
  final Map<int, LatLng> _buses = {};
  String _status = 'जोडणी होत आहे...';

  @override
  void initState() {
    super.initState();
    _connect();
  }

  void _connect() {
    socket = IO.io('http://localhost:5000', IO.OptionBuilder().setTransports(['websocket']).enableAutoConnect().build());
    socket.onConnect((_) { setState(() => _status = '✅ Live'); });
    socket.onDisconnect((_) { setState(() => _status = '❌ Offline'); });
    socket.on('bus:location', (data) {
      setState(() {
        _buses[data['bus_id']] = LatLng((data['lat'] as num).toDouble(), (data['lng'] as num).toDouble());
      });
    });
  }

  @override
  void dispose() { socket.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('GM Bus Tracking'), actions: [
        Padding(padding: const EdgeInsets.all(12), child: Center(child: Text(_status, style: const TextStyle(fontSize: 14, color: Colors.white)))),
      ]),
      body: Stack(children: [
        FlutterMap(
          options: const MapOptions(initialCenter: LatLng(18.5204, 73.8567), initialZoom: 12),
          children: [
            TileLayer(urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', userAgentPackageName: 'com.gm.user'),
            MarkerLayer(markers: _buses.entries.map((e) => Marker(
              point: e.value, width: 50, height: 50,
              child: const Icon(Icons.directions_bus, color: Colors.blue, size: 40),
            )).toList()),
          ],
        ),
        if (_buses.isEmpty) const Center(child: Card(child: Padding(padding: EdgeInsets.all(16), child: Text('🚌 बस शोधत आहे...')))),
      ]),
    );
  }
}
