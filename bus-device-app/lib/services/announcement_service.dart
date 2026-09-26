import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:http/http.dart' as http;

class AnnouncementService extends ChangeNotifier {
  final FlutterTts _tts = FlutterTts();
  List<Map<String, dynamic>> _stops = [];
  int _currentStopIndex = 0;
  Set<int> _announcedStops = {};
  bool _isActive = false;
  String _currentStopName = '';
  double _lastDistance = 0;

  List<Map<String, dynamic>> get stops => _stops;
  int get currentStopIndex => _currentStopIndex;
  Map<String, dynamic>? get currentStop => 
    _currentStopIndex < _stops.length ? _stops[_currentStopIndex] : null;
  bool get isActive => _isActive;
  String get currentStopName => _currentStopName;

  Future<void> init() async {
    await _tts.setSpeechRate(0.5);
    await _tts.setVolume(1.0);
    await _tts.setPitch(1.0);
  }

  // Load stops from backend
  Future<void> loadStops(String serverUrl, int busId, String token) async {
    try {
      final res = await http.get(
        Uri.parse('$serverUrl/api/bus/$busId'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        _stops = List<Map<String, dynamic>>.from(data['stops'] ?? []);
        _currentStopIndex = 0;
        _announcedStops.clear();
        print('✅ Loaded ${_stops.length} stops for route ${data['route_name']}');
        notifyListeners();
      }
    } catch (e) {
      print('Load stops error: $e');
    }
  }

  // Check if announcement needed based on bus location
  Future<void> checkAndAnnounce({
    required double busLat,
    required double busLng,
    required double speedKmh,
    required String serverUrl,
    required String token,
    required int announcementSeconds, // default 15
  }) async {
    if (!_isActive || _currentStopIndex >= _stops.length) return;

    final stop = _stops[_currentStopIndex];
    final distance = _haversine(busLat, busLng, (stop['lat'] as num).toDouble(), (stop['lng'] as num).toDouble());
    final speed = speedKmh > 0 ? speedKmh : 20;
    final etaSeconds = (distance / 1000) / speed * 3600;

    _lastDistance = distance;
    _currentStopName = stop['stop_name'] ?? '';
    notifyListeners();

    // If ETA <= announcementSeconds AND not already announced
    if (etaSeconds <= announcementSeconds && !_announcedStops.contains(stop['id'])) {
      _announcedStops.add(stop['id']);
      print('🔊 Announcing stop: ${stop['stop_name']} (ETA: ${etaSeconds.toInt()}s, Distance: ${distance.toInt()}m)');

      // Build announcement text for all 3 languages
      final stopMr = stop['stop_name_mr'] ?? stop['stop_name'] ?? '';
      final stopGu = stop['stop_name_gu'] ?? stop['stop_name'] ?? '';
      final stopEn = stop['stop_name'] ?? '';

      // Play Marathi
      if (stopMr.isNotEmpty) {
        await _speak('पुढील थांबा $stopMr. कृपया तयार राहा.', 'mr-IN');
        await Future.delayed(const Duration(milliseconds: 500));
      }
      // Play Gujarati
      if (stopGu.isNotEmpty) {
        await _speak('આગળનું સ્ટોપ $stopGu. કૃપા કરીને તૈયાર રહો.', 'gu-IN');
        await Future.delayed(const Duration(milliseconds: 500));
      }
      // Play English
      if (stopEn.isNotEmpty) {
        await _speak('Next stop $stopEn. Please be ready.', 'en-IN');
      }

      // Move to next stop
      _currentStopIndex++;
      notifyListeners();

      // If reached last stop
      if (_currentStopIndex >= _stops.length) {
        print('🎉 All stops announced!');
        _isActive = false;
        notifyListeners();
      }
    }
  }

  Future<void> _speak(String text, String lang) async {
    try {
      await _tts.setLanguage(lang);
      await _tts.speak(text);
      // Wait for speech to complete (approximate)
      await Future.delayed(Duration(milliseconds: text.length * 80));
    } catch (e) {
      print('TTS error ($lang): $e');
    }
  }

  // Manual announcement (test)
  Future<void> speakText(String text, String lang) async {
    await _speak(text, lang);
  }

  void start() {
    _isActive = true;
    _currentStopIndex = 0;
    _announcedStops.clear();
    notifyListeners();
  }

  void stop() {
    _isActive = false;
    _tts.stop();
    notifyListeners();
  }

  void reset() {
    _currentStopIndex = 0;
    _announcedStops.clear();
    notifyListeners();
  }

  void skipToNext() {
    if (_currentStopIndex < _stops.length - 1) {
      _currentStopIndex++;
      notifyListeners();
    }
  }

  double _haversine(double lat1, double lng1, double lat2, double lng2) {
    const R = 6371000.0;
    final dLat = _toRad(lat2 - lat1);
    final dLng = _toRad(lng2 - lng1);
    final a = (dLat / 2).abs() * (dLat / 2).abs() +
        (lat1 * 3.14159 / 180).abs() * (lat2 * 3.14159 / 180).abs() *
        (dLng / 2).abs() * (dLng / 2).abs();
    return R * 2 * ((a).abs());
  }

  double _toRad(double deg) => deg * 3.14159 / 180;
}
