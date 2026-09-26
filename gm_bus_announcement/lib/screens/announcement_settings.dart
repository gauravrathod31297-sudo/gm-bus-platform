import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/tts_service.dart';

class AnnouncementSettingsScreen extends StatefulWidget {
  const AnnouncementSettingsScreen({super.key});
  @override
  State<AnnouncementSettingsScreen> createState() => _S();
}
class _S extends State<AnnouncementSettingsScreen> {
  String mode = 'manual';
  List<String> langs = ['GU'];
  double timer = 15;
  final all = {'MR':'मराठी (Marathi)','GU':'ગુજરાતી (Gujarati)','EN':'English','HI':'हिंदी (Hindi)'};

  @override
  void initState() { super.initState(); _load(); }

  _load() async {
    final p = await SharedPreferences.getInstance();
    setState(() {
      mode = p.getString('mode') ?? 'manual';
      langs = p.getStringList('langs') ?? ['GU'];
      timer = (p.getInt('timer') ?? 15).toDouble();
    });
  }

  _save() async {
    final p = await SharedPreferences.getInstance();
    await p.setString('mode', mode);
    await p.setStringList('langs', langs);
    await p.setInt('timer', timer.toInt());
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Saved ✅')));
  }

  @override
  Widget build(BuildContext c) => Scaffold(
    appBar: AppBar(title: const Text('🔊 Announcement Mode')),
    body: ListView(padding: const EdgeInsets.all(16), children: [
      const Text('✋ Manual Mode (select करा)', style: TextStyle(fontWeight: FontWeight.bold)),
      const SizedBox(height: 8),
      const Text('खाली निवडलेल्या भाषांमध्येच announcement play होईल'),
      const Divider(height: 32),
      const Text('भाषा निवडा (Languages)', style: TextStyle(fontWeight: FontWeight.bold)),
      ...all.entries.map((e) => CheckboxListTile(
        title: Text(e.value),
        value: langs.contains(e.key),
        onChanged: (v) => setState(() => v! ? langs.add(e.key) : langs.remove(e.key)),
      )),
      const Divider(height: 32),
      const Text('⏱️ Announcement Timer (seconds before stop)', style: TextStyle(fontWeight: FontWeight.bold)),
      Text('${timer.toInt()} sec before → ${timer.toInt()}'),
      Slider(value: timer, min: 5, max: 60, divisions: 11, label: timer.toInt().toString(),
        onChanged: (v) => setState(() => timer = v)),
      const Text('बस stop पासून किती सेकंद आधी announcement play करायचा'),
      const SizedBox(height: 24),
      ElevatedButton.icon(onPressed: _save, icon: const Icon(Icons.save), label: const Text('Save Settings')),
      const SizedBox(height: 12),
      OutlinedButton.icon(
        onPressed: () => TtsService.speak(langs.isEmpty ? 'EN' : langs.first, 'Test Stop'),
        icon: const Icon(Icons.volume_up), label: const Text('🔊 Test Voice')),
      const SizedBox(height: 12),
      Card(child: Padding(padding: const EdgeInsets.all(12), child: Column(
        crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('📋 Preview', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          Text('Mode: ✋ ${mode == 'manual' ? 'Manual' : 'Auto'}'),
          Text('Languages: ${langs.join(', ')}'),
          Text('Timer: ${timer.toInt()} seconds before stop'),
          const Text('Announcement sequence:'),
          ...langs.asMap().entries.map((e) => Text('${e.key + 1}. 🗣️ ${e.value} announcement')),
        ],
      ))),
    ]),
  );
}
