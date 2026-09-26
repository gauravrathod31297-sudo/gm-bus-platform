import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'package:device_info_plus/device_info_plus.dart';

class AuthService extends ChangeNotifier {
  String? _deviceToken;
  int? _clientId;
  int? _busId;
  String? _busNumber;
  String _serverUrl = 'http://192.168.30.125:5000';

  String? get deviceToken => _deviceToken;
  String? get token => _deviceToken;  // legacy alias for announcement_service
  int? get clientId => _clientId;
  int? get busId => _busId;
  String? get busNumber => _busNumber;
  String get serverUrl => _serverUrl;
  bool get isPaired => _deviceToken != null && _busId != null;

  /// QR स्कॅन नंतर मिळालेल्या params ने pair करा
  /// qrData: { client_id, bus_id, bus_number, token }
  Future<Map<String, dynamic>> pair({
    required int clientId,
    required int busId,
    required String busNumber,
    required String pairingToken,
    String? serverUrl,
  }) async {
    if (serverUrl != null) _serverUrl = serverUrl;
    try {
      final deviceInfo = DeviceInfoPlugin();
      String platform = 'unknown';
      String? uuid;
      if (Platform.isAndroid) {
        final a = await deviceInfo.androidInfo;
        platform = 'android';
        uuid = a.id;
      } else if (Platform.isIOS) {
        final i = await deviceInfo.iosInfo;
        platform = 'ios';
        uuid = i.identifierForVendor;
      }
      uuid ??= 'device-${DateTime.now().millisecondsSinceEpoch}';

      final res = await http.post(
        Uri.parse('$_serverUrl/api/bus/pair'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'client_id': clientId,
          'bus_number': busNumber,
          'pairing_token': pairingToken,
          'device_uuid': uuid,
          'platform': platform,
          'app_version': '1.0.0',
        }),
      );
      if (res.statusCode != 200) {
        return {'success': false, 'error': res.body};
      }
      final data = jsonDecode(res.body);
      _deviceToken = data['device_token'];
      _clientId = data['client_id'];
      _busId = data['bus_id'];
      _busNumber = data['bus_number'];

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('device_token', _deviceToken!);
      await prefs.setInt('client_id', _clientId!);
      await prefs.setInt('bus_id', _busId!);
      await prefs.setString('bus_number', _busNumber!);
      await prefs.setString('server_url', _serverUrl);
      notifyListeners();
      return {'success': true, 'bus_id': _busId, 'bus_number': _busNumber};
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  Future<bool> tryAutoLogin() async {
    final prefs = await SharedPreferences.getInstance();
    _deviceToken = prefs.getString('device_token');
    _clientId = prefs.getInt('client_id');
    _busId = prefs.getInt('bus_id');
    _busNumber = prefs.getString('bus_number');
    _serverUrl = prefs.getString('server_url') ?? _serverUrl;
    notifyListeners();
    return isPaired;
  }

  Future<void> logout() async {
    _deviceToken = null; _clientId = null; _busId = null; _busNumber = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    notifyListeners();
  }
}
