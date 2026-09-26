import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;

class AuthService extends ChangeNotifier {
  String? _token;
  Map<String, dynamic>? _user;
  int? _clientId;
  int? _busId;
  String _serverUrl = 'http://localhost:5000';

  String? get token => _token;
  Map<String, dynamic>? get user => _user;
  int? get clientId => _clientId;
  int? get busId => _busId;
  String get serverUrl => _serverUrl;
  bool get isLoggedIn => _token != null;

  Future<bool> login(String email, String password, String url) async {
    _serverUrl = url;
    try {
      final res = await http.post(
        Uri.parse('$url/api/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        _token = data['token'];
        _user = data['user'];
        _clientId = data['user']['company_id'];
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', _token!);
        await prefs.setString('user', jsonEncode(_user));
        await prefs.setInt('client_id', _clientId!);
        await prefs.setString('server_url', url);
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) { print('Login error: $e'); return false; }
  }

  Future<void> setBusId(int id) async {
    _busId = id;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('bus_id', id);
    notifyListeners();
  }

  Future<bool> tryAutoLogin() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('token');
    final u = prefs.getString('user');
    if (u != null) _user = jsonDecode(u);
    _clientId = prefs.getInt('client_id');
    _busId = prefs.getInt('bus_id');
    _serverUrl = prefs.getString('server_url') ?? 'http://localhost:5000';
    notifyListeners();
    return _token != null;
  }

  Future<void> logout() async {
    _token = null; _user = null; _clientId = null; _busId = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    notifyListeners();
  }
}
