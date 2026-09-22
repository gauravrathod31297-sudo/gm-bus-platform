import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketService extends ChangeNotifier {
  IO.Socket? _socket;
  bool _connected = false;
  bool get isConnected => _connected;
  IO.Socket? get socket => _socket;

  void connect(String url, int busId, int clientId) {
    _socket = IO.io(url, IO.OptionBuilder().setTransports(['websocket']).enableAutoConnect().build());
    _socket!.onConnect((_) {
      _connected = true;
      _socket!.emit('driver:join', {'bus_id': busId, 'client_id': clientId});
      notifyListeners();
    });
    _socket!.onDisconnect((_) { _connected = false; notifyListeners(); });
  }

  void sendLocation(int busId, int clientId, double lat, double lng, double speed, double heading) {
    _socket?.emit('driver:location', {'bus_id': busId, 'client_id': clientId, 'lat': lat, 'lng': lng, 'speed': speed, 'heading': heading});
  }

  void sendSOS(int busId, int clientId, double lat, double lng, String msg) {
    _socket?.emit('driver:sos', {'bus_id': busId, 'client_id': clientId, 'lat': lat, 'lng': lng, 'message': msg});
  }

  void disconnect() { _socket?.dispose(); _connected = false; notifyListeners(); }
}
