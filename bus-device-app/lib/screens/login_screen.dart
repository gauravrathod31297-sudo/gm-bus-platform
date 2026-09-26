import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import 'dashboard_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _urlCtrl = TextEditingController(text: 'http://192.168.30.125:5000');
  final _qrCtrl = TextEditingController();
  final _clientIdCtrl = TextEditingController();
  final _busNoCtrl = TextEditingController();
  final _tokenCtrl = TextEditingController();
  bool _loading = false;
  bool _manual = false;
  String? _error;

  Future<void> _pairFromQr() async {
    setState(() { _loading = true; _error = null; });
    try {
      final uri = Uri.parse(_qrCtrl.text.trim());
      final p = uri.queryParameters;
      final clientId = int.tryParse(p['client_id'] ?? '');
      final busNumber = p['bus_number'];
      final token = p['token'];
      if (clientId == null || busNumber == null || token == null) {
        setState(() { _error = 'QR URL मध्ये client_id / bus_number / token नाही'; _loading = false; });
        return;
      }
      await _doPair(clientId, busNumber, token);
    } catch (e) {
      setState(() { _error = 'QR URL चुकीची: $e'; _loading = false; });
    }
  }

  Future<void> _pairManual() async {
    final clientId = int.tryParse(_clientIdCtrl.text.trim());
    final busNumber = _busNoCtrl.text.trim();
    final token = _tokenCtrl.text.trim();
    if (clientId == null || busNumber.isEmpty || token.isEmpty) {
      setState(() => _error = 'सगळी fields भरा');
      return;
    }
    setState(() { _loading = true; _error = null; });
    await _doPair(clientId, busNumber, token);
  }

  Future<void> _doPair(int clientId, String busNumber, String token) async {
    final auth = Provider.of<AuthService>(context, listen: false);
    final res = await auth.pair(
      clientId: clientId,
      busId: 0,
      busNumber: busNumber,
      pairingToken: token,
      serverUrl: _urlCtrl.text.trim(),
    );
    if (!mounted) return;
    if (res['success'] == true) {
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const DashboardScreen()));
    } else {
      setState(() { _error = 'Pair fail: ${res['error']}'; _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.directions_bus, size: 64, color: Colors.blue),
                  const SizedBox(height: 16),
                  const Text('GM Bus Device', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  const Text('QR ने Pair करा', style: TextStyle(color: Colors.grey)),
                  const SizedBox(height: 24),
                  if (_error != null) Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(8)),
                    child: Text(_error!, style: TextStyle(color: Colors.red.shade700)),
                  ),
                  TextField(controller: _urlCtrl, decoration: const InputDecoration(labelText: 'Server URL', border: OutlineInputBorder())),
                  const SizedBox(height: 16),
                  if (!_manual) ...[
                    TextField(
                      controller: _qrCtrl,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        labelText: 'QR URL paste करा',
                        hintText: 'gm-bus://pair?client_id=13&bus_number=...&token=...',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 20),
                    SizedBox(width: double.infinity, child: ElevatedButton(
                      onPressed: _loading ? null : _pairFromQr,
                      style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                      child: _loading ? const CircularProgressIndicator() : const Text('Pair करा'),
                    )),
                  ] else ...[
                    TextField(controller: _clientIdCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Client ID', border: OutlineInputBorder())),
                    const SizedBox(height: 12),
                    TextField(controller: _busNoCtrl, decoration: const InputDecoration(labelText: 'Bus Number', border: OutlineInputBorder())),
                    const SizedBox(height: 12),
                    TextField(controller: _tokenCtrl, decoration: const InputDecoration(labelText: 'Pairing Token', border: OutlineInputBorder())),
                    const SizedBox(height: 20),
                    SizedBox(width: double.infinity, child: ElevatedButton(
                      onPressed: _loading ? null : _pairManual,
                      style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                      child: _loading ? const CircularProgressIndicator() : const Text('Pair करा'),
                    )),
                  ],
                  TextButton(
                    onPressed: () => setState(() => _manual = !_manual),
                    child: Text(_manual ? 'QR URL paste करा' : 'Manual entry'),
                  ),
                ]),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
