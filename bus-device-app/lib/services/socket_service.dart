import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketService extends ChangeNotifier {
  IO.Socket? _socket;
  bool _connected = false;
  bool get isConnected => _connected;
  IO.Socket? get socket => _socket;

  /// Pair झाल्यावर मिळालेला device_token वापरून connect
  void connect(String url, String deviceToken) {
    _socket = IO.io(url, IO.OptionBuilder().setTransports(['websocket']).enableAutoConnect().build());
    _socket!.onConnect((_) {
      _connected = true;
      _socket!.emit('driver:join', {'device_token': deviceToken});
      notifyListeners();
    });
    _socket!.onDisconnect((_) { _connected = false; notifyListeners(); });
    _socket!.on('error', (e) => print('socket error: $e'));
    _socket!.on('joined', (d) => print('✅ driver joined: $d'));
  }

  /// Location — identity socket मध्ये bind आहे, फक्त payload पाठव
  void sendLocation(double lat, double lng, double speed, double heading) {
    _socket?.emit('driver:location', {
      'lat': lat, 'lng': lng, 'speed': speed, 'heading': heading,
    });
  }

  void sendSOS(double lat, double lng, String msg) {
    _socket?.emit('driver:sos', {'lat': lat, 'lng': lng, 'message': msg});
  }

  void disconnect() { _socket?.dispose(); _connected = false; notifyListeners(); }
}
