import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';

class GpsService extends ChangeNotifier {
  Timer? _timer;
  Position? _currentPosition;
  bool _isTracking = false;
  Position? get currentPosition => _currentPosition;
  bool get isTracking => _isTracking;

  Future<bool> startTracking(Function(Position) onLocation) async {
    LocationPermission perm = await Geolocator.checkPermission();
    if (perm == LocationPermission.denied) perm = await Geolocator.requestPermission();
    if (perm == LocationPermission.deniedForever) return false;
    _isTracking = true; notifyListeners();
    _timer = Timer.periodic(const Duration(seconds: 3), (t) async {
      try {
        final pos = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
        _currentPosition = pos;
        onLocation(pos);
        notifyListeners();
      } catch (e) { print('GPS: $e'); }
    });
    return true;
  }

  void stopTracking() { _timer?.cancel(); _isTracking = false; notifyListeners(); }
}
